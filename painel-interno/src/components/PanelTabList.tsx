import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import type { PainelTab } from "../types/painel";

const TABS: { id: PainelTab; label: string }[] = [
  { id: "agendamentos", label: "Agendamentos" },
  { id: "ajustes", label: "Ajustes da agenda" },
  { id: "whatsapp", label: "Configuração de Bot" },
  { id: "equipe", label: "Equipe e horários" },
  { id: "metricas", label: "Métricas" },
];

type Props = {
  active: PainelTab;
  onChange: (tab: PainelTab) => void;
};

export function PanelTabList({ active, onChange }: Props) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Tabs
        value={active}
        onChange={(_, v: PainelTab) => onChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Seções do painel"
        sx={{
          minHeight: 44,
          "& .MuiTab-root": { minHeight: 44, py: 1, fontSize: "0.85rem", fontWeight: 600, textTransform: "none" },
        }}
      >
        {TABS.map(({ id, label }) => (
          <Tab key={id} value={id} label={label} />
        ))}
      </Tabs>
    </Paper>
  );
}
