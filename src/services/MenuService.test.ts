import { MenuService } from './MenuService';

describe('MenuService', () => {
  const service = new MenuService();

  test('getWelcome returns menu text with options', () => {
    const result = service.getWelcome();
    expect(result).toContain('Procon Jacareí');
    expect(result).toContain('1 - Orientações e direitos do consumidor');
    expect(result).toContain('Digite menu quando quiser ver este resumo de novo.');
  });

  test('getQualSuaDuvida matches initial welcome text', () => {
    expect(service.getQualSuaDuvida()).toBe(service.getWelcome());
  });

  test('getOrientacoesEDireitos returns consumer guidance', () => {
    const result = service.getOrientacoesEDireitos();
    expect(result).toContain('Orientações e direitos do consumidor');
    expect(result).toContain('troca ou devolução');
  });

  test('getReclamacao returns complaint registration info', () => {
    const result = service.getReclamacao();
    expect(result).toContain('Quais documentos levar para comparecer ao Procon');
    expect(result).toContain('nota fiscal');
  });

  test('getContato returns contact info', () => {
    const result = service.getContato();
    expect(result).toContain('Contato');
    // Adicione mais asserts conforme o método real
  });

  // Adicione testes para outros métodos como getHorario, getDireitos, etc.
});