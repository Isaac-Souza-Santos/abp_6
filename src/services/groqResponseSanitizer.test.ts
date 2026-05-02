import {
  sanitizarRespostaGroq,
  corpoGroqTemOpcoesConflitantes12,
} from './groqResponseSanitizer';

describe('groqResponseSanitizer', () => {
  test('preserva texto útil quando no meio aparece número de artigo CDC', () => {
    const raw =
      'O consumidor pode pleitear reparos.\n' +
      'II - restituição da quantia paga segundo o CDC.\n' +
      'Compareça ao Procon se precisar.';
    expect(sanitizarRespostaGroq(raw)).toContain('II');
  });

  test('remove linha só com confirmação falsa ao final', () => {
    const raw =
      'Orientação: procure o Procon.\n\n' +
      '✅ Protocolo registrado!';
    expect(sanitizarRespostaGroq(raw).trim()).toBe('Orientação: procure o Procon.');
    expect(corpoGroqTemOpcoesConflitantes12(sanitizarRespostaGroq(raw))).toBe(false);
  });

  test('remove menu conflitante final 1/2 + linha perguntadora', () => {
    const raw =
      'Você tem direitos pelo CDC sobre cobrança indevida.\n\n' +
      'Quer enviar mais detalhes?\n' +
      '1 - Sim, quero mais detalhes\n' +
      '2 - Não, obrigado\n' +
      'Confirmado.';
    const clean = sanitizarRespostaGroq(raw);
    expect(clean.toLowerCase()).toContain('direitos');
    expect(corpoGroqTemOpcoesConflitantes12(clean)).toBe(false);
    expect(clean.toLowerCase()).not.toContain('confirmado');
  });

  test('remove par 1-/2- quando linha anterior termina só com ?', () => {
    const raw =
      'Leve seus documentos.\nDeseja continuar?\n2 - Voltar ao menu principal\n1 - Falar sobre outro problema';
    const clean = sanitizarRespostaGroq(raw);
    expect(clean.includes('documentos')).toBe(true);
    expect(corpoGroqTemOpcoesConflitantes12(clean)).toBe(false);
  });
});
