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
    const n = clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
    if (n > 0) {
      console.log(`🧹 Removidos ${n} arquivo(s) de lock órfão do Chrome (perfil em volume — normal após reinício do container).`);
    }
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
    const maxTentativas = 3;
    for (let t = 1; t <= maxTentativas; t++) {
      try {
        if (t > 1) {
          clearStaleChromiumProfileLocks(CHROME_USER_DATA_DIR);
          await new Promise((r) => setTimeout(r, 4000));
        } else {
          await new Promise((r) => setTimeout(r, 2000));
        }
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
          console.warn(
            `\n⚠️ Tentativa ${t} falhou (${msg.slice(0, 80)}...). ` +
              (chromeSingleton ? 'Limpando locks do Chrome e ' : '') +
              'aguardando 4s para tentar de novo...\n'
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
