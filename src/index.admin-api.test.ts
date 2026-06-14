/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';

type JsonResponse = {
  status: number;
  body: any;
};

function requestJson(
  server: http.Server,
  options: { method?: string; path: string; headers?: Record<string, string>; body?: unknown }
): Promise<JsonResponse> {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Servidor de teste não está escutando em TCP.');
  }

  return new Promise((resolve, reject) => {
    const rawBody = options.body === undefined ? undefined : JSON.stringify(options.body);
    const req = http.request(
      {
        host: '127.0.0.1',
        port: address.port,
        path: options.path,
        method: options.method ?? 'GET',
        headers: {
          ...(rawBody ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(rawBody).toString() } : {}),
          ...(options.headers ?? {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf-8');
          resolve({
            status: res.statusCode ?? 0,
            body: text ? JSON.parse(text) : null,
          });
        });
      }
    );
    req.on('error', reject);
    if (rawBody) req.write(rawBody);
    req.end();
  });
}

function listen(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
}

describe('admin API', () => {
  let tempDir: string;
  let server: http.Server;

  beforeEach(() => {
    jest.resetModules();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-api-'));
    process.env.DATA_DIR = tempDir;
    process.env.ADMIN_PANEL_TOKEN = 'secret-token';
  });

  afterEach((done) => {
    delete process.env.DATA_DIR;
    delete process.env.ADMIN_PANEL_TOKEN;
    delete process.env.ADMIN_PANEL_AZURE_TENANT_ID;
    delete process.env.ADMIN_PANEL_AZURE_CLIENT_ID;
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (server?.listening) {
      server.close(() => done());
    } else {
      done();
    }
  });

  async function setupServer() {
    const { createHealthServer } = require('./index') as typeof import('./index');
    server = createHealthServer({ isReady: () => true } as never);
    await listen(server);
  }

  test('rejeita chamadas admin sem token quando token está configurado', async () => {
    await setupServer();

    const response = await requestJson(server, { path: '/admin/agendamentos' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  test('lista agendamentos e métricas com x-admin-token válido', async () => {
    const { AgendamentoStore } = require('./services/AgendamentoStore') as typeof import('./services/AgendamentoStore');
    new AgendamentoStore().add({
      telefone: '5512999999999@c.us',
      nome: 'Maria',
      motivo: 'Atendimento',
      dataPreferida: '15/06/2026 às 09:00',
      status: 'solicitado',
    });
    await setupServer();

    const response = await requestJson(server, {
      path: '/admin/agendamentos',
      headers: { 'x-admin-token': 'secret-token' },
    });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.metricas.total).toBe(1);
    expect(response.body.agendamentos[0].nome).toBe('Maria');
  });

  test('atualiza agendamento via PATCH com token na query string', async () => {
    const { AgendamentoStore } = require('./services/AgendamentoStore') as typeof import('./services/AgendamentoStore');
    const ag = new AgendamentoStore().add({
      telefone: '5512999999999@c.us',
      nome: 'Maria',
      motivo: 'Atendimento',
      dataPreferida: '15/06/2026 às 09:00',
      status: 'solicitado',
    });
    await setupServer();

    const response = await requestJson(server, {
      method: 'PATCH',
      path: `/admin/agendamentos/${ag.id}?token=secret-token`,
      body: {
        status: 'atendido',
        observacaoAtendente: 'Resolvido no balcão',
        participantes: [{ nome: 'João', telefone: '5512888888888' }],
        atendidoPorNome: 'Atendente 1',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.agendamento).toMatchObject({
      status: 'atendido',
      observacaoAtendente: 'Resolvido no balcão',
      participantes: [{ nome: 'João', telefone: '5512888888888' }],
      atendidoPorNome: 'Atendente 1',
    });
  });

  test('valida PUT de agenda-atendentes e lembrete de confirmação', async () => {
    await setupServer();

    const agendaResponse = await requestJson(server, {
      method: 'PUT',
      path: '/admin/agenda-atendentes',
      headers: { 'x-admin-token': 'secret-token' },
      body: {
        atendentes: [{ id: 'linha-1', nome: 'Guichê 1', intervaloMinutos: 30 }],
      },
    });
    const lembreteInvalido = await requestJson(server, {
      method: 'PUT',
      path: '/admin/agenda-lembrete-confirmacao',
      headers: { 'x-admin-token': 'secret-token' },
      body: { ativo: true, antecedenciaDias: 99, mensagemTemplate: 'curto' },
    });
    const lembreteValido = await requestJson(server, {
      method: 'PUT',
      path: '/admin/agenda-lembrete-confirmacao',
      headers: { 'x-admin-token': 'secret-token' },
      body: {
        ativo: true,
        antecedenciaDias: 2,
        mensagemTemplate: 'Olá {nome}, confirme seu agendamento em {dataHora}.',
      },
    });

    expect(agendaResponse.status).toBe(200);
    expect(agendaResponse.body.atendentes[0].nome).toBe('Guichê 1');
    expect(lembreteInvalido.status).toBe(400);
    expect(lembreteValido.status).toBe(200);
    expect(lembreteValido.body.antecedenciaDias).toBe(2);
  });

  test('aceita Authorization Bearer quando validação Azure é aprovada', async () => {
    delete process.env.ADMIN_PANEL_TOKEN;
    process.env.ADMIN_PANEL_AZURE_TENANT_ID = 'tenant';
    process.env.ADMIN_PANEL_AZURE_CLIENT_ID = 'client';
    jest.doMock('./azureAdminAuth', () => ({
      isAzureAdminPanelAuthConfigured: () => true,
      verifyAdminPanelAzureToken: jest.fn(async (token: string) => token === 'azure-ok'),
    }));
    await setupServer();

    const response = await requestJson(server, {
      path: '/admin/agendamentos',
      headers: { Authorization: 'Bearer azure-ok' },
    });

    expect(response.status).toBe(200);
  });
});
