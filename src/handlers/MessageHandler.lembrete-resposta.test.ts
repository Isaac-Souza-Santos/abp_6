/* eslint-disable @typescript-eslint/no-var-requires */
import type { Client, Message } from 'whatsapp-web.js';

jest.mock('../services/GroqService', () => ({
  GroqService: jest.fn().mockImplementation(() => ({
    estaDisponivel: jest.fn().mockReturnValue(false),
  })),
}));

describe('MessageHandler - resposta de lembrete de confirmação', () => {
  let tempDir: string;
  let handler: import('./MessageHandler').MessageHandler;
  let registrarPendenteRespostaLembrete: typeof import('../services/lembreteConfirmacaoRespostaPendente').registrarPendenteRespostaLembrete;
  let mockClient: Client;
  let reply: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    tempDir = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'message-lembrete-'));
    process.env.DATA_DIR = tempDir;
    const { MessageHandler } = require('./MessageHandler') as typeof import('./MessageHandler');
    ({ registrarPendenteRespostaLembrete } = require('../services/lembreteConfirmacaoRespostaPendente') as typeof import('../services/lembreteConfirmacaoRespostaPendente'));
    handler = new MessageHandler();
    mockClient = {} as Client;
    reply = jest.fn();
  });

  afterEach(() => {
    delete process.env.DATA_DIR;
    require('fs').rmSync(tempDir, { recursive: true, force: true });
  });

  function buildMessage(body: string): Message {
    return {
      from: '5512999999999@c.us',
      body,
      getChat: jest.fn().mockResolvedValue({ isGroup: false }),
      reply,
    } as unknown as Message;
  }

  function criarAgendamentoPendente(): string {
    const ag = handler['agendamentoService'].getStore().add({
      telefone: '5512999999999@c.us',
      nome: 'Maria',
      motivo: 'Atendimento',
      dataPreferida: '15/06/2026 às 09:00',
      slotInicio: '2026-06-15T12:00:00.000Z',
      atendenteId: 'linha-1',
      status: 'solicitado',
    });
    registrarPendenteRespostaLembrete('5512999999999@c.us', ag.id, Date.now() + 60 * 60 * 1000);
    return ag.id;
  }

  test('resposta 1 confirma comparecimento', async () => {
    const id = criarAgendamentoPendente();

    await handler.handle(mockClient, buildMessage('1'));

    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('Confirmamos o seu comparecimento'));
    expect(handler['agendamentoService'].getStore().getById(id)?.status).toBe('confirmado');
  });

  test('resposta 2 cancela agendamento e libera horário', async () => {
    const id = criarAgendamentoPendente();

    await handler.handle(mockClient, buildMessage('2'));

    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('protocolo ficou como *cancelado*'));
    const agendamento = handler['agendamentoService'].getStore().getById(id);
    expect(agendamento?.status).toBe('cancelado');
    expect(handler['agendamentoService'].getStore().isSlotBloqueadoParaLinha(agendamento!.slotInicio!, 'linha-1')).toBe(false);
  });
});
