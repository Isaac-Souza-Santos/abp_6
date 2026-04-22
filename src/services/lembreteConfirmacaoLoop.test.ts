import type { Agendamento } from '../types/agendamento';
import { processarLembretesConfirmacao } from './lembreteConfirmacaoLoop';

jest.mock('./AgendaLembreteConfirmacaoStore', () => ({
  agendaLembreteConfirmacaoStore: {
    getConfig: jest.fn(() => ({
      ativo: true,
      antecedenciaDias: 1,
      mensagemTemplate: 'Oi {nome}, confirme 1 ou 2.',
    })),
  },
}));

describe('processarLembretesConfirmacao', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('cancela após 2h sem confirmação e envia aviso', async () => {
    const now = Date.UTC(2026, 3, 22, 12, 0, 0);
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const agendamento: Agendamento = {
      id: 'ag-1',
      telefone: '5511999998888@c.us',
      nome: 'Maria',
      motivo: 'Atendimento',
      dataPreferida: '22/04/2026 15:00',
      slotInicio: new Date(now + 3 * 60 * 60 * 1000).toISOString(),
      status: 'solicitado',
      criadoEm: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      atualizadoEm: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      lembreteConfirmacaoEnviadoEm: new Date(now - (2 * 60 * 60 * 1000 + 1000)).toISOString(),
    };

    const update = jest.fn(() => true);
    const store = {
      listarTodos: jest.fn(() => [agendamento]),
      update,
    } as unknown as { listarTodos: () => Agendamento[]; update: (id: string, patch: object) => boolean };

    const sendWhatsAppText = jest.fn(async () => ({ ok: true as const }));
    const bot = {
      isReady: () => true,
      sendWhatsAppText,
    } as unknown as { isReady: () => boolean; sendWhatsAppText: (to: string, msg: string) => Promise<{ ok: true } | { ok: false; error: string }> };

    await processarLembretesConfirmacao(bot as never, store as never);

    expect(sendWhatsAppText).toHaveBeenCalledTimes(1);
    expect(sendWhatsAppText).toHaveBeenCalledWith(
      '5511999998888@c.us',
      expect.stringContaining('cancelado por falta de confirmação')
    );
    expect(update).toHaveBeenCalledWith('ag-1', { status: 'cancelado' });
  });

  test('não cancela quando lembrete enviado há menos de 2h', async () => {
    const now = Date.UTC(2026, 3, 22, 12, 0, 0);
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const agendamento: Agendamento = {
      id: 'ag-2',
      telefone: '5511999997777@c.us',
      nome: 'João',
      motivo: 'Reclamação',
      dataPreferida: '22/04/2026 15:00',
      slotInicio: new Date(now + 3 * 60 * 60 * 1000).toISOString(),
      status: 'solicitado',
      criadoEm: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      atualizadoEm: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      lembreteConfirmacaoEnviadoEm: new Date(now - (90 * 60 * 1000)).toISOString(),
    };

    const update = jest.fn(() => true);
    const store = {
      listarTodos: jest.fn(() => [agendamento]),
      update,
    } as unknown as { listarTodos: () => Agendamento[]; update: (id: string, patch: object) => boolean };

    const sendWhatsAppText = jest.fn(async () => ({ ok: true as const }));
    const bot = {
      isReady: () => true,
      sendWhatsAppText,
    } as unknown as { isReady: () => boolean; sendWhatsAppText: (to: string, msg: string) => Promise<{ ok: true } | { ok: false; error: string }> };

    await processarLembretesConfirmacao(bot as never, store as never);

    // Como o lembrete já foi enviado e ainda não venceu 2h, não faz nenhuma ação.
    expect(sendWhatsAppText).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
