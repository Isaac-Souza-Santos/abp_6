/**
 * Tipos para agendamento e histórico do Procon (atendente + métricas).
 */

export type StatusAgendamento = 'solicitado' | 'confirmado' | 'cancelado' | 'atendido';

/** Pessoa adicional no mesmo agendamento (além do contacto principal `nome` / `telefone` do pedido). */
export interface ParticipanteAgenda {
  nome: string;
  telefone?: string;
}

export interface Agendamento {
  id: string;
  telefone: string;
  nome: string;
  motivo: string;
  dataPreferida: string;
  /** Início do slot reservado (ISO), quando escolhido da lista de horários livres. */
  slotInicio?: string;
  /** Linha de atendimento (guichê) quando há várias agendas paralelas. */
  atendenteId?: string;
  /** Nome da linha no momento do agendamento (exibição estável). */
  atendenteNome?: string;
  status: StatusAgendamento;
  criadoEm: string; // ISO
  atualizadoEm: string;
  observacaoAtendente?: string;
  /** Protocolo virou processo formal (marcado pelo atendente). */
  virouProcesso?: boolean;
  /** Protocolo utilizado na gestão pública / indicadores (marcado pelo atendente). */
  gestaoPublica?: boolean;
  /** Outras pessoas associadas ao mesmo horário/protocolo (editável no painel). */
  participantes?: ParticipanteAgenda[];
  /** Quem realizou o atendimento presencial/telefónico (registo no painel). */
  atendidoPorNome?: string;
  /** Momento em que `atendidoPorNome` foi definido ou alterado (ISO). */
  atendidoPorEm?: string;
  /** Preenchido pelo bot quando o lembrete automático (WhatsApp) foi enviado. */
  lembreteConfirmacaoEnviadoEm?: string;
}

/** Estado do fluxo de agendamento (por contato). */
export interface EstadoFluxoAgendamento {
  step: 'consentimento' | 'nome' | 'motivo' | 'data' | 'escolher_dia' | 'escolher_slot' | 'confirmar';
  nome?: string;
  motivo?: string;
  dataPreferida?: string;
  /** Quando step === 'escolher_dia', lista de dias com pelo menos um horário livre. */
  diasDisponiveis?: { label: string; dataKey: string }[];
  /** Data do dia escolhido (YYYY-MM-DD), preenchido ao sair de escolher_dia. */
  diaEscolhido?: string;
  /** Quando step === 'escolher_slot', lista de horários do dia (número = índice+1). */
  slotsDisponiveis?: { label: string; dataHora: string; atendenteId: string }[];
  /** Slot reservado (ISO), preenchido ao escolher da lista de horários livres. */
  slotInicio?: string;
  /** Linha de atendimento associada ao slot escolhido. */
  atendenteId?: string;
}

/** Resumo para métricas (ciclo do protocolo: vira dado → vira processo → gestão pública). */
export interface MetricasAgendamento {
  total: number;
  porStatus: Record<StatusAgendamento, number>;
  ultimos7Dias: number;
  hoje: number;
  /** Protocolos registrados no sistema (vira dado). */
  viraDado: number;
  /** Protocolos que viraram processo formal. */
  viraProcesso: number;
  /** Protocolos utilizados na gestão pública. */
  gestaoPublica: number;
}
