import type { StatusAgendamento } from "../types/painel";

export const statusOptions: Array<StatusAgendamento | "todos"> = [
  "todos",
  "solicitado",
  "confirmado",
  "cancelado",
  "atendido",
];

export const statusEditaveis: StatusAgendamento[] = ["solicitado", "confirmado", "cancelado", "atendido"];

export const rotuloStatus: Record<StatusAgendamento | "todos", string> = {
  todos: "Todos",
  solicitado: "Solicitado",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  atendido: "Atendido",
};
