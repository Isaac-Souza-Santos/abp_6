export type StatusAgendamento = "solicitado" | "confirmado" | "cancelado" | "atendido";

/** Pessoa adicional no mesmo agendamento (além do contacto principal do pedido). */
export type ParticipanteAgenda = {
  nome: string;
  telefone?: string;
};

export type HorarioBlocoAtendente = {
  inicioH: number;
  inicioM: number;
  fimH: number;
  fimM: number;
};

export type AtendenteAgendaConfig = {
  id: string;
  nome: string;
  intervaloMinutos: number;
  blocos: HorarioBlocoAtendente[];
  almoco?: HorarioBlocoAtendente;
};

export type AgendaAtendentesConfig = {
  atendentes: AtendenteAgendaConfig[];
};

export type Agendamento = {
  id: string;
  telefone: string;
  nome: string;
  motivo: string;
  dataPreferida: string;
  slotInicio?: string;
  atendenteId?: string;
  atendenteNome?: string;
  status: StatusAgendamento;
  criadoEm: string;
  atualizadoEm: string;
  virouProcesso?: boolean;
  gestaoPublica?: boolean;
  observacaoAtendente?: string;
  participantes?: ParticipanteAgenda[];
};

export type MetricasResumo = {
  total: number;
  hoje: number;
  ultimos7Dias: number;
  viraDado: number;
  viraProcesso: number;
  gestaoPublica: number;
  porStatus: Record<StatusAgendamento, number>;
};

export type MetricasGroq = {
  satisfatoria: number;
  naoSatisfatoria: number;
};

export type ApiResponse = {
  total: number;
  agendamentos: Agendamento[];
  metricas: MetricasResumo;
  groqMetricas?: MetricasGroq;
};

export type PainelTab = "agendamentos" | "ajustes" | "metricas";
