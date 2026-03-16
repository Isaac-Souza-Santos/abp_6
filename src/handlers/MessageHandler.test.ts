import { MessageHandler } from './MessageHandler';
import { Client, Message } from 'whatsapp-web.js';

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
    const spy = jest.spyOn(handler['menuService'], 'getOrientacoes');
    await handler.handle(mockClient, mockMessage);
    expect(spy).toHaveBeenCalled();
  });

  // Adicione testes para outras opções, admin commands, agendamento, etc.
});