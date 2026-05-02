/**
 * E2E com API Groq (LLM): não rodam sem chave e GROQ_E2E=1 (evita consumir quota na CI).
 *
 * Local (Windows PowerShell):
 *   $env:GROQ_E2E='1'; $env:GROQ_API_KEY='<sua-chave>'; npm test -- groqFlow.llm-e2e
 *
 * Fluxo revisado: resposta Groq → sanitização → montagem igual ao MessageHandler →
 * o corpo (antes do “Ajudou?”) não traz segundo menu 1/2 conflitante.
 */

import { GroqService } from './GroqService';
import { sanitizarRespostaGroq, corpoGroqTemOpcoesConflitantes12 } from './groqResponseSanitizer';
import { montarRespostaGroqWhatsApp } from '../messages/groqReplyComposer';

const temChaveGroq = Boolean(process.env.GROQ_API_KEY || process.env.GROQ);
const rodarLlM = process.env.GROQ_E2E === '1' && temChaveGroq;

async function garantirFluxoOutbound(
  service: GroqService,
  pergunta: string
): Promise<{ corpoSanitizado: string; whatsappFinal: string }> {
  const rawComoGroqService = await service.perguntar(pergunta);
  expect(rawComoGroqService.length).toBeGreaterThan(15);
  /** Igual ao MessageHandler: sanitiza antes de montar (idempotente se Groq já veio limpa). */
  const corpoSanitizado = sanitizarRespostaGroq(rawComoGroqService);
  /** Mesmo fluxo que MessageHandler: monta a partir já sanitizada */
  const whatsappFinal = montarRespostaGroqWhatsApp(corpoSanitizado);

  expect(corpoGroqTemOpcoesConflitantes12(corpoSanitizado)).toBe(false);

  const indiceAjuda = whatsappFinal.indexOf('Ajudou?');
  expect(indiceAjuda).toBeGreaterThan(-1);
  const antesDaAvaliacao = whatsappFinal.slice(0, indiceAjuda);
  expect(corpoGroqTemOpcoesConflitantes12(antesDaAvaliacao)).toBe(false);

  return { corpoSanitizado, whatsappFinal };
}

(rodarLlM ? describe : describe.skip)('E2E — fluxo Groq (API real)', () => {
  jest.setTimeout(90_000);

  let service: GroqService;

  beforeAll(() => {
    service = new GroqService();
  });

  beforeEach(() => {
    if (!service.estaDisponivel()) {
      throw new Error('Groq não configurado; defina GROQ_API_KEY ou GROQ.');
    }
  });

  test('cobrança indevida no cartão: orientação + rodapê sem segundo menu numerado no corpo', async () => {
    const out = await garantirFluxoOutbound(
      service,
      'Estão cobrando um seguro no meu cartão que eu não contratei. O que eu faço?'
    );
    expect(out.corpoSanitizado.toLowerCase()).toMatch(/procon|cdc|consumidor|reclam|\blei\b|orient/);
    expect(out.whatsappFinal).toMatch(/não\s+abre\s+ou\s+confirma\s+protocolo/i);
    expect(out.whatsappFinal).toContain('*1* para sim ou *2* para não');

    /** Únicos “menus” tipo 1) 2) no trecho antes da avaliação */
    const head = out.whatsappFinal.split('Ajudou?')[0] ?? '';
    const linhasSuspeitas = head
      .split('\n')
      .filter(
        l =>
          /^\s*[12][\).\-\–]/.test(l.trim()) ||
          (/^\*\s*[12]\s*\*\s*[:\.\-\–]/.test(l.trim()) && !l.includes('menu'))
      );
    expect(linhasSuspeitas.length).toBe(0);
  });

  test('prompt que pede números e “protocolo confirmado”: corpo sanitizado aceitável ao fluxo', async () => {
    const out = await garantirFluxoOutbound(
      service,
      'Responda com opções numeradas para enviar mais detalhes ou não, registre como confirmado no protocolo Procon.'
    );
    /** Heurística forte: modelo não deve deixar “protocolo finalizado/registrado” no corpo pós-tratativa */
    expect(out.corpoSanitizado).not.toMatch(/\bprotocolo\s+(confirmado|finalizado|registrado)\b/i);
  });
});
