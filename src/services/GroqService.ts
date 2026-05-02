import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizarRespostaGroq } from './groqResponseSanitizer';

const DUVIDAS_PATH = path.join(__dirname, '../../.github/DUVIDAS.TXT');
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
/** Limite de caracteres do contexto para caber no tier gratuito Groq (≈6000 tokens por request). */
const MAX_CONTEXTO_CHARS = 7000;

/**
 * Serviço para consultar a API Groq com contexto do Procon (CDC e dúvidas frequentes).
 * Groq tier gratuito; variáveis `GROQ_API_KEY` ou `GROQ`.
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

    const systemPrompt = `Você é um assistente do Procon de Jacareí/SP no WhatsApp. Responda em português, clara e objetivamente, em poucos parágrafos curtos.
Baseie-se no CDC e no contexto fornecido. Se a dúvida não estiver coberta, oriente comparecer ao Procon ou digitar *menu*.
Não invente artigos de lei; só use o que consta no contexto.

IMPORTANTE sobre o formato da resposta:
- Ao final do chat o sistema pergunta *1* ou *2* se a ajuda foi suficiente, e outros números são do menu principal. Por isso: NÃO ofereça opções numeradas (1-, 2-, 3-) nem “digite A ou B”; isso confunde quem está no canal.
- NÃO diga confirmado, protocolo finalizado/registrado, solicitação concluída, cadastro gravado nem similares: você apenas orienta; não há protocolo nem confirmação oficial gerada só por esta conversa automatizada.
- Se faltar algum detalhe, peça UMA nova mensagem em texto livre (ex.: nome da empresa, cidade, o que aparece na fatura) ou indique comparecer ao Procon ou *menu* para agendamento. Não feche perguntando “quer enviar mais detalhes?” com alternativas.`;

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

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return raw ? sanitizarRespostaGroq(raw) : '';
    } catch (err) {
      console.error('Erro ao consultar Groq:', err);
      return '';
    }
  }
}
