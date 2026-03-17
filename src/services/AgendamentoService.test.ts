import { AgendamentoService } from './AgendamentoService';

describe('AgendamentoService', () => {
  let service: AgendamentoService;

  beforeEach(() => {
    service = new AgendamentoService();
  });

  test('getTextoInicio returns start text', () => {
    const result = service.getTextoInicio();
    expect(result).toContain('Agendamento – Procon Jacareí');
    expect(result).toContain('Digite *cancelar*');
  });

  test('getTextoConsentimento returns consent text', () => {
    const result = service.getTextoConsentimento();
    expect(result).toContain('Consentimento para coleta de dados');
    expect(result).toContain('*1* - Sim');
  });

  test('getProximosSlotsLivres returns slots', () => {
    const slots = service.getProximosSlotsLivres();
    expect(Array.isArray(slots)).toBe(true);
    if (slots.length > 0) {
      expect(slots[0]).toHaveProperty('label');
      expect(slots[0]).toHaveProperty('dataHora');
    }
  });

  test('getStore returns AgendamentoStore instance', () => {
    const store = service.getStore();
    expect(store).toBeDefined();
    expect(store.listarTodos).toBeInstanceOf(Function);
  });

  // Adicione testes para confirmarESalvar se mockar o fluxo
});