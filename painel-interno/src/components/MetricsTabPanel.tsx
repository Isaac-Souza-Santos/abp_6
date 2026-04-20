import { Suspense, lazy } from "react";
import { rotuloStatus } from "../constants/status";
import type { ApiResponse } from "../types/painel";

const MetricsCharts = lazy(() => import("./MetricsCharts"));

type Props = {
  data: ApiResponse | null;
  loading: boolean;
};

export function MetricsTabPanel({ data, loading }: Props) {
  return (
    <div className="tabPanel" role="tabpanel">
      {!data?.metricas && (
        <p className="emptyInline">{loading ? "Carregando métricas…" : "Não há dados de métricas disponíveis."}</p>
      )}
      {data?.metricas && (
        <>
          <p className="metricsLead">
            Resumo calculado no servidor a partir de todos os agendamentos ({data.total} registros retornados pela API).
          </p>
          <section className="cards">
            <article className="card cardAccent">
              <span>Total de agendamentos</span>
              <strong>{data.metricas.total}</strong>
            </article>
            <article className="card">
              <span>Hoje</span>
              <strong>{data.metricas.hoje}</strong>
            </article>
            <article className="card">
              <span>Últimos 7 dias</span>
              <strong>{data.metricas.ultimos7Dias}</strong>
            </article>
            <article className="card">
              <span>Vira dado</span>
              <strong>{data.metricas.viraDado}</strong>
            </article>
            <article className="card">
              <span>Virou processo</span>
              <strong>{data.metricas.viraProcesso}</strong>
            </article>
            <article className="card">
              <span>Gestão pública</span>
              <strong>{data.metricas.gestaoPublica}</strong>
            </article>
          </section>

          <Suspense fallback={<p className="chartsFallback">A carregar gráficos…</p>}>
            <MetricsCharts
              metricas={data.metricas}
              rotulos={{
                solicitado: rotuloStatus.solicitado,
                confirmado: rotuloStatus.confirmado,
                cancelado: rotuloStatus.cancelado,
                atendido: rotuloStatus.atendido,
              }}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
