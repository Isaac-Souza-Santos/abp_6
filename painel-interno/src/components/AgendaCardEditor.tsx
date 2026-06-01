import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useCallback, useState } from "react";
import { rotuloStatus, statusEditaveis } from "../constants/status";
import { useMockData } from "../config/env";
import type { Agendamento, StatusAgendamento } from "../types/painel";

type Props = {
  ag: Agendamento;
  apiBaseUrl: string;
  adminPanelToken: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
  nomeUtilizadorSessao?: string;
  onSaved: () => void;
};

export function AgendaCardEditor({ ag, apiBaseUrl, adminPanelToken, getAuthHeaders, nomeUtilizadorSessao, onSaved }: Props) {
  const [status, setStatus] = useState<StatusAgendamento>(ag.status);
  const [atendidoPorNome, setAtendidoPorNome] = useState(ag.atendidoPorNome ?? "");
  const [observacao, setObservacao] = useState(ag.observacaoAtendente ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const dirty =
    status !== ag.status ||
    atendidoPorNome.trim() !== (ag.atendidoPorNome ?? "").trim() ||
    observacao !== (ag.observacaoAtendente ?? "");

  const save = useCallback(async () => {
    setSaveError("");
    const becameAtendido = status === "atendido" && ag.status !== "atendido";
    if (becameAtendido && !atendidoPorNome.trim()) {
      setSaveError("Ao marcar como atendido, indique quem atendeu (nome).");
      return;
    }
    setSaving(true);
    try {
      if (useMockData) {
        await new Promise((r) => setTimeout(r, 400));
        onSaved();
        return;
      }
      const url = new URL(`${apiBaseUrl}/admin/agendamentos/${encodeURIComponent(ag.id)}`);
      if (adminPanelToken) {
        url.searchParams.set("token", adminPanelToken);
      }
      const headers = await getAuthHeaders();
      const body: Record<string, unknown> = {};
      if (status !== ag.status) body.status = status;
      if (atendidoPorNome.trim() !== (ag.atendidoPorNome ?? "").trim()) {
        body.atendidoPorNome = atendidoPorNome.trim().slice(0, 200) || null;
      }
      if (observacao !== (ag.observacaoAtendente ?? "")) body.observacaoAtendente = observacao;

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        let msg = `Erro ${response.status}`;
        try {
          const j = JSON.parse(text) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Falha ao guardar.");
    } finally {
      setSaving(false);
    }
  }, [ag, atendidoPorNome, apiBaseUrl, adminPanelToken, getAuthHeaders, observacao, onSaved, status]);

  return (
    <Stack spacing={1.25}>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel id={`status-${ag.id}`}>Status</InputLabel>
            <Select
              labelId={`status-${ag.id}`}
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusAgendamento)}
            >
              {statusEditaveis.map((s) => (
                <MenuItem key={s} value={s}>
                  {rotuloStatus[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Quem atendeu"
            value={atendidoPorNome}
            onChange={(e) => setAtendidoPorNome(e.target.value)}
            inputProps={{ maxLength: 200 }}
            placeholder="Nome do atendente…"
            size="small"
          />
        </Grid>
      </Grid>

      {nomeUtilizadorSessao ? (
        <Button variant="text" size="small" onClick={() => setAtendidoPorNome(nomeUtilizadorSessao)} sx={{ alignSelf: "flex-start", mt: -0.5 }}>
          Usar o meu nome
        </Button>
      ) : null}

      <TextField
        fullWidth
        label="Observação"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        multiline
        minRows={2}
        inputProps={{ maxLength: 4000 }}
        placeholder="Notas internas (opcional)…"
        size="small"
      />

      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Button variant="contained" disabled={!dirty || saving} onClick={() => void save()}>
          {saving ? "A guardar…" : "Guardar"}
        </Button>
        {saveError ? (
          <Alert severity="error" sx={{ py: 0, flex: 1, minWidth: 200 }}>
            {saveError}
          </Alert>
        ) : null}
      </Stack>
    </Stack>
  );
}
