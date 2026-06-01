import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { adminPanelToken, apiBaseUrl, useMockData } from "../config/env";
import { mockLembreteConfirmacao } from "../mocks/painelMockData";
import type { AgendaLembreteConfirmacaoConfig } from "../types/painel";

type Props = {
  getAuthHeaders: () => Promise<Record<string, string>>;
};

export function LembreteConfirmacaoBlock({ getAuthHeaders }: Props) {
  const [config, setConfig] = useState<AgendaLembreteConfirmacaoConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    if (useMockData) {
      await new Promise((r) => setTimeout(r, 200));
      setConfig({ ...mockLembreteConfirmacao });
      setLoading(false);
      return;
    }
    try {
      const headers: Record<string, string> = {
        ...(await getAuthHeaders()),
        Accept: "application/json",
      };
      if (adminPanelToken) headers["x-admin-token"] = adminPanelToken;
      const res = await fetch(`${apiBaseUrl}/admin/agenda-lembrete-confirmacao`, { headers });
      if (!res.ok) {
        throw new Error(`Falha ao carregar (${res.status}).`);
      }
      const data = (await res.json()) as AgendaLembreteConfirmacaoConfig;
      if (typeof data.ativo !== "boolean" || typeof data.antecedenciaDias !== "number") {
        throw new Error("Resposta inválida.");
      }
      setConfig(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erro ao carregar.");
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [load]);

  const salvar = async () => {
    if (!config) return;
    setSaving(true);
    setSaveError(null);
    if (useMockData) {
      await new Promise((r) => setTimeout(r, 300));
      setSaving(false);
      return;
    }
    try {
      const headers: Record<string, string> = {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (adminPanelToken) headers["x-admin-token"] = adminPanelToken;
      const res = await fetch(`${apiBaseUrl}/admin/agenda-lembrete-confirmacao`, {
        method: "PUT",
        headers,
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || `Falha ao guardar (${res.status}).`);
      }
      const data = (await res.json()) as AgendaLembreteConfirmacaoConfig;
      setConfig(data);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !config) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        A carregar configuração WhatsApp…
      </Typography>
    );
  }

  if (loadError && !config) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void load()}>
            Tentar de novo
          </Button>
        }
      >
        {loadError}
      </Alert>
    );
  }

  if (!config) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Confirmação automática por WhatsApp
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
          Mensagem enviada uma vez por agendamento, com antecedência configurável. O cidadão responde{" "}
          <strong>1</strong> ou <strong>2</strong> para confirmar ou cancelar o comparecimento.
        </Typography>

        <Stack spacing={1.5}>
          <FormControlLabel
            control={<Switch checked={config.ativo} onChange={(e) => setConfig({ ...config, ativo: e.target.checked })} />}
            label="Enviar lembretes automáticos"
          />

          <TextField
            type="number"
            label="Dias de antecedência (1–14)"
            value={config.antecedenciaDias}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isInteger(n) || n < 1 || n > 14) return;
              setConfig({ ...config, antecedenciaDias: n });
            }}
            inputProps={{ min: 1, max: 14 }}
            size="small"
            sx={{ maxWidth: 220 }}
          />

          <TextField
            fullWidth
            multiline
            minRows={8}
            maxRows={16}
            label="Texto da mensagem"
            value={config.mensagemTemplate}
            onChange={(e) => setConfig({ ...config, mensagemTemplate: e.target.value })}
            size="small"
            slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: "0.82rem" } } }}
          />

          <Typography variant="caption" color="text.secondary">
            Marcadores: {"{nome}"}, {"{dataHora}"}, {"{motivo}"}, {"{protocolo}"}, {"{guiche}"}, {"{endereco}"}
          </Typography>

          {saveError ? <Alert severity="error">{saveError}</Alert> : null}

          <Button variant="contained" disabled={saving} onClick={() => void salvar()} sx={{ alignSelf: "flex-start" }}>
            {saving ? "A guardar…" : "Guardar configuração"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
