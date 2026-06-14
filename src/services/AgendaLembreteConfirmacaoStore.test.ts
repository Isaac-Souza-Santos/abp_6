import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  AgendaLembreteConfirmacaoStore,
  defaultLembreteConfirmacaoConfig,
  parseAgendaLembreteConfirmacaoConfig,
} from './AgendaLembreteConfirmacaoStore';

describe('parseAgendaLembreteConfirmacaoConfig', () => {
  test('aceita configuração válida', () => {
    const result = parseAgendaLembreteConfirmacaoConfig({
      ativo: false,
      antecedenciaDias: 3,
      mensagemTemplate: 'Olá {nome}, confirme seu agendamento em {dataHora}.',
    });

    expect(result).toEqual({
      ativo: false,
      antecedenciaDias: 3,
      mensagemTemplate: 'Olá {nome}, confirme seu agendamento em {dataHora}.',
    });
  });

  test('rejeita ativo ausente, antecedência fora da faixa e template curto', () => {
    expect(
      parseAgendaLembreteConfirmacaoConfig({
        antecedenciaDias: 1,
        mensagemTemplate: 'Mensagem longa suficiente',
      })
    ).toBeNull();
    expect(
      parseAgendaLembreteConfirmacaoConfig({
        ativo: true,
        antecedenciaDias: 15,
        mensagemTemplate: 'Mensagem longa suficiente',
      })
    ).toBeNull();
    expect(
      parseAgendaLembreteConfirmacaoConfig({
        ativo: true,
        antecedenciaDias: 1,
        mensagemTemplate: 'curto',
      })
    ).toBeNull();
  });

  test('limita template em 3500 caracteres', () => {
    const result = parseAgendaLembreteConfirmacaoConfig({
      ativo: true,
      antecedenciaDias: 1,
      mensagemTemplate: 'x'.repeat(3600),
    });

    expect(result?.mensagemTemplate).toHaveLength(3500);
  });
});

describe('AgendaLembreteConfirmacaoStore', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-lembrete-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('cria configuração padrão quando arquivo não existe', () => {
    const store = new AgendaLembreteConfirmacaoStore(tempDir);

    const config = store.getConfig();

    expect(config).toEqual(defaultLembreteConfirmacaoConfig());
    expect(fs.existsSync(path.join(tempDir, 'agenda-lembrete-confirmacao.json'))).toBe(true);
  });

  test('recupera padrão quando arquivo contém configuração inválida', () => {
    fs.writeFileSync(
      path.join(tempDir, 'agenda-lembrete-confirmacao.json'),
      JSON.stringify({ ativo: true, antecedenciaDias: 99, mensagemTemplate: 'inválida' }),
      'utf-8'
    );
    const store = new AgendaLembreteConfirmacaoStore(tempDir);

    const config = store.getConfig();

    expect(config).toEqual(defaultLembreteConfirmacaoConfig());
  });
});
