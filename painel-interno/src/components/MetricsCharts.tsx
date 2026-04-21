import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricasGroq, MetricasResumo, StatusAgendamento } from "../types/painel";

const STATUS_ORDER: StatusAgendamento[] = ["solicitado", "confirmado", "cancelado", "atendido"];

const STATUS_COLORS: Record<StatusAgendamento, string> = {
  solicitado: "#d97706",
  confirmado: "#059669",
  cancelado: "#dc2626",
  atendido: "#2563eb",
};

type Props = {
  metricas: MetricasResumo;
  groqMetricas: MetricasGroq;
  rotulos: Record<StatusAgendamento, string>;
};

export default function MetricsCharts({ metricas, groqMetricas, rotulos }: Props) {
  const porStatusData = STATUS_ORDER.map((st) => ({
    nome: rotulos[st],
    valor: metricas.porStatus[st] ?? 0,
    key: st,
  }));

  const groqAjudaData = [
    { nome: "Ajudou", valor: groqMetricas.satisfatoria, key: "satisfatoria" as const },
    { nome: "Não ajudou", valor: groqMetricas.naoSatisfatoria, key: "naoSatisfatoria" as const },
  ];
  const groqTotal = groqMetricas.satisfatoria + groqMetricas.naoSatisfatoria;

  return (
    <div className="chartsGrid">
      <section className="chartCard">
        <h3 className="chartTitle">Ajuda do chat (Groq)</h3>
        <div className="chartBody">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={groqAjudaData}
                dataKey="valor"
                nameKey="nome"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={2}
              >
                {groqAjudaData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.key === "satisfatoria" ? "#059669" : "#dc2626"}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} respostas`, "Quantidade"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="metricsLead">
          Total de respostas avaliadas: <strong>{groqTotal}</strong>
        </p>
      </section>

      <section className="chartCard">
        <h3 className="chartTitle">Agendamentos por status</h3>
        <div className="chartBody">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porStatusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="nome" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#cbd5e1" }} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#cbd5e1" }} />
              <Tooltip formatter={(v: number) => [`${v} agendamentos`, "Quantidade"]} />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} name="Agendamentos">
                {porStatusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
