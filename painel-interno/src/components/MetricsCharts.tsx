import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { MetricasGroq, MetricasResumo, StatusAgendamento } from "../types/painel";

const STATUS_ORDER: StatusAgendamento[] = ["solicitado", "confirmado", "cancelado", "atendido"];

const STATUS_COLORS: Record<StatusAgendamento, string> = {
  solicitado: "#f59e0b",
  confirmado: "#10b981",
  cancelado: "#f43f5e",
  atendido: "#3b82f6",
};

const GROQ_COLORS = {
  satisfatoria: "#22c55e",
  naoSatisfatoria: "#ef4444",
} as const;

const KPI_ACCENTS = {
  total: "#6366f1",
  hoje: "#f97316",
  semana: "#a855f7",
  satisfacao: "#14b8a6",
} as const;

const CHART_HEIGHT = 268;

type Props = {
  metricas: MetricasResumo;
  groqMetricas: MetricasGroq;
  rotulos: Record<StatusAgendamento, string>;
};

type Slice = { id: string; label: string; value: number; color: string };

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        bgcolor: "#fff",
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {item.name}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {item.value}
      </Typography>
    </Box>
  );
}

function ChartLegend({ items }: { items: Slice[] }) {
  return (
    <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1.5} sx={{ mt: 1 }}>
      {items.map((item) => (
        <Stack key={item.id} direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        bgcolor: "#ffffff",
        borderColor: "#e2e8f0",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: "-0.02em" }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            {subtitle}
          </Typography>
        ) : null}
        <Box
          sx={{
            borderRadius: 2.5,
            background: "linear-gradient(160deg, #f8fafc 0%, #ffffff 70%)",
            border: "1px solid #f1f5f9",
            px: { xs: 0.5, sm: 1 },
            pt: 1,
            pb: 0.5,
          }}
        >
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: "#e2e8f0",
        background: `linear-gradient(145deg, ${accent}18 0%, #ffffff 58%)`,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
      }}
    >
      <CardContent sx={{ py: 1.75, "&:last-child": { pb: 1.75 } }}>
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: accent, textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: "#0f172a", lineHeight: 1.1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function DonutPanel({
  data,
  centerMain,
  centerSub,
  emptyMessage,
}: {
  data: Slice[];
  centerMain: string;
  centerSub: string;
  emptyMessage: string;
}) {
  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 8 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <>
      <Box sx={{ position: "relative", width: "100%", height: CHART_HEIGHT - 36 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={5}
              stroke="#ffffff"
              strokeWidth={3}
              animationDuration={700}
              animationBegin={0}
            >
              {data.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography variant="h4" fontWeight={800} sx={{ color: "#0f172a", lineHeight: 1 }}>
            {centerMain}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {centerSub}
          </Typography>
        </Box>
      </Box>
      <ChartLegend items={data} />
    </>
  );
}

export default function MetricsCharts({ metricas, groqMetricas, rotulos }: Props) {
  const groqSlices: Slice[] = [
    { id: "ok", label: "Ajudou", value: groqMetricas.satisfatoria, color: GROQ_COLORS.satisfatoria },
    { id: "nao", label: "Não ajudou", value: groqMetricas.naoSatisfatoria, color: GROQ_COLORS.naoSatisfatoria },
  ].filter((d) => d.value > 0);

  const groqTotal = groqMetricas.satisfatoria + groqMetricas.naoSatisfatoria;
  const groqPct = groqTotal > 0 ? Math.round((groqMetricas.satisfatoria / groqTotal) * 100) : 0;

  const statusSlices: Slice[] = STATUS_ORDER.map((st) => ({
    id: st,
    label: rotulos[st],
    value: metricas.porStatus[st] ?? 0,
    color: STATUS_COLORS[st],
  })).filter((d) => d.value > 0);

  const statusTotal = statusSlices.reduce((s, d) => s + d.value, 0);

  const statusBars = STATUS_ORDER.map((st) => ({
    name: rotulos[st],
    value: metricas.porStatus[st] ?? 0,
    fill: STATUS_COLORS[st],
    id: st,
  }));

  return (
    <Box sx={{ mt: 0.5 }}>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Total" value={metricas.total} accent={KPI_ACCENTS.total} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Hoje" value={metricas.hoje} accent={KPI_ACCENTS.hoje} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Últimos 7 dias" value={metricas.ultimos7Dias} accent={KPI_ACCENTS.semana} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Satisfação chat" value={groqTotal > 0 ? `${groqPct}%` : "—"} accent={KPI_ACCENTS.satisfacao} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Ajuda do chat" subtitle="O que os cidadãos acharam da resposta do assistente">
            <DonutPanel
              data={groqSlices}
              centerMain={groqTotal > 0 ? `${groqPct}%` : "—"}
              centerSub="disseram que ajudou"
              emptyMessage="Sem avaliações registadas."
            />
            {groqTotal > 0 ? (
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1 }}>
                {groqTotal} resposta{groqTotal === 1 ? "" : "s"} no total
              </Typography>
            ) : null}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Agendamentos por status" subtitle="Como estão os pedidos na base hoje">
            {statusTotal === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 8 }}>
                Sem agendamentos na base.
              </Typography>
            ) : (
              <>
                <Box sx={{ width: "100%", height: CHART_HEIGHT }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusBars}
                      layout="vertical"
                      margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
                      barCategoryGap="28%"
                    >
                      <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide domain={[0, "dataMax"]} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={96}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.06)" }} />
                      <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={26} animationDuration={700}>
                        {statusBars.map((row) => (
                          <Cell key={row.id} fill={row.fill} />
                        ))}
                        <LabelList dataKey="value" position="right" style={{ fill: "#334155", fontWeight: 700, fontSize: 12 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <ChartLegend items={statusSlices} />
              </>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
