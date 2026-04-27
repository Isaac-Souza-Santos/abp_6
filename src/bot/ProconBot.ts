import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import winston from 'winston';
import { MessageHandler } from '../handlers/MessageHandler';
import { getAuthPath } from '../config/paths';
import { telefoneParaChatIdWhatsapp } from '../utils/whatsappChatId';
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
          'pkill -9 chrome 2>/dev/null || true; pkill -9 google-chrome 2>/dev/null || true; ' +
          // Best-effort match por comando completo (binários empacotados pelo Puppeteer variam de nome).
          'pkill -9 -f "(chrome|chromium|headless_shell|puppeteer)" 2>/dev/null || true',
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

/** Em Windows/local também podem sobrar processos órfãos entre retries; limpar reduz "Target closed" no boot. */
function killChromiumProcessesBestEffort(): void {
  if (process.platform === 'linux') {
    killChromiumProcessesInContainer();
    return;
  }
  if (process.platform === 'win32') {
    try {
      execFileSync(
        'cmd.exe',
        [
          '/c',
          'taskkill /F /IM chrome.exe /T >NUL 2>&1 & ' +
            'taskkill /F /IM chromium.exe /T >NUL 2>&1 & ' +
            'taskkill /F /IM msedge.exe /T >NUL 2>&1',
        ],
        { stdio: 'ignore', timeout: 8000 }
      );
    } catch {
      /* ignore */
    }
    return;
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
  const allowSessionRm = process.env.FORCE_CHROME_SESSION_RM !== '0';
  if (!allowSessionRm || process.env.SKIP_CHROME_SESSION_RM_ON_SINGLETON === '1') return;
  forceRemoveChromeSessionDir(sessionDir, 'apos erro singleton / Azure Files');
}

/** Antes de cada launch: se existirem marcas Singleton* (crash/restart), apaga session inteira. */
function preemptRemoveChromeSessionDirIfSingletonArtifacts(sessionDir: string): void {
  if (!wantsAggressiveChromeLockSweep()) return;
  const allowSessionRm = process.env.FORCE_CHROME_SESSION_RM !== '0';
  if (!allowSessionRm || process.env.SKIP_CHROME_SESSION_RM_ON_SINGLETON === '1') return;
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
  private authenticated = false;

  constructor() {
    const hasHeadlessOverride = typeof process.env.HEADLESS === 'string';
    // Default headless=true in all platforms to avoid opening WhatsApp Web UI.
    const headless = hasHeadlessOverride ? process.env.HEADLESS !== 'false' : true;
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
          '--disable-features=Translate,BackForwardCache',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--no-first-run',
          '--no-default-browser-check',
        ],
      },
    });
    this.messageHandler = new MessageHandler();
  }

  private async waitForReadyWithTimeout(timeoutMs: number): Promise<void> {
    if (this.ready) return;

    await new Promise<void>((resolve, reject) => {
      let done = false;

      const cleanup = (): void => {
        clearTimeout(timer);
        this.client.off('ready', onReady);
        this.client.off('auth_failure', onAuthFailure);
        this.client.off('disconnected', onDisconnected);
      };

      const settle = (fn: () => void): void => {
        if (done) return;
        done = true;
        cleanup();
        fn();
      };

      const onReady = (): void => {
        this.ready = true;
        settle(() => resolve());
      };

      const onAuthFailure = (msg: string): void => {
        this.ready = false;
        this.authenticated = false;
        settle(() => reject(new Error(`Auth failure before ready: ${msg}`)));
      };

      const onDisconnected = (reason?: string): void => {
        this.ready = false;
        settle(() => reject(new Error(`Disconnected before ready: ${reason || 'unknown'}`)));
      };

      const timer = setTimeout(() => {
        void (async () => {
          try {
            const state = await this.client.getState();
            if (state === 'CONNECTED') {
              this.ready = true;
              settle(() => resolve());
              return;
            }
            settle(() => reject(new Error(`Timed out waiting for WhatsApp ready (state=${state}).`)));
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            settle(() => reject(new Error(`Timed out waiting for WhatsApp ready (state unavailable: ${msg}).`)));
          }
        })();
      }, timeoutMs);

      this.client.on('ready', onReady);
      this.client.on('auth_failure', onAuthFailure);
      this.client.on('disconnected', onDisconnected);
    });
  }

  async start(): Promise<void> {
    logger.info('Iniciando bot Procon Jacareí', { authPath: AUTH_PATH, exists: fs.existsSync(AUTH_PATH) });
    logger.info('Sessão WhatsApp configurada', { authPath: AUTH_PATH, exists: fs.existsSync(AUTH_PATH) });
    let n = clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
    if (wantsAggressiveChromeLockSweep()) {
      await new Promise((r) => setTimeout(r, 400));
      n += clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
    }
    logger.info('Locks de perfil Chrome removidos', { removed: n, profile: CHROME_USER_DATA_DIR });
    let qrJaMostrado = false;
    this.client.on('qr', (qr) => {
      if (!qrJaMostrado) console.log('\nQR Code WhatsApp:\n');
      qrJaMostrado = true;
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.ready = true;
      this.authenticated = true;
      logger.info('Bot conectado e pronto');
      console.log('✅ Bot conectado e pronto.');
    });

    this.client.on('authenticated', () => {
      this.authenticated = true;
      logger.info('Autenticação bem-sucedida');
    });

    this.client.on('auth_failure', (msg) => {
      this.ready = false;
      this.authenticated = false;
      logger.error('Falha na autenticação', { error: msg });
      console.error('❌ Falha na autenticação:', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      console.warn('⚠️ Conexão perdida:', reason || 'desconhecido');
    });

    this.client.on('message', async (msg) => {
      logger.debug('Mensagem recebida', { from: msg.from, body: msg.body?.substring(0, 100) });
      try {
        await this.messageHandler.handle(this.client, msg);
      } catch (error) {
        logger.error('Erro ao processar mensagem', { error, from: msg.from });
      }
    });

    logger.info('Inicializando cliente WhatsApp', {
      aggressive: wantsAggressiveChromeLockSweep(),
      sessionRmOnSingletonRetry: process.env.SKIP_CHROME_SESSION_RM_ON_SINGLETON !== '1',
      forceSessionRm: process.env.FORCE_CHROME_SESSION_RM !== '0',
      bootMarker: 'procon-chrome-2026-04-postkill-sync',
    });
    const maxTentativas = wantsAggressiveChromeLockSweep() ? 6 : 3;
    const primeiraEsperaMs = wantsAggressiveChromeLockSweep() ? 2500 : 2000;
    const posSweepMs = Number(process.env.CHROME_POST_SWEEP_MS || (wantsAggressiveChromeLockSweep() ? 600 : 0));
    const retryBackoffMs = (attempt: number): number => {
      if (attempt < 2) return 0;
      if (!wantsAggressiveChromeLockSweep()) return 4000;
      const seq = [8000, 16000, 25000, 35000, 45000];
      return seq[Math.min(attempt - 2, seq.length - 1)] ?? 45000;
    };
    let transientPuppeteerFailures = 0;

    for (let t = 1; t <= maxTentativas; t++) {
      try {
        if (t > 1) {
          clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
          await new Promise((r) => setTimeout(r, retryBackoffMs(t)));
        } else {
          await new Promise((r) => setTimeout(r, primeiraEsperaMs));
        }
        const preLaunch = clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
        if (preLaunch > 0) logger.info('Locks removidos antes do launch', { removed: preLaunch });
        if (posSweepMs > 0) {
          await new Promise((r) => setTimeout(r, posSweepMs));
        }
        preemptRemoveChromeSessionDirIfSingletonArtifacts(CHROME_USER_DATA_DIR);
        killChromiumProcessesBestEffort();
        if (wantsAggressiveChromeLockSweep()) {
          await new Promise((r) => setTimeout(r, 1200));
          killChromiumProcessesBestEffort();
          clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
        }
        await this.client.initialize();
        await this.waitForReadyWithTimeout(Number(process.env.WA_READY_TIMEOUT_MS || 120000));
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const chromeSingleton =
          msg.includes('browser is already running') || msg.includes('Use a different `userDataDir`');
        const transientPuppeteer =
          msg.includes('Execution context was destroyed') ||
          msg.includes('Target closed') ||
          msg.includes('Navigating frame was detached') ||
          msg.includes('LifecycleWatcher disposed');
        const waitingReadyTimeout = msg.includes('Timed out waiting for WhatsApp ready');
        const disconnectedBeforeReady = msg.includes('Disconnected before ready');
        const retryableReadyIssue = waitingReadyTimeout || disconnectedBeforeReady;
        const podeTentarDeNovo = (chromeSingleton || transientPuppeteer || retryableReadyIssue) && t < maxTentativas;
        if (podeTentarDeNovo) {
          if (transientPuppeteer) {
            transientPuppeteerFailures += 1;
          } else {
            transientPuppeteerFailures = 0;
          }
          this.ready = false;
          await closePuppeteerBrowserIfAny(this.client);
          killChromiumProcessesBestEffort();
          const postKillMs = wantsAggressiveChromeLockSweep()
            ? Number(process.env.CHROME_POST_KILL_MS || 4000)
            : 600;
          if (postKillMs > 0) {
            await new Promise((r) => setTimeout(r, postKillMs));
          }
          killChromiumProcessesBestEffort();
          clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
          if (transientPuppeteerFailures >= 2) {
            if (process.env.FORCE_CHROME_SESSION_RM !== '0') {
              forceRemoveChromeSessionDir(CHROME_USER_DATA_DIR, 'apos falhas repetidas "Target closed"');
            }
            transientPuppeteerFailures = 0;
          }
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
            `⚠️ Tentativa ${t} falhou (${msg.slice(0, 80)}...). Nova tentativa em ${Math.round(proximaEspera / 1000)}s.`
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

  /**
   * Envia mensagem de texto ao número (formato guardado no agendamento).
   * Só funciona com a sessão WhatsApp Web ligada e número válido.
   */
  async sendWhatsAppText(telefoneRaw: string, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.ready) {
      return { ok: false, error: 'Bot ainda não está pronto (WhatsApp desligado ou a conectar).' };
    }
    const chatId = telefoneParaChatIdWhatsapp(telefoneRaw);
    if (!chatId) {
      return { ok: false, error: `Destinatário inválido para WhatsApp: "${telefoneRaw}".` };
    }
    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: false, error: 'Mensagem vazia.' };
    }
    try {
      await this.client.sendMessage(chatId, trimmed);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
}
