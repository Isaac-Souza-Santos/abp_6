/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('AgendamentoStore - bloqueio de slots', () => {
  let tempDir: string;
  let AgendamentoStore: typeof import('./AgendamentoStore').AgendamentoStore;

  beforeEach(() => {
    jest.resetModules();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agendamento-store-'));
    process.env.DATA_DIR = tempDir;
    ({ AgendamentoStore } = require('./AgendamentoStore') as typeof import('./AgendamentoStore'));
  });

  afterEach(() => {
    delete process.env.DATA_DIR;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('bloqueia o mesmo slot na mesma linha de atendimento', () => {
    const store = new AgendamentoStore();
    const slotInicio = '2026-06-15T12:00:00.000Z';

    store.add({
      telefone: '5512999999999@c.us',
      nome: 'Maria',
      motivo: 'Reclamação',
      dataPreferida: '15/06/2026 às 09:00',
      slotInicio,
      atendenteId: 'linha-1',
      status: 'solicitado',
    });

    expect(store.isSlotBloqueadoParaLinha(slotInicio, 'linha-1')).toBe(true);
    expect(store.isSlotBloqueadoParaLinha(slotInicio, 'linha-2')).toBe(false);
  });

  test('slot cancelado volta a ficar livre', () => {
    const store = new AgendamentoStore();
    const slotInicio = '2026-06-15T12:00:00.000Z';
    const agendamento = store.add({
      telefone: '5512999999999@c.us',
      nome: 'Maria',
      motivo: 'Reclamação',
      dataPreferida: '15/06/2026 às 09:00',
      slotInicio,
      atendenteId: 'linha-1',
      status: 'solicitado',
    });

    store.update(agendamento.id, { status: 'cancelado' });

    expect(store.isSlotBloqueadoParaLinha(slotInicio, 'linha-1')).toBe(false);
  });

  test('agendamento legado sem atendenteId bloqueia todas as linhas no mesmo horário', () => {
    const store = new AgendamentoStore();
    const slotInicio = '2026-06-15T12:00:00.000Z';

    store.add({
      telefone: '5512999999999@c.us',
      nome: 'Maria',
      motivo: 'Reclamação',
      dataPreferida: '15/06/2026 às 09:00',
      slotInicio,
      status: 'solicitado',
    });

    expect(store.isSlotBloqueadoParaLinha(slotInicio, 'linha-1')).toBe(true);
    expect(store.isSlotBloqueadoParaLinha(slotInicio, 'linha-2')).toBe(true);
  });
});
