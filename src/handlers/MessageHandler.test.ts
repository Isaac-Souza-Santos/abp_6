import { MessageHandler } from './MessageHandler';
import { Client, Message } from 'whatsapp-web.js';

// Mock GroqService to avoid dependency issues
jest.mock('../services/GroqService', () => ({
  GroqService: jest.fn().mockImplementation(() => ({
    estaDisponivel: jest.fn().mockReturnValue(false),
  })),
}));

describe('MessageHandler', () => {
  let handler: MessageHandler;
  let mockClient: Client;
  let mockMessage: Message;

  beforeEach(() => {
    handler = new MessageHandler();
    mockClient = {} as Client;
    mockMessage = {
      from: '123456789@c.us',
      body: '',
      getChat: jest.fn().mockResolvedValue({ isGroup: false }),
      reply: jest.fn(),
    } as any;
  });

  test('ignores group messages', async () => {
    mockMessage.getChat = jest.fn().mockResolvedValue({ isGroup: true });
    await handler.handle(mockClient, mockMessage);
    expect(mockMessage.reply).not.toHaveBeenCalled();
  });

  test('handles menu command', async () => {
    mockMessage.body = 'menu';
    const spy = jest.spyOn(handler['menuService'], 'getWelcome');
    await handler.handle(mockClient, mockMessage);
    expect(spy).toHaveBeenCalled();
  });

  test('handles option 1', async () => {
    mockMessage.body = '1';
    const spy = jest.spyOn(handler['menuService'], 'getOrientacoesEDireitos');
    await handler.handle(mockClient, mockMessage);
    expect(spy).toHaveBeenCalled();
  });

  test('handles greeting as first message', async () => {
    mockMessage.body = 'oi!';
    const spy = jest.spyOn(handler['menuService'], 'getQualSuaDuvida');
    await handler.handle(mockClient, mockMessage);
    expect(spy).toHaveBeenCalled();
  });

  test('handles extended greeting text', async () => {
    mockMessage.body = 'oláaa tudo bem?';
    const spy = jest.spyOn(handler['menuService'], 'getQualSuaDuvida');
    await handler.handle(mockClient, mockMessage);
    expect(spy).toHaveBeenCalled();
  });

  test('handles eai as greeting (not LLM)', async () => {
    mockMessage.body = 'eai';
    const spy = jest.spyOn(handler['menuService'], 'getQualSuaDuvida');
    await handler.handle(mockClient, mockMessage);
    expect(spy).toHaveBeenCalled();
  });

  // Adicione testes para outras opções, admin commands, agendamento, etc.
});