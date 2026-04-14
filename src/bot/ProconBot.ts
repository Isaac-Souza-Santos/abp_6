import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import winston from 'winston';
import { MessageHandler } from '../handlers/MessageHandler';
import { getAuthPath } from '../config/paths';
import { clearStaleChromiumProfileLocks } from './chromiumProfileLocks';

const AUTH_PATH = getAuthPath();
/** LocalAuth usa esta pasta como userDataDir do Puppeteer/Chromium. */
const CHROME_USER_DATA_DIR = path.join(AUTH_PATH, 'session');

/** Volume partilhado / K8s: locks órfãos ou sockets são frequentes; exige limpeza extra e pausa curta antes do launch. */
function wantsAggressiveChromeLockSweep(): boolean {
  return (
    AUTH_PATH.includes('persist') ||
    process.env.FORCE_CHROME_LOCK_SWEEP === '1' ||
    Boolean(process.env.CONTAINER_APP_NAME?.trim()) ||
    Boolean(process.env.KUBERNETES_SERVICE_HOST)
  );
}

/** Após initialize() falhar, o whatsapp-web.js pode deixar o Chromium aberto; o retry sem fechar dispara "browser is already running". */
async function closePuppeteerBrowserIfAny(client: Client): Promise<void> {
  const pup = (client as unknown as { pupBrowser?: { isConnected?: () => boolean; close: () => Promise<unknown> } })
    .pupBrowser;
  if (!pup) return;
  try {
    if (typeof pup.isConnected === 'function' && !pup.isConnected()) return;
  } catch {
    /* ignore */
  }
  try {
    await Promise.race([
      pup.close(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12_000)),
    ]);
  } catch {
    /* ignore */
  }
}

/** No contentor Linux só existe o nosso Chromium; mata órfãos que seguram userDataDir no Azure Files. */
function killChromiumProcessesInContainer(): void {
  if (process.platform !== 'linux' || !wantsAggressiveChromeLockSweep()) return;
  try {
    execFileSync(
      '/bin/sh',
      [
        '-c',
        'pkill -9 chromium 2>/dev/null || true; pkill -9 chromium-browser 2>/dev/null || true; ' +
          'pkill -9 chrome 2>/dev/null || true; pkill -9 google-chrome 2>/dev/null || true',
      ],
      { stdio: 'ignore', timeout: 8000 }
    );
  } catch {
    /* ignore */
  }
  try {
    execFileSync('/bin/sh', ['-c', 'sleep 0.5'], { stdio: 'ignore', timeout: 2000 });
  } catch {
    /* ignore */
  }
}

function trySyncFilesystem(): void {
  if (process.platform !== 'linux') return;
  for (const bin of ['/bin/sync', '/usr/bin/sync']) {
    try {
      execFileSync(bin, { stdio: 'ignore', timeout: 15_000 });
      return;
    } catch {
      /* try next */
    }
  }
}

/**
 * No Azure Files, locks/SingletonLock podem ficar “presos” sem processo real; apagar o userDataDir
 * força um perfil novo no próximo launch. Credenciais LocalAuth ficam em `dataPath` (AUTH_PATH), não
 * necessariamente só em `session/` — em caso de sessão WhatsApp inválida, pode ser preciso escanear
 * o QR de novo. Desative com `SKIP_CHROME_SESSION_RM_ON_SINGLETON=1`.
 */
function forceRemoveChromeSessionDir(sessionDir: string, reason: string): void {
  if (!fs.existsSync(sessionDir)) return;
  try {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    trySyncFilesystem();
    console.warn(`🧨 Pasta session removida (${reason}).`);
  } catch (e) {
    logger.warn('Falha ao remover diretório session', { reason, error: e instanceof Error ? e.message : String(e) });
  }
}

function removeChromeSessionDirAfterSingletonLock(sessionDir: string): void {
  if (!wantsAggressiveChromeLockSweep()) return;
  if (process.env.SKIP_CHROME_SESSION_RM_ON_SINGLETON === '1') return;
  forceRemoveChromeSessionDir(sessionDir, 'apos erro singleton / Azure Files');
}

