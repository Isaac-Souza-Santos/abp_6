import type { Client, Message } from 'whatsapp-web.js';

jest.mock('../services/GroqService', () => ({
  GroqService: jest.fn().mockImplementation(() => ({
    estaDisponivel: jest.fn().mockReturnValue(false),
  })),
}));

jest.mock('../services/OutlookCalendarService', () => ({
  criarEventoOutlook: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/AgendaAtendentesConfigStore', () => ({
  agendaAtendentesConfigStore: {
    getConfig: jest.fn(() => ({
      atendentes: [
        {
          id: 'linha-1',
          nome: 'Guichê 1',
          intervaloMinutos: 30,
          blocos: [{ inicioH: 9, inicioM: 0, fimH: 11, fimM: 0 }],
        },
      ],
    })),
  },
}));

describe('MessageHandler - fluxo de agendamento', () => {
  let tempDir: string;
  let handler: import('./MessageHandler').MessageHandler;
  let mockClient: Client;
  let reply: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    tempDir = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'message-flow-'));
    process.env.DATA_DIR = tempDir;
    const { MessageHandler } = require('./MessageHandler') as typeof import('./MessageHandler');
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

  test('conduz consentimento, dados, escolha de dia/horário e salva ao confirmar', async () => {
    await handler.handle(mockClient, buildMessage('4'));
    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('Consentimento'));

    await handler.handle(mockClient, buildMessage('1'));
    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('nome completo'));

    await handler.handle(mockClient, buildMessage('Maria Silva'));
    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('motivo'));

    await handler.handle(mockClient, buildMessage('Problema com produto'));
    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('Escolha o dia'));

    await handler.handle(mockClient, buildMessage('1'));
    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('Escolha o horário'));

    await handler.handle(mockClient, buildMessage('1'));
    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('Confirme seus dados'));

    await handler.handle(mockClient, buildMessage('1'));
    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('Seu agendamento foi confirmado'));

    const agendamentos = handler['agendamentoService'].getStore().listarTodos();
    expect(agendamentos).toHaveLength(1);
    expect(agendamentos[0]).toMatchObject({
      nome: 'Maria Silva',
      motivo: 'Problema com produto',
      atendenteId: 'linha-1',
      atendenteNome: 'Guichê 1',
      status: 'solicitado',
    });
  });

  test('recusa consentimento e não persiste agendamento', async () => {
    await handler.handle(mockClient, buildMessage('4'));
    await handler.handle(mockClient, buildMessage('2'));

    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('Não coletaremos seus dados'));
    expect(handler['agendamentoService'].isInFluxo('5512999999999@c.us')).toBe(false);
    expect(handler['agendamentoService'].getStore().listarTodos()).toHaveLength(0);
  });

  test('permite desistir na etapa de confirmação', async () => {
    await handler.handle(mockClient, buildMessage('4'));
    await handler.handle(mockClient, buildMessage('1'));
    await handler.handle(mockClient, buildMessage('Maria Silva'));
    await handler.handle(mockClient, buildMessage('Problema com produto'));
    await handler.handle(mockClient, buildMessage('1'));
    await handler.handle(mockClient, buildMessage('1'));
    await handler.handle(mockClient, buildMessage('2'));

    expect(reply).toHaveBeenLastCalledWith(expect.stringContaining('Agendamento cancelado'));
    expect(handler['agendamentoService'].getStore().listarTodos()).toHaveLength(0);
  });
});
