import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { AgendaCard } from "./AgendaCard";
import { AgendaCardEditor } from "./AgendaCardEditor";
import { adminPanelToken, apiBaseUrl } from "../config/env";
import type { Agendamento } from "../types/painel";

type Props = {
  items: Agendamento[];
  loading: boolean;
  getAuthHeaders: () => Promise<Record<string, string>>;
  nomeUtilizadorSessao?: string;
  onSaved: () => void;
};

export function AjustesAgendaSection({ items, loading, getAuthHeaders, nomeUtilizadorSessao, onSaved }: Props) {
  return (
    <Box className="tabPanel" role="tabpanel" aria-label="Ajustes da agenda">
      <Alert severity="info" variant="outlined" sx={{ py: 0.5, bgcolor: "#ffffff" }}>
        Altere o <strong>status</strong>, registe <strong>quem atendeu</strong> e as <strong>observações</strong>. Guarde em cada cartão.
      </Alert>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
          {loading ? "Carregando agendamentos…" : "Nenhum agendamento com os filtros atuais."}
        </Typography>
      ) : (
        <Grid container spacing={1.5} component="ul" className="agendaGridMui" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {items.map((ag) => (
            <Grid key={ag.id} size={{ xs: 12, lg: 6 }} component="li">
              <AgendaCard ag={ag} variant="ajuste">
                <AgendaCardEditor
                  key={`${ag.id}-${ag.atualizadoEm}`}
                  ag={ag}
                  apiBaseUrl={apiBaseUrl}
                  adminPanelToken={adminPanelToken}
                  getAuthHeaders={getAuthHeaders}
                  nomeUtilizadorSessao={nomeUtilizadorSessao}
                  onSaved={onSaved}
                />
              </AgendaCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
