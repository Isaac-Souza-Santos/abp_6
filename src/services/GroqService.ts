import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

const DUVIDAS_PATH = path.join(__dirname, '../../.github/DUVIDAS.TXT');
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
/** Limite de caracteres do contexto para caber no tier gratuito Groq (≈6000 tokens por request). */
const MAX_CONTEXTO_CHARS = 7000;

/**
 * Serviço para consultar a API Groq com contexto do Procon (CDC e dúvidas frequentes).
 * Usado quando o usuário envia uma mensagem que não é comando do menu.
 */
export class GroqService {
  private client: Groq | null = null;
  private contextoDuvidas: string = '';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || process.env.GROQ;
    if (apiKey) {
      this.client = new Groq({ apiKey });
      this.carregarContexto();
    }
  }

  estaDisponivel(): boolean {
    return this.client !== null;
  }

  private carregarContexto(): void {
    try {
      if (fs.existsSync(DUVIDAS_PATH)) {
        this.contextoDuvidas = fs.readFileSync(DUVIDAS_PATH, 'utf-8').trim();
      }
    } catch {
      this.contextoDuvidas = '';
    }
  }

  /**
   * Envia a pergunta do consumidor para a Groq com contexto Procon/CDC.
   * Respostas curtas e objetivas para WhatsApp.
   */
  async perguntar(pergunta: string): Promise<string> {
    if (!this.client) {
      return '';
    }

    const systemPrompt = `Você é um assistente do Procon de Jacareí/SP. Responda em português, de forma clara e objetiva, em poucos parágrafos curtos (adequado a WhatsApp).
Baseie-se no Código de Defesa do Consumidor (CDC) e nas orientações abaixo. Se a dúvida não estiver coberta, oriente a pessoa a comparecer ao Procon ou digitar *menu* para ver opções.
Não invente artigos de lei; use apenas o contexto fornecido.`;

    const contexto = this.contextoDuvidas.length > MAX_CONTEXTO_CHARS
      ? this.contextoDuvidas.slice(0, MAX_CONTEXTO_CHARS) + '\n\n[... texto resumido para caber no limite da API ...]'
      : this.contextoDuvidas;
    const userContent = contexto
      ? `Contexto (dúvidas frequentes e orientações Procon/CDC):\n\n${contexto}\n\n---\nPergunta do consumidor: ${pergunta}`
      : `Pergunta do consumidor (responda com base no CDC e no papel do Procon): ${pergunta}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      return text || '';
    } catch (err) {
      console.error('Erro ao consultar Groq:', err);
      return '';
    }
  }
}
