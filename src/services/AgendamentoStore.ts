import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';
import type { Agendamento } from '../types/agendamento';
import { getDataDir } from '../config/paths';

const DATA_DIR = getDataDir();
const FILE_PATH = path.join(DATA_DIR, 'agendamentos.json');

// Initialize Firebase (optional, requires service account key)
let firestore: admin.firestore.Firestore | null = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  firestore = admin.firestore();
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load(): Agendamento[] {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) return [];
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw) as Agendamento[];
  } catch {
    return [];
  }
}

function save(agendamentos: Agendamento[]): void {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(agendamentos, null, 2), 'utf-8');
  // Backup to cloud if configured
  backupToCloud(agendamentos);
}

async function backupToCloud(agendamentos: Agendamento[]): Promise<void> {
  if (!firestore) return;
  try {
    const batch = firestore.batch();
    agendamentos.forEach((ag) => {
      const docRef = firestore!.collection('agendamentos').doc(ag.id);
      batch.set(docRef, ag);
    });
    await batch.commit();
    console.log('✅ Backup para nuvem realizado');
  } catch (error) {
    console.error('❌ Erro no backup para nuvem:', error);
  }
}

export class AgendamentoStore {
  add(ag: Omit<Agendamento, 'id' | 'criadoEm' | 'atualizadoEm'>): Agendamento {
    const list = load();
    const now = new Date().toISOString();
    const id = `ag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const novo: Agendamento = {
      ...ag,
      id,
      criadoEm: now,
      atualizadoEm: now,
    };
    list.push(novo);
    save(list);
    return novo;
  }

  listarTodos(): Agendamento[] {
    return load().sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  listarPorTelefone(telefone: string): Agendamento[] {
    const norm = (t: string) => t.replace(/\D/g, '');
    const n = norm(telefone);
    return load()
      .filter((a) => norm(a.telefone) === n)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  getMetricas(): {
    total: number;
    porStatus: Record<string, number>;
    hoje: number;
    ultimos7Dias: number;
    viraDado: number;
    viraProcesso: number;
    gestaoPublica: number;
  } {
    const list = load();
    const now = new Date();
    const hojeInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const seteDiasAtras = hojeInicio - 7 * 24 * 60 * 60 * 1000;

    const porStatus: Record<string, number> = { solicitado: 0, confirmado: 0, cancelado: 0, atendido: 0 };
    let hoje = 0;
    let ultimos7Dias = 0;
    let viraProcesso = 0;
    let gestaoPublica = 0;

    for (const a of list) {
      porStatus[a.status] = (porStatus[a.status] || 0) + 1;
      const t = new Date(a.criadoEm).getTime();
      if (t >= hojeInicio) hoje++;
      if (t >= seteDiasAtras) ultimos7Dias++;
      if (a.virouProcesso) viraProcesso++;
      if (a.gestaoPublica) gestaoPublica++;
    }

    return {
      total: list.length,
      porStatus,
      hoje,
      ultimos7Dias,
      viraDado: list.length,
      viraProcesso,
      gestaoPublica,
    };
  }

  /** Atualiza um agendamento (ex.: marcar virouProcesso, gestaoPublica). Retorna true se encontrado. */
  update(
    id: string,
    patch: Partial<
      Pick<
        Agendamento,
        'status' | 'observacaoAtendente' | 'virouProcesso' | 'gestaoPublica' | 'participantes' | 'atendidoPorNome'
      >
    >
  ): boolean {
    const list = load();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const now = new Date().toISOString();
    const base = list[idx];
    const merged: Agendamento = { ...base, ...patch, atualizadoEm: now };

    if (Object.prototype.hasOwnProperty.call(patch, 'atendidoPorNome')) {
      const trimmed = (patch.atendidoPorNome ?? '').trim().slice(0, 200);
      if (!trimmed) {
        merged.atendidoPorNome = undefined;
        merged.atendidoPorEm = undefined;
      } else {
        const prev = (base.atendidoPorNome ?? '').trim();
        merged.atendidoPorNome = trimmed;
        if (trimmed !== prev) {
          merged.atendidoPorEm = now;
        }
      }
    }

    list[idx] = merged;
    save(list);
    return true;
  }

  getById(id: string): Agendamento | undefined {
    return load().find((a) => a.id === id);
  }

  /**
   * Retorna os horários já ocupados (slotInicio) no período, considerando apenas
   * agendamentos que não estão cancelados. Usado para calcular agenda livre.
   */
  getSlotsOcupados(fromDate: Date, toDate: Date): string[] {
    const list = load();
    const from = fromDate.getTime();
    const to = toDate.getTime();
    const ocupados: string[] = [];
    for (const a of list) {
      if (a.status === 'cancelado' || !a.slotInicio) continue;
      const t = new Date(a.slotInicio).getTime();
      if (t >= from && t <= to) ocupados.push(a.slotInicio);
    }
    return ocupados;
  }

  /**
   * Indica se um início de slot (ISO) está indisponível para uma linha de atendimento.
   * Agendamentos antigos sem `atendenteId` bloqueiam todas as linhas nesse horário (comportamento legado).
   */
  isSlotBloqueadoParaLinha(slotIso: string, atendenteId: string): boolean {
    const list = load();
    for (const a of list) {
      if (a.status === 'cancelado' || !a.slotInicio || a.slotInicio !== slotIso) continue;
      if (a.atendenteId == null) return true;
      if (a.atendenteId === atendenteId) return true;
    }
    return false;
  }
}
