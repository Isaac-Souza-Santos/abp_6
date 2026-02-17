import path from 'path';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { MessageHandler } from '../handlers/MessageHandler';

// Pasta de sessão no diretório do projeto (sempre a mesma, onde você roda npm run dev / npm start)
const AUTH_PATH = path.join(process.cwd(), '.wwebjs_auth');

export class ProconBot {
  private client: Client;
  private messageHandler: MessageHandler;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });
    this.messageHandler = new MessageHandler();
  }

  async start(): Promise<void> {
    let qrJaMostrado = false;
    this.client.on('qr', (qr) => {
      if (qrJaMostrado) {
        console.log('\n⏱️ QR anterior expirou. Reinicie o bot (Ctrl+C e depois npm run dev) para ver um novo.\n');
        return;
      }
      qrJaMostrado = true;
      console.log('\n📱 Escaneie o QR Code com o WhatsApp (número do Procon):\n');
      qrcode.generate(qr, { small: true });
      console.log('\n(Este QR não será substituído. Se expirar, reinicie o bot.)\n');
    });

    this.client.on('ready', () => {
      console.log('✅ Bot Procon Jacareí conectado e pronto!');
    });

    this.client.on('authenticated', () => {
      console.log('🔐 Autenticado com sucesso.');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação:', msg);
    });

    this.client.on('message', async (msg) => {
      await this.messageHandler.handle(this.client, msg);
    });

    await this.client.initialize();
  }
}
