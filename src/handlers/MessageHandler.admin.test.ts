import type { Client, Message } from "whatsapp-web.js";

function buildMessage(body: string): Message {
  return {
    from: "5512999999999@c.us",
    body,
    getChat: jest.fn().mockResolvedValue({ isGroup: false }),
    reply: jest.fn(),
  } as unknown as Message;
}

describe("MessageHandler admin commands", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ADMIN_NUMBER: "5512999999999" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("responde comando metricas para atendente", async () => {
    jest.doMock("../services/GroqService", () => ({
      GroqService: jest.fn().mockImplementation(() => ({ estaDisponivel: () => false })),
    }));
    const { MessageHandler } = await import("./MessageHandler");
    const handler = new MessageHandler();
    const message = buildMessage("metricas");
    await handler.handle({} as Client, message);
    expect((message.reply as jest.Mock).mock.calls[0][0]).toContain("Métricas");
  });

  test("marca protocolo como processo", async () => {
    jest.doMock("../services/GroqService", () => ({
      GroqService: jest.fn().mockImplementation(() => ({ estaDisponivel: () => false })),
    }));
    const { MessageHandler } = await import("./MessageHandler");
    const handler = new MessageHandler();
    const updateSpy = jest.spyOn(handler["agendamentoService"].getStore(), "update").mockReturnValue(true);
    const message = buildMessage("processo ag-123");
    await handler.handle({} as Client, message);
    expect(updateSpy).toHaveBeenCalledWith("ag-123", { virouProcesso: true });
    expect((message.reply as jest.Mock).mock.calls[0][0]).toContain("virou processo");
  });

  test("marca protocolo como gestao publica", async () => {
    jest.doMock("../services/GroqService", () => ({
      GroqService: jest.fn().mockImplementation(() => ({ estaDisponivel: () => false })),
    }));
    const { MessageHandler } = await import("./MessageHandler");
    const handler = new MessageHandler();
    const updateSpy = jest.spyOn(handler["agendamentoService"].getStore(), "update").mockReturnValue(true);
    const message = buildMessage("gestao ag-999");
    await handler.handle({} as Client, message);
    expect(updateSpy).toHaveBeenCalledWith("ag-999", { gestaoPublica: true });
    expect((message.reply as jest.Mock).mock.calls[0][0]).toContain("gestão pública");
  });

  test("retorna erro quando protocolo nao existe (processo)", async () => {
    jest.doMock("../services/GroqService", () => ({
      GroqService: jest.fn().mockImplementation(() => ({ estaDisponivel: () => false })),
    }));
    const { MessageHandler } = await import("./MessageHandler");
    const handler = new MessageHandler();
    jest.spyOn(handler["agendamentoService"].getStore(), "update").mockReturnValue(false);
    const message = buildMessage("processo ag-invalido");
    await handler.handle({} as Client, message);
    expect((message.reply as jest.Mock).mock.calls[0][0]).toContain("Protocolo não encontrado");
  });

  test("retorna erro quando protocolo nao existe (gestao)", async () => {
    jest.doMock("../services/GroqService", () => ({
      GroqService: jest.fn().mockImplementation(() => ({ estaDisponivel: () => false })),
    }));
    const { MessageHandler } = await import("./MessageHandler");
    const handler = new MessageHandler();
    jest.spyOn(handler["agendamentoService"].getStore(), "update").mockReturnValue(false);
    const message = buildMessage("gestao ag-invalido");
    await handler.handle({} as Client, message);
    expect((message.reply as jest.Mock).mock.calls[0][0]).toContain("Protocolo não encontrado");
  });

  test("ignora comandos admin quando numero nao e atendente", async () => {
    process.env = { ...OLD_ENV, ADMIN_NUMBER: "5512888888888" };
    jest.resetModules();
    jest.doMock("../services/GroqService", () => ({
      GroqService: jest.fn().mockImplementation(() => ({ estaDisponivel: () => false })),
    }));
    const { MessageHandler } = await import("./MessageHandler");
    const handler = new MessageHandler();
    const message = buildMessage("metricas");
    await handler.handle({} as Client, message);
    const reply = (message.reply as jest.Mock).mock.calls[0][0] as string;
    expect(reply).not.toContain("Painel Atendente");
    expect(reply).not.toContain("Métricas");
  });
});
