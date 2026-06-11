// ProconBot.test.ts
import { ProconBot } from './ProconBot';

// Mock dependencies
jest.mock('../services/GroqService', () => ({
  GroqService: jest.fn().mockImplementation(() => ({
    estaDisponivel: jest.fn().mockReturnValue(false),
  })),
}));

jest.mock('../config/paths', () => ({
  getAuthPath: jest.fn().mockReturnValue('/tmp/test-auth'),
  getDataDir: jest.fn().mockReturnValue('/tmp/test-data'),
}));

describe('ProconBot Integration', () => {
  let bot: ProconBot;

  beforeEach(() => {
    bot = new ProconBot();
  });

  test('initializes correctly', () => {
    expect(bot).toBeDefined();
  });

  test('retorna menu na primeira interação', async () => {
    const resposta = await bot.handleMessage('oi');

    expect(resposta).toContain('Menu');
    expect(resposta).toContain('1 - Registrar reclamação');
  });

  test('responde corretamente ao selecionar opção 1', async () => {
    await bot.handleMessage('oi'); // entra no menu

    const resposta = await bot.handleMessage('1');

    expect(resposta).toContain('Registrar reclamação');
  });

  test('responde corretamente ao selecionar opção 2', async () => {
    await bot.handleMessage('oi');

    const resposta = await bot.handleMessage('2');

    expect(resposta).toContain('Consultar reclamação');
  });

  test('retorna erro para opção inválida', async () => {
    await bot.handleMessage('oi');

    const resposta = await bot.handleMessage('999');

    expect(resposta).toContain('Opção inválida');
    expect(resposta).toContain('Menu');
  });

  test('fluxo completo: menu -> opção válida', async () => {
    const menu = await bot.handleMessage('olá');
    expect(menu.toLowerCase()).toContain('menu');

    const resposta = await bot.handleMessage('1');
    expect(resposta).toContain('Registrar reclamação');
  });
});
