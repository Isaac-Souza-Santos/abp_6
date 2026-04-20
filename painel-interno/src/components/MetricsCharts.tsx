import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricasResumo, StatusAgendamento } from "../types/painel";

const STATUS_ORDER: StatusAgendamento[] = ["solicitado", "confirmado", "cancelado", "atendido"];

const STATUS_COLORS: Record<StatusAgendamento, string> = {
  solicitado: "#d97706",
  confirmado: "#059669",
  cancelado: "#dc2626",
  atendido: "#2563eb",
};

type Props = {
  metricas: MetricasResumo;
  rotulos: Record<StatusAgendamento, string>;
};

export default function MetricsCharts({ metricas, rotulos }: Props) {
  const porStatusData = STATUS_ORDER.map((st) => ({
    nome: rotulos[st],
    valor: metricas.porStatus[st] ?? 0,
    key: st,
  }));

  const fluxoData = [
    { nome: "Hoje", valor: metricas.hoje },
    { nome: "Últimos 7 dias", valor: metricas.ultimos7Dias },
    { nome: "Total", valor: metricas.total },
  ];

  const protocoloData = [
    { nome: "Vira dado", valor: metricas.viraDado },
    { nome: "Virou processo", valor: metricas.viraProcesso },
    { nome: "Gestão pública", valor: metricas.gestaoPublica },
  ];

  return (
    <div className="chartsGrid">
      <section className="chartCard">
        <h3 className="chartTitle">Distribuição por status</h3>
        <div className="chartBody">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={porStatusData}
                dataKey="valor"
                nameKey="nome"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={2}
              >
                {porStatusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} stroke="#fff" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} agendamentos`, "Quantidade"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chartCard">
        <h3 className="chartTitle">Volume no tempo</h3>
        <div className="chartBody">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fluxoData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="nome" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#cbd5e1" }} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#cbd5e1" }} />
              <Tooltip formatter={(v: number) => [`${v}`, "Quantidade"]} />
              <Bar dataKey="valor" fill="#6366f1" radius={[6, 6, 0, 0]} name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chartCard chartCardWide">
        <h3 className="chartTitle">Métricas de protocolo</h3>
        <div className="chartBody">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={protocoloData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="nome"
                width={120}
                tick={{ fill: "#334155", fontSize: 12 }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip formatter={(v: number) => [`${v}`, "Quantidade"]} />
              <Bar dataKey="valor" fill="#0d9488" radius={[0, 6, 6, 0]} name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
