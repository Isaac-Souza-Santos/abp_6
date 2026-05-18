import { statusOptions, rotuloStatus } from "../constants/status";
import type { StatusAgendamento } from "../types/painel";

type Props = {
  searchTerm: string;
  statusFilter: StatusAgendamento | "todos";
  dateFilter: string;
  exportDisabled?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusAgendamento | "todos") => void;
  onDateChange: (value: string) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
};

export function FiltersBar({
  searchTerm,
  statusFilter,
  dateFilter,
  exportDisabled = false,
  onSearchChange,
  onStatusChange,
  onDateChange,
  onExportCsv,
  onExportJson,
}: Props) {
  return (
    <section className="panelCard panelCard--filters" aria-label="Filtros da lista">
      <div className="filters">
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
        <details className="exportMenu">
          <summary className="btn btnSecondary btnSmall" aria-disabled={exportDisabled}>
            Exportar
          </summary>
          <div className="exportMenuList" role="menu" aria-label="Opções de exportação">
            <button type="button" className="exportMenuItem" onClick={onExportCsv} disabled={exportDisabled}>
              CSV
            </button>
            <button type="button" className="exportMenuItem" onClick={onExportJson} disabled={exportDisabled}>
              JSON
            </button>
          </div>
        </details>
      </div>
    </section>
  );
}
