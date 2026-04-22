/**
 * Converte valor guardado no agendamento para chat id do WhatsApp.
 * - Se já vier como JID (ex.: @c.us, @lid), preserva.
 * - Se vier só com telefone, normaliza para @c.us (Brasil: prefixo 55).
 */
export function telefoneParaChatIdWhatsapp(telefoneRaw: string): string | null {
  const raw = telefoneRaw.trim();
  if (!raw) return null;
  if (raw.includes('@')) return raw;

  let d = raw.replace(/\D/g, '');
  if (!d) return null;
  if (!d.startsWith('55') && (d.length === 10 || d.length === 11)) {
    d = `55${d}`;
  }
  if (d.length < 10) return null;
  return `${d}@c.us`;
}
