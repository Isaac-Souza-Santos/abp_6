import { MenuService } from './MenuService';

describe('MenuService', () => {
  const service = new MenuService();

  test('getWelcome returns menu text with options', () => {
    const result = service.getWelcome();
    expect(result).toContain('Procon Jacareí');
    expect(result).toContain('*1* - Orientações ao consumidor');
    expect(result).toContain('Digite *menu*');
  });

  test('getOrientacoes returns consumer guidance', () => {
    const result = service.getOrientacoes();
    expect(result).toContain('Orientações ao consumidor');
    expect(result).toContain('troca ou devolução');
  });

  test('getReclamacao returns complaint registration info', () => {
    const result = service.getReclamacao();
    expect(result).toContain('Como registrar uma reclamação');
    expect(result).toContain('nota fiscal');
  });

  test('getContato returns contact info', () => {
    const result = service.getContato();
    expect(result).toContain('Contato');
    // Adicione mais asserts conforme o método real
  });

  // Adicione testes para outros métodos como getHorario, getDireitos, etc.
});