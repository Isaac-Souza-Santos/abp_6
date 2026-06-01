import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Suspense, lazy } from "react";
import { rotuloStatus } from "../constants/status";
import type { ApiResponse } from "../types/painel";

const MetricsCharts = lazy(() => import("./MetricsCharts"));

type Props = {
  data: ApiResponse | null;
  loading: boolean;
};

export function MetricsTabPanel({ data, loading }: Props) {
  const groqMetricas = data?.groqMetricas ?? { satisfatoria: 0, naoSatisfatoria: 0 };

  return (
    <Box className="tabPanel" role="tabpanel" aria-label="Métricas">
      {!data?.metricas && (
        <Card variant="outlined" sx={{ bgcolor: "#ffffff" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              {loading ? "Carregando métricas…" : "Não há dados de métricas disponíveis."}
            </Typography>
          </CardContent>
        </Card>
      )}
      {data?.metricas && (
        <Suspense
          fallback={
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              A carregar gráficos…
            </Typography>
          }
        >
          <MetricsCharts
            metricas={data.metricas}
            groqMetricas={groqMetricas}
            rotulos={{
              solicitado: rotuloStatus.solicitado,
              confirmado: rotuloStatus.confirmado,
              cancelado: rotuloStatus.cancelado,
              atendido: rotuloStatus.atendido,
            }}
          />
        </Suspense>
      )}
    </Box>
  );
}
