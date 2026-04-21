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
    <div className="tabPanel" role="tabpanel">
      {!data?.metricas && (
        <div className="panelCard">
          <p className="emptyInline">{loading ? "Carregando métricas…" : "Não há dados de métricas disponíveis."}</p>
        </div>
      )}
      {data?.metricas && (
        <div className="panelCard">
          <p className="metricsLead">
            Apenas os gráficos solicitados: avaliação do chat e agendamentos.
          </p>

          <Suspense fallback={<p className="chartsFallback">A carregar gráficos…</p>}>
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
        </div>
      )}
    </div>
  );
}
