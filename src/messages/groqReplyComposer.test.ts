import { montarRespostaGroqWhatsApp } from './groqReplyComposer';

describe('groqReplyComposer', () => {
  test('inclui aviso não-protocolo + 1/2 apenas no rodapé', () => {
    const full = montarRespostaGroqWhatsApp('Leve RG e cópias da cobrança.');
    expect(full).toContain('*1* para sim ou *2* para não');
    expect(full).toContain('orientação automática');
    expect(full).not.toContain('Opcoes');
    expect(full.startsWith('Leve RG')).toBe(true);
  });

  test('truncar corpo longo', () => {
    const longBody = 'a'.repeat(4000);
    const full = montarRespostaGroqWhatsApp(longBody, 3500);
    expect(full.includes('aaaaaaaa')).toBe(true);
    expect(full).toMatch(/…[\s\S]*Ajudou\?/);
  });
});
