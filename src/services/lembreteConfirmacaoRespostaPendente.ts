/** Telefone normalizado só com dígitos (igual ao `from` do WhatsApp sem @c.us). */
function chaveTelefone(telefoneOuFrom: string): string {
  return telefoneOuFrom.replace(/\D/g, '');
}

type Entrada = { agendamentoId: string; expiresAt: number };

const pendentes = new Map<string, Entrada>();

/**
 * Após enviar o lembrete, o cidadão pode responder *1* (sim) ou *2* (não) para atualizar o status.
 * Um telefone só guarda um pendente por vez (último lembrete enviado substitui o anterior).
 */
export function registrarPendenteRespostaLembrete(
  telefoneRaw: string,
  agendamentoId: string,
  expiresAtMs: number
): void {
  const key = chaveTelefone(telefoneRaw);
  if (!key) return;
  pendentes.set(key, { agendamentoId, expiresAt: expiresAtMs });
}

/** Devolve o id do agendamento se ainda há resposta em aberto e não expirou. */
export function obterAgendamentoPendenteConfirmacaoLembrete(telefoneOuFrom: string): string | null {
  const key = chaveTelefone(telefoneOuFrom);
  const e = pendentes.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    pendentes.delete(key);
    return null;
  }
  return e.agendamentoId;
}

export function limparPendenteRespostaLembrete(telefoneOuFrom: string): void {
  pendentes.delete(chaveTelefone(telefoneOuFrom));
}
