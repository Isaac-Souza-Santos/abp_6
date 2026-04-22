import { telefoneParaChatIdWhatsapp } from './whatsappChatId';

describe('telefoneParaChatIdWhatsapp', () => {
  test('preserva JID @c.us quando já informado', () => {
    expect(telefoneParaChatIdWhatsapp('5511999998888@c.us')).toBe('5511999998888@c.us');
  });

  test('preserva JID @lid quando já informado', () => {
    expect(telefoneParaChatIdWhatsapp('5511999998888@lid')).toBe('5511999998888@lid');
  });

  test('converte telefone nacional para @c.us com prefixo 55', () => {
    expect(telefoneParaChatIdWhatsapp('(11) 99999-8888')).toBe('5511999998888@c.us');
  });

  test('retorna null para valor inválido', () => {
    expect(telefoneParaChatIdWhatsapp('sem-telefone')).toBeNull();
  });
});
