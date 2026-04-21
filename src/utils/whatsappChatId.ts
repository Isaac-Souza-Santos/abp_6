/** Converte telefone guardado no agendamento para id de chat @c.us (Brasil: prefixo 55). */
export function telefoneParaChatIdWhatsapp(telefoneRaw: string): string {
  let d = telefoneRaw.replace(/\D/g, '');
  if (!d.startsWith('55') && (d.length === 10 || d.length === 11)) {
    d = `55${d}`;
  }
  return `${d}@c.us`;
}
