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

  test('initializes client with events', () => {
    // Verifique se o cliente interno tem eventos registrados
    // Como é privado, talvez teste indiretamente ou ajuste a classe para testabilidade
    expect(bot).toBeDefined();
  });

  // Adicione mais testes para sequências (ex.: menu -> 1 -> resposta)
});