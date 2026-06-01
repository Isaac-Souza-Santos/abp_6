import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { AgendaCard } from "./AgendaCard";
import type { Agendamento } from "../types/painel";

type Props = {
  items: Agendamento[];
  loading: boolean;
};

export function AgendaConsultaList({ items, loading }: Props) {
  return (
    <Box role="tabpanel" aria-label="Lista de agendamentos">
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
          {loading ? "Carregando agendamentos…" : "Nenhum agendamento encontrado com os filtros atuais."}
        </Typography>
      ) : (
        <Grid container spacing={1.5} component="ul" className="agendaGridMui" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {items.map((ag) => (
            <Grid key={ag.id} size={{ xs: 12, sm: 6, lg: 4 }} component="li">
              <AgendaCard ag={ag} variant="consulta" />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
