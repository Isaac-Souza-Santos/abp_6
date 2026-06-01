import type { ChipProps } from "@mui/material/Chip";
import type { StatusAgendamento } from "../types/painel";

export const statusChipColor: Record<StatusAgendamento, ChipProps["color"]> = {
  solicitado: "warning",
  confirmado: "success",
  cancelado: "error",
  atendido: "info",
};
