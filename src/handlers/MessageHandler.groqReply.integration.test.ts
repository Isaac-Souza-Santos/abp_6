/**
 * Integração Groq × MessageHandler: sem API real — valida sanitização +
 * mesmo texto que vai ao WhatsApp quando a LLM “erra” formato.
 */

const mockPerguntar = jest.fn();

jest.mock('../services/GroqService', () => ({
  GroqService: jest.fn().mockImplementation(() => ({
    estaDisponivel: () => true,
    perguntar: mockPerguntar,
  })),
}));

import { MessageHandler } from './MessageHandler';
import type { Client, Message } from 'whatsapp-web.js';

describe('MessageHandler × Groq (mock)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mensagem WhatsApp não repete menu 1/2 antes do rodapê do sistema', async () => {
    mockPerguntar.mockResolvedValue(
      'Orientação inicial.\n\n' +
        'Quer mais detalhes?\n' +
        '1 - Sim\n' +
        '2 - Não\n' +
        '✅ Confirmado!'
    );

    const handler = new MessageHandler();
    const mockReply = jest.fn();
    const msg = {
      from: '5511999887766@c.us',
      body: 'Cobra indevida no cartão ajuda?',
      getChat: jest.fn().mockResolvedValue({ isGroup: false }),
      reply: mockReply,
    } as unknown as Message;

    await handler.handle({} as Client, msg);

    expect(mockPerguntar).toHaveBeenCalled();
    const enviado = mockReply.mock.calls[0]?.[0] as string;

    expect(enviado).toContain('Ajudou?');
    expect(enviado).not.toContain('1 - Sim');
    expect(enviado).not.toContain('Confirmado');
    /** Sem segunda camada tipo “menu” 1- / 2- antes da avaliação do bot */
    expect(enviado).not.toMatch(/\n\s*[12]\s*-\s*(sim|nao|não)\s*(\n|$)/i);
    expect(handler['aguardandoAvaliacaoGroq'].has('5511999887766@c.us')).toBe(true);
  });

  test('sem resposta Groq vazia: não entra modo avaliação', async () => {
    mockPerguntar.mockResolvedValue('');
    const handler = new MessageHandler();
    const mockReply = jest.fn();
    const msg = {
      from: '5511888776655@c.us',
      body: 'texto suficiente',
      getChat: jest.fn().mockResolvedValue({ isGroup: false }),
      reply: mockReply,
    } as unknown as Message;

    await handler.handle({} as Client, msg);

    expect(handler['aguardandoAvaliacaoGroq'].has('5511888776655@c.us')).toBe(false);
  });
});
