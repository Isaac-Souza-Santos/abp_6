import path from 'path';
import * as fs from 'fs';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { MessageHandler } from '../handlers/MessageHandler';
import { getAuthPath } from '../config/paths';

const AUTH_PATH = getAuthPath();

export class ProconBot {
  private client: Client;
  private messageHandler: MessageHandler;

  constructor() {
    const headless = process.env.HEADLESS !== 'false';
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
      puppeteer: {
        headless,
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
    console.log('📂 Sessão em:', AUTH_PATH, fs.existsSync(AUTH_PATH) ? '(pasta existe)' : '(pasta não encontrada — será criada ao escanear QR)');
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
      console.log('✅ Bot Procon Jacareí conectado e pronto! (sessão salva — não precisou de QR)');
    });

    this.client.on('authenticated', () => {
      console.log('🔐 Autenticado com sucesso.');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação:', msg);
    });

    this.client.on('disconnected', (reason) => {
      console.warn('⚠️ Conexão perdida:', reason || 'desconhecido');
      console.warn('   Se um novo QR aparecer, escaneie-o para reconectar.\n');
    });

    this.client.on('message', async (msg) => {
      await this.messageHandler.handle(this.client, msg);
    });

    console.log('⏳ Inicializando cliente WhatsApp... (aguarde; se precisar de login, o QR Code aparecerá aqui em seguida)\n');
    const maxTentativas = 2;
    for (let t = 1; t <= maxTentativas; t++) {
      try {
        if (t > 1) {
          await new Promise((r) => setTimeout(r, 4000));
        } else {
          await new Promise((r) => setTimeout(r, 2000));
        }
        await this.client.initialize();
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const podeTentarDeNovo =
          (msg.includes('Execution context was destroyed') || msg.includes('Target closed')) &&
          t < maxTentativas;
        if (podeTentarDeNovo) {
          console.warn(`\n⚠️ Tentativa ${t} falhou (${msg.slice(0, 50)}...). Aguardando 4s para tentar de novo...\n`);
        } else {
          throw err;
        }
      }
    }
  }
}
