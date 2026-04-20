import { statusOptions, rotuloStatus } from "../constants/status";
import type { StatusAgendamento } from "../types/painel";

type Props = {
  searchTerm: string;
  statusFilter: StatusAgendamento | "todos";
  dateFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusAgendamento | "todos") => void;
  onDateChange: (value: string) => void;
};

export function FiltersBar({
  searchTerm,
  statusFilter,
  dateFilter,
  onSearchChange,
  onStatusChange,
  onDateChange,
}: Props) {
  return (
    <section className="filters" aria-label="Filtros da lista">
      <input
        type="search"
        placeholder="Pesquisar por nome, telefone, protocolo ou motivo…"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value as StatusAgendamento | "todos")}>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {rotuloStatus[status]}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dateFilter}
        onChange={(e) => onDateChange(e.target.value)}
        aria-label="Filtrar por data"
        title="Filtrar por data"
      />
    </section>
  );
}
