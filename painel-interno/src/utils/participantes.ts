import type { ParticipanteAgenda } from "../types/painel";

export type ParticipanteFormRow = { nome: string; telefone: string };

const MAX = 30;

export function participantesToPayload(rows: ParticipanteFormRow[]): ParticipanteAgenda[] {
  return rows
    .map((r) => ({
      nome: r.nome.trim(),
      telefone: r.telefone.trim() || undefined,
    }))
    .filter((p) => p.nome.length > 0)
    .slice(0, MAX);
}

export function participantesFormFromServer(p?: ParticipanteAgenda[]): ParticipanteFormRow[] {
  return (p ?? []).map((x) => ({
    nome: x.nome ?? "",
    telefone: x.telefone ?? "",
  }));
}

/** Compara dois conjuntos normalizados (ordem importa). */
export function participantesPayloadEqual(a: ParticipanteAgenda[] | undefined, b: ParticipanteAgenda[]): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b);
}
