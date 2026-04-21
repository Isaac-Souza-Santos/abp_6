import * as fs from 'fs';
import * as path from 'path';
import type { AgendaAtendentesConfig, AtendenteAgendaConfig, HorarioBlocoAtendente } from '../types/agendaAtendentes';
import { getDataDir } from '../config/paths';

const FILE_NAME = 'agenda-atendentes.json';

/** Expediente padrão (dias úteis): manhã e tarde; editável só no ficheiro se necessário. */
const BLOCOS_PADRAO: HorarioBlocoAtendente[] = [
  { inicioH: 9, inicioM: 0, fimH: 12, fimM: 0 },
  { inicioH: 14, inicioM: 0, fimH: 17, fimM: 0 },
];

function defaultConfig(): AgendaAtendentesConfig {
  return {
    atendentes: [
      {
        id: 'linha-1',
        nome: 'Atendimento presencial',
        intervaloMinutos: 30,
        blocos: BLOCOS_PADRAO,
      },
    ],
  };
}

function ensureId(a: AtendenteAgendaConfig, index: number): AtendenteAgendaConfig {
  const id = typeof a.id === 'string' && /^[a-z0-9-]{1,40}$/i.test(a.id.trim()) ? a.id.trim() : `linha-${index + 1}`;
  return { ...a, id };
}

function parseBloco(o: Record<string, unknown>): HorarioBlocoAtendente | null {
  const nums = ['inicioH', 'inicioM', 'fimH', 'fimM'] as const;
  const v: Partial<HorarioBlocoAtendente> = {};
  for (const k of nums) {
    const n = o[k];
    if (typeof n !== 'number' || !Number.isInteger(n)) return null;
    (v as Record<string, number>)[k] = n;
  }
  const b = v as HorarioBlocoAtendente;
  if (b.inicioH < 0 || b.inicioH > 23 || b.fimH < 0 || b.fimH > 23) return null;
  if (b.inicioM < 0 || b.inicioM > 59 || b.fimM < 0 || b.fimM > 59) return null;
  const start = b.inicioH * 60 + b.inicioM;
  const end = b.fimH * 60 + b.fimM;
  if (start >= end) return null;
  return b;
}

function parseAtendente(o: unknown, index: number): AtendenteAgendaConfig | null {
  if (!o || typeof o !== 'object') return null;
  const r = o as Record<string, unknown>;
  const nome = typeof r.nome === 'string' ? r.nome.trim().slice(0, 120) : '';
  if (!nome) return null;

  let intervaloMinutos = 30;
  if (
    typeof r.intervaloMinutos === 'number' &&
    Number.isInteger(r.intervaloMinutos) &&
    r.intervaloMinutos >= 15 &&
    r.intervaloMinutos <= 180
  ) {
    intervaloMinutos = r.intervaloMinutos;
  }

  let blocos: HorarioBlocoAtendente[] = BLOCOS_PADRAO;
  if (Array.isArray(r.blocos) && r.blocos.length > 0 && r.blocos.length <= 12) {
    const parsedBlocos: HorarioBlocoAtendente[] = [];
    for (const b of r.blocos) {
      if (!b || typeof b !== 'object') continue;
      const parsed = parseBloco(b as Record<string, unknown>);
      if (parsed) parsedBlocos.push(parsed);
    }
    if (parsedBlocos.length > 0) blocos = parsedBlocos;
  }

  let almoco: HorarioBlocoAtendente | undefined;
  if (Object.prototype.hasOwnProperty.call(r, 'almoco')) {
    if (r.almoco === null) {
      almoco = undefined;
    } else if (r.almoco && typeof r.almoco === 'object') {
      const a = parseBloco(r.almoco as Record<string, unknown>);
      if (a) almoco = a;
    }
  }

  const base: AtendenteAgendaConfig = {
    id: typeof r.id === 'string' ? r.id.trim().slice(0, 40) : `linha-${index + 1}`,
    nome,
    intervaloMinutos,
    blocos,
    ...(almoco !== undefined ? { almoco } : {}),
  };
  return ensureId(base, index);
}

export function parseAgendaAtendentesConfig(body: unknown): AgendaAtendentesConfig | null {
  if (!body || typeof body !== 'object') return null;
  const r = body as Record<string, unknown>;
  if (!Array.isArray(r.atendentes) || r.atendentes.length === 0 || r.atendentes.length > 20) return null;
  const atendentes: AtendenteAgendaConfig[] = [];
  for (let i = 0; i < r.atendentes.length; i++) {
    const a = parseAtendente(r.atendentes[i], i);
    if (!a) return null;
    atendentes.push(a);
  }
  const ids = new Set(atendentes.map((x) => x.id));
  if (ids.size !== atendentes.length) return null;
  return { atendentes };
}

export class AgendaAtendentesConfigStore {
  private readonly filePath: string;

  constructor(dataDir?: string) {
    this.filePath = path.join(dataDir ?? getDataDir(), FILE_NAME);
  }

  getConfig(): AgendaAtendentesConfig {
    try {
      if (!fs.existsSync(this.filePath)) {
        const d = defaultConfig();
        this.saveConfig(d);
        return d;
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      const c = parseAgendaAtendentesConfig(parsed);
      if (c) return c;
    } catch {
      // fallthrough
    }
    const d = defaultConfig();
    this.saveConfig(d);
    return d;
  }

  saveConfig(config: AgendaAtendentesConfig): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(config, null, 2), 'utf-8');
  }
}

export const agendaAtendentesConfigStore = new AgendaAtendentesConfigStore();
