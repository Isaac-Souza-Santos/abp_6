import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { rotuloStatus } from "../constants/status";
import { statusChipColor } from "../constants/statusChip";
import type { Agendamento } from "../types/painel";
import { formatDateTime } from "../utils/formatDate";

type Variant = "consulta" | "ajuste";

type Props = {
  ag: Agendamento;
  variant: Variant;
  children?: ReactNode;
};

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: "break-word", lineHeight: 1.35 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function AgendaCard({ ag, variant, children }: Props) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#ffffff",
        ...(variant === "ajuste"
          ? {
              borderColor: "#e2e8f0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
            }
          : {}),
      }}
    >
      <CardContent sx={{ flex: 1, p: 1.5, "&:last-child": { pb: children ? 1 : 1.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ mb: 0.75 }}>
          <Chip label={rotuloStatus[ag.status]} size="small" color={statusChipColor[ag.status]} />
          <Typography
            variant="caption"
            component="span"
            sx={{ fontFamily: "monospace", color: "text.secondary", textAlign: "right", wordBreak: "break-all", maxWidth: "50%" }}
            title="Protocolo"
          >
            {ag.id}
          </Typography>
        </Stack>

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
          {ag.nome}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.4,
          }}
        >
          {ag.motivo}
        </Typography>

        {ag.participantes && ag.participantes.length > 0 ? (
          <Stack spacing={0.25} sx={{ mb: 1, p: 1, borderRadius: 1, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <Typography variant="caption" color="success.dark" fontWeight={700}>
              Outras pessoas
            </Typography>
            {ag.participantes.map((p, i) => (
              <Typography key={i} variant="caption" color="success.dark">
                <strong>{p.nome}</strong>
                {p.telefone ? ` · ${p.telefone}` : ""}
              </Typography>
            ))}
          </Stack>
        ) : null}

        {variant === "consulta" && ag.observacaoAtendente ? (
          <Typography variant="caption" display="block" sx={{ mb: 1, p: 1, bgcolor: "grey.100", borderRadius: 1, borderLeft: 3, borderColor: "primary.main" }}>
            {ag.observacaoAtendente}
          </Typography>
        ) : null}

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1.5}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 1,
          }}
        >
          <MetaRow label="Contato" value={ag.telefone} />
          <MetaRow label="Data pref." value={ag.dataPreferida || formatDateTime(ag.slotInicio || "")} />
          {(ag.atendenteNome || ag.atendenteId) && (
            <MetaRow label="Atendimento" value={ag.atendenteNome || ag.atendenteId} />
          )}
          {ag.atendidoPorNome && (
            <MetaRow
              label="Quem atendeu"
              value={
                <>
                  {ag.atendidoPorNome}
                  {ag.atendidoPorEm ? (
                    <Typography component="span" variant="caption" color="text.secondary">
                      {" "}
                      · {formatDateTime(ag.atendidoPorEm)}
                    </Typography>
                  ) : null}
                </>
              }
            />
          )}
          {variant === "consulta" && <MetaRow label="Criado" value={formatDateTime(ag.criadoEm)} />}
          <MetaRow label="Atualizado" value={formatDateTime(ag.atualizadoEm)} />
        </Stack>

        {children ? (
          <>
            <Divider sx={{ my: 1.25 }} />
            {children}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
