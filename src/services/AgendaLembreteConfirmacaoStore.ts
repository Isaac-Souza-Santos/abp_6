import * as fs from 'fs';
import * as path from 'path';
import type { AgendaLembreteConfirmacaoConfig } from '../types/agendaLembreteConfirmacao';
import { getDataDir } from '../config/paths';

const FILE_NAME = 'agenda-lembrete-confirmacao.json';

const MENSAGEM_PADRAO = `🔔 *Procon Jacareí – confirme seu agendamento*

Olá, *{nome}*!

*Seu agendamento:*
📅 *Dia e horário:* {dataHora}
📋 *Motivo:* {motivo}
📋 *Protocolo:* {protocolo}
👤 *Guichê/linha:* {guiche}

_Confirma que irá comparecer neste dia e horário?_

*1* — Sim, confirmo comparecimento
*2* — Não poderei comparecer

{endereco}

_Dúvidas: responda aqui ou digite *menu*._`;

export function defaultLembreteConfirmacaoConfig(): AgendaLembreteConfirmacaoConfig {
  return {
    ativo: true,
    antecedenciaDias: 1,
    mensagemTemplate: MENSAGEM_PADRAO,
  };
}

export function parseAgendaLembreteConfirmacaoConfig(body: unknown): AgendaLembreteConfirmacaoConfig | null {
  if (!body || typeof body !== 'object') return null;
  const r = body as Record<string, unknown>;

  const ativo = r.ativo === true || r.ativo === false ? r.ativo : null;
  if (ativo === null) return null;

  let antecedenciaDias = 1;
  if (typeof r.antecedenciaDias === 'number' && Number.isInteger(r.antecedenciaDias)) {
    if (r.antecedenciaDias >= 1 && r.antecedenciaDias <= 14) {
      antecedenciaDias = r.antecedenciaDias;
    } else {
      return null;
    }
  } else {
    return null;
  }

  const mensagemTemplate =
    typeof r.mensagemTemplate === 'string' ? r.mensagemTemplate.trim().slice(0, 3500) : '';
  if (mensagemTemplate.length < 20) return null;

  return { ativo, antecedenciaDias, mensagemTemplate };
}

export class AgendaLembreteConfirmacaoStore {
  private readonly filePath: string;

  constructor(dataDir?: string) {
    this.filePath = path.join(dataDir ?? getDataDir(), FILE_NAME);
  }

  getConfig(): AgendaLembreteConfirmacaoConfig {
    try {
      if (!fs.existsSync(this.filePath)) {
        const d = defaultLembreteConfirmacaoConfig();
        this.saveConfig(d);
        return d;
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      const c = parseAgendaLembreteConfirmacaoConfig(parsed);
      if (c) return c;
    } catch {
      /* fallthrough */
    }
    const d = defaultLembreteConfirmacaoConfig();
    this.saveConfig(d);
    return d;
  }

  saveConfig(config: AgendaLembreteConfirmacaoConfig): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(config, null, 2), 'utf-8');
  }
}

export const agendaLembreteConfirmacaoStore = new AgendaLembreteConfirmacaoStore();
