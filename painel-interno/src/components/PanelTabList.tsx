import type { PainelTab } from "../types/painel";

const TABS: { id: PainelTab; label: string }[] = [
  { id: "agendamentos", label: "Agendamentos" },
  { id: "ajustes", label: "Ajustes da agenda" },
  { id: "equipe", label: "Equipe e horários" },
  { id: "metricas", label: "Métricas" },
];

type Props = {
  active: PainelTab;
  onChange: (tab: PainelTab) => void;
};

export function PanelTabList({ active, onChange }: Props) {
  return (
    <div className="tabsWrap">
      <nav className="tabs" role="tablist" aria-label="Seções do painel">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            className={`tab ${active === id ? "tabActive" : ""}`}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