/** Antes de cada launch: se existirem marcas Singleton* (crash/restart), apaga session inteira. */
function preemptRemoveChromeSessionDirIfSingletonArtifacts(sessionDir: string): void {
  if (!wantsAggressiveChromeLockSweep()) return;
  if (process.env.SKIP_CHROME_SESSION_RM_ON_SINGLETON === '1') return;
  if (!fs.existsSync(sessionDir)) return;
  const markers = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'].map((name) => path.join(sessionDir, name));
  if (!markers.some((p) => fs.existsSync(p))) return;
  forceRemoveChromeSessionDir(sessionDir, 'antes do launch (Singleton* no volume)');
}

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'procon-bot' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If not in production, log to console too
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export class ProconBot {
  private client: Client;
  private messageHandler: MessageHandler;
  private ready = false;

  constructor() {
    const headless = process.env.HEADLESS !== 'false';
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH?.trim() ||
      process.env.CHROME_PATH?.trim();
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
      puppeteer: {
        headless,
        ...(executablePath ? { executablePath } : {}),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
        ],
      },
    });
    this.messageHandler = new MessageHandler();
  }

  async start(): Promise<void> {
    logger.info('Iniciando bot Procon Jacareí', { authPath: AUTH_PATH, exists: fs.existsSync(AUTH_PATH) });
    console.log('📂 Sessão em:', AUTH_PATH, fs.existsSync(AUTH_PATH) ? '(pasta existe)' : '(pasta não encontrada — será criada ao escanear QR)');
    if (process.env.CHROME_SESSION_EMPTYDIR === '1') {
      console.log(
        '🔗 CHROME_SESSION_EMPTYDIR: a pasta `session` do Chromium esta num volume EmptyDir (disco local da replica). A sessao WhatsApp Web pode exigir novo QR apos cada novo pod.'
      );
    }
    let n = clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
    if (wantsAggressiveChromeLockSweep()) {
      await new Promise((r) => setTimeout(r, 400));
      n += clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
    }
    console.log(
      `🧹 Locks Chrome removidos: ${n} (perfil: ${CHROME_USER_DATA_DIR}). ` +
        'Nos logs deve aparecer a linha "Chrome:" com bootMarker; se nao aparecer, a imagem no ACA ainda e antiga.'
    );
    let qrJaMostrado = false;
    this.client.on('qr', (qr) => {
      if (qrJaMostrado) {
        console.log('\n⏱️ QR anterior expirou. Novo QR abaixo:');
        console.log('   (Se o celular mostrou "não foi possível conectar", escaneie ESTE QR novo.)\n');
      } else {
        console.log('\n📱 Escaneie o QR Code com o WhatsApp (número do Procon):');
        console.log('   O QR expira em ~60 segundos — escaneie logo.\n');
      }
      qrJaMostrado = true;
      qrcode.generate(qr, { small: true });
      console.log('\n📲 No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho.');
      console.log('   Use sempre o QR que está aparecendo AGORA no terminal.\n');
    });

    this.client.on('ready', () => {
      this.ready = true;
      logger.info('Bot conectado e pronto');
      console.log('✅ Bot Procon Jacareí conectado e pronto! (sessão salva — não precisou de QR)');
    });

    this.client.on('authenticated', () => {
      logger.info('Autenticação bem-sucedida');
      console.log('🔐 Autenticado com sucesso.');
    });

    this.client.on('auth_failure', (msg) => {
      this.ready = false;
      logger.error('Falha na autenticação', { error: msg });
      console.error('❌ Falha na autenticação:', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      console.warn('⚠️ Conexão perdida:', reason || 'desconhecido');
      console.warn('   Se um novo QR aparecer, escaneie-o para reconectar.\n');
    });

    this.client.on('message', async (msg) => {
      logger.debug('Mensagem recebida', { from: msg.from, body: msg.body?.substring(0, 100) });
      try {
        await this.messageHandler.handle(this.client, msg);
      } catch (error) {
        logger.error('Erro ao processar mensagem', { error, from: msg.from });
      }
    });

    console.log('⏳ Inicializando cliente WhatsApp... (aguarde; se precisar de login, o QR Code aparecerá aqui em seguida)\n');
    console.log(
      '🔧 Chrome:',
      JSON.stringify({
        aggressive: wantsAggressiveChromeLockSweep(),
        sessionRmOnSingletonRetry: process.env.SKIP_CHROME_SESSION_RM_ON_SINGLETON !== '1',
        bootMarker: 'procon-chrome-2026-04-postkill-sync',
      })
    );
    const maxTentativas = wantsAggressiveChromeLockSweep() ? 6 : 3;
    const primeiraEsperaMs = wantsAggressiveChromeLockSweep() ? 2500 : 2000;
    const posSweepMs = Number(process.env.CHROME_POST_SWEEP_MS || (wantsAggressiveChromeLockSweep() ? 600 : 0));
    const retryBackoffMs = (attempt: number): number => {
      if (attempt < 2) return 0;
      if (!wantsAggressiveChromeLockSweep()) return 4000;
      const seq = [8000, 16000, 25000, 35000, 45000];
      return seq[Math.min(attempt - 2, seq.length - 1)] ?? 45000;
    };

    for (let t = 1; t <= maxTentativas; t++) {
      try {
        if (t > 1) {
          clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
          await new Promise((r) => setTimeout(r, retryBackoffMs(t)));
        } else {
          await new Promise((r) => setTimeout(r, primeiraEsperaMs));
        }
        const preLaunch = clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
        if (preLaunch > 0) {
          console.log(`🧹 Locks removidos imediatamente antes do launch: ${preLaunch}`);
        }
        if (posSweepMs > 0) {
          await new Promise((r) => setTimeout(r, posSweepMs));
        }
        preemptRemoveChromeSessionDirIfSingletonArtifacts(CHROME_USER_DATA_DIR);
        killChromiumProcessesInContainer();
        await this.client.initialize();
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const chromeSingleton =
          msg.includes('browser is already running') || msg.includes('Use a different `userDataDir`');
        const transientPuppeteer =
          msg.includes('Execution context was destroyed') || msg.includes('Target closed');
        const podeTentarDeNovo = (chromeSingleton || transientPuppeteer) && t < maxTentativas;
        if (podeTentarDeNovo) {
          await closePuppeteerBrowserIfAny(this.client);
          killChromiumProcessesInContainer();
          const postKillMs = wantsAggressiveChromeLockSweep()
            ? Number(process.env.CHROME_POST_KILL_MS || 4000)
            : 600;
          if (postKillMs > 0) {
            await new Promise((r) => setTimeout(r, postKillMs));
          }
          killChromiumProcessesInContainer();
          clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
          if (chromeSingleton) {
            removeChromeSessionDirAfterSingletonLock(CHROME_USER_DATA_DIR);
            const postRmMs = wantsAggressiveChromeLockSweep()
              ? Number(process.env.CHROME_POST_SESSION_RM_MS || 7000)
              : 0;
            if (postRmMs > 0) {
              await new Promise((r) => setTimeout(r, postRmMs));
            }
          }
          const proximaEspera = retryBackoffMs(t + 1);
          console.warn(
            `\n⚠️ Tentativa ${t} falhou (${msg.slice(0, 80)}...). ` +
              (chromeSingleton
                ? 'Fechando/pkill Chromium, limpando locks e apagando pasta session no volume (Azure Files) se aplicável; '
                : 'Fechando/pkill Chromium; ') +
              `aguardando ${Math.round(proximaEspera / 1000)}s para tentar de novo...\n`
          );
        } else {
          throw err;
        }
      }
    }
  }

  isReady(): boolean {
    return this.ready;
  }
}
