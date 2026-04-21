/**
 * Configuração da agenda: várias linhas de atendimento (ex.: guichês).
 * Horário de expediente e intervalo entre slots são fixos no sistema (dias úteis).
 * Opcionalmente cada linha pode ter um intervalo de almoço (não gera slots).
 */
export interface HorarioBlocoAtendente {
  inicioH: number;
  inicioM: number;
  fimH: number;
  fimM: number;
}

export interface AtendenteAgendaConfig {
  id: string;
  nome: string;
  intervaloMinutos: number;
  blocos: HorarioBlocoAtendente[];
  /** Se definido, nenhum slot pode cruzar este intervalo [início, fim). */
  almoco?: HorarioBlocoAtendente;
}

export interface AgendaAtendentesConfig {
  atendentes: AtendenteAgendaConfig[];
}
