import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AgendaAtendentesConfigStore, parseAgendaAtendentesConfig } from './AgendaAtendentesConfigStore';

describe('parseAgendaAtendentesConfig', () => {
  test('aceita configuração válida com múltiplas linhas e almoço', () => {
    const result = parseAgendaAtendentesConfig({
      atendentes: [
        {
          id: 'linha-1',
          nome: 'Guichê 1',
          intervaloMinutos: 30,
          blocos: [{ inicioH: 9, inicioM: 0, fimH: 12, fimM: 0 }],
          almoco: { inicioH: 12, inicioM: 0, fimH: 13, fimM: 0 },
        },
        {
          id: 'linha-2',
          nome: 'Guichê 2',
          intervaloMinutos: 45,
          blocos: [{ inicioH: 13, inicioM: 30, fimH: 17, fimM: 0 }],
        },
      ],
    });

    expect(result?.atendentes).toHaveLength(2);
    expect(result?.atendentes[0]).toMatchObject({
      id: 'linha-1',
      nome: 'Guichê 1',
      almoco: { inicioH: 12, inicioM: 0, fimH: 13, fimM: 0 },
    });
    expect(result?.atendentes[1].intervaloMinutos).toBe(45);
  });

  test('gera id seguro quando id informado é inválido', () => {
    const result = parseAgendaAtendentesConfig({
      atendentes: [{ id: 'linha 1!', nome: 'Atendimento', intervaloMinutos: 30 }],
    });

    expect(result?.atendentes[0].id).toBe('linha-1');
  });

  test('usa expediente padrão quando blocos informados são inválidos', () => {
    const result = parseAgendaAtendentesConfig({
      atendentes: [{ nome: 'Guichê 1', blocos: [{ inicioH: 12, inicioM: 0, fimH: 9, fimM: 0 }] }],
    });

    expect(result?.atendentes[0].blocos).toEqual([
      { inicioH: 9, inicioM: 0, fimH: 12, fimM: 0 },
      { inicioH: 14, inicioM: 0, fimH: 17, fimM: 0 },
    ]);
  });

  test('rejeita nomes vazios e ids duplicados', () => {
    expect(parseAgendaAtendentesConfig({ atendentes: [{ nome: '   ' }] })).toBeNull();
    expect(
      parseAgendaAtendentesConfig({
        atendentes: [
          { id: 'linha-1', nome: 'Guichê 1' },
          { id: 'linha-1', nome: 'Guichê 2' },
        ],
      })
    ).toBeNull();
  });
});

describe('AgendaAtendentesConfigStore', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-atendentes-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('cria configuração padrão quando arquivo não existe', () => {
    const store = new AgendaAtendentesConfigStore(tempDir);

    const config = store.getConfig();

    expect(config.atendentes).toHaveLength(1);
    expect(config.atendentes[0].id).toBe('linha-1');
    expect(fs.existsSync(path.join(tempDir, 'agenda-atendentes.json'))).toBe(true);
  });

  test('recupera padrão quando arquivo contém JSON inválido', () => {
    fs.writeFileSync(path.join(tempDir, 'agenda-atendentes.json'), '{', 'utf-8');
    const store = new AgendaAtendentesConfigStore(tempDir);

    const config = store.getConfig();

    expect(config.atendentes[0].nome).toBe('Atendimento presencial');
  });
});
