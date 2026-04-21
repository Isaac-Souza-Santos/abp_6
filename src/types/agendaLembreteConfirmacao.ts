/**
 * Configuração do lembrete de confirmação enviado por WhatsApp (painel Ajustes da agenda).
 */
export type AgendaLembreteConfirmacaoConfig = {
  /** Se false, o bot não envia lembretes automáticos. */
  ativo: boolean;
  /**
   * Quantos dias antes do início do slot (`slotInicio`) o envio pode ocorrer.
   * Ex.: 1 = a partir de 24h antes do horário marcado.
   */
  antecedenciaDias: number;
  /**
   * Texto da mensagem. Placeholders: {nome}, {dataHora}, {motivo}, {protocolo}, {guiche}, {endereco}
   */
  mensagemTemplate: string;
};
