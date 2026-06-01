import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminPanelToken, apiBaseUrl, useMockData } from "../config/env";
import { mockAtendentesConfig } from "../mocks/painelMockData";
import type { AgendaAtendentesConfig, AtendenteAgendaConfig, HorarioBlocoAtendente } from "../types/painel";
import { ConfirmDialog } from "./ConfirmDialog";

type RemoveConfirm =
  | { type: "atendente"; index: number; nome: string }
  | { type: "bloco"; atendenteIndex: number; blocoIndex: number; atendenteNome: string }
  | { type: "quantidade"; next: number };

type Props = {
  getAuthHeaders: () => Promise<Record<string, string>>;
};

const BLOCOS_PADRAO: HorarioBlocoAtendente[] = [
  { inicioH: 9, inicioM: 0, fimH: 12, fimM: 0 },
  { inicioH: 14, inicioM: 0, fimH: 17, fimM: 0 },
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function blocoToTime(b: HorarioBlocoAtendente, key: "inicio" | "fim"): string {
  if (key === "inicio") return `${pad2(b.inicioH)}:${pad2(b.inicioM)}`;
  return `${pad2(b.fimH)}:${pad2(b.fimM)}`;
}

function timeToHm(value: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function almocoPadrao(): HorarioBlocoAtendente {
  return { inicioH: 12, inicioM: 0, fimH: 13, fimM: 0 };
}

function toId(nome: string, index: number): string {
  const base = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34);
  return base ? `${base}-${index + 1}` : `linha-${index + 1}`;
}

function novoAtendente(index: number): AtendenteAgendaConfig {
  const nome = `Atendente ${index + 1}`;
  return {
    id: toId(nome, index),
    nome,
    intervaloMinutos: 30,
    blocos: BLOCOS_PADRAO.map((b) => ({ ...b })),
  };
}

function BlocoHorarioRow({
  inicio,
  fim,
  onInicio,
  onFim,
  onRemove,
  showRemove,
  label,
}: {
  inicio: string;
  fim: string;
  onInicio: (v: string) => void;
  onFim: (v: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  label?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
      {label ? (
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 56, fontWeight: 600 }}>
          {label}
        </Typography>
      ) : null}
      <TextField
        type="time"
        label="Início"
        size="small"
        value={inicio}
        onChange={(e) => onInicio(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: 118 }}
      />
      <TextField
        type="time"
        label="Fim"
        size="small"
        value={fim}
        onChange={(e) => onFim(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: 118 }}
      />
      {showRemove && onRemove ? (
        <IconButton size="small" color="error" onClick={onRemove} aria-label="Remover bloco">
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
}

export function AtendentesAgendaConfigEditor({ getAuthHeaders }: Props) {
  const [config, setConfig] = useState<AgendaAtendentesConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [removeConfirm, setRemoveConfirm] = useState<RemoveConfirm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    if (useMockData) {
      await new Promise((r) => setTimeout(r, 200));
      setConfig(structuredClone(mockAtendentesConfig));
      setLoading(false);
      return;
    }
    try {
      const headers: Record<string, string> = {
        ...(await getAuthHeaders()),
        Accept: "application/json",
      };
      if (adminPanelToken) headers["x-admin-token"] = adminPanelToken;
      const res = await fetch(`${apiBaseUrl}/admin/agenda-atendentes`, { headers });
      if (!res.ok) {
        throw new Error(`Falha ao carregar (${res.status}).`);
      }
      const data = (await res.json()) as AgendaAtendentesConfig;
      if (!data?.atendentes?.length) throw new Error("Resposta inválida.");
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
  }, [load, reloadTick]);

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
      const res = await fetch(`${apiBaseUrl}/admin/agenda-atendentes`, {
        method: "PUT",
        headers,
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || `Falha ao guardar (${res.status}).`);
      }
      const data = (await res.json()) as AgendaAtendentesConfig;
      setConfig(data);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const atualizarAtendente = (i: number, patch: Partial<AtendenteAgendaConfig>) => {
    setConfig((c) => {
      if (!c) return c;
      const atendentes = c.atendentes.map((a, j) => (j === i ? { ...a, ...patch } : a));
      return { atendentes };
    });
  };

  const ajustarQuantidadeAtendentes = (nextRaw: number) => {
    const next = Math.max(1, Math.min(20, Number.isFinite(nextRaw) ? Math.floor(nextRaw) : 1));
    setConfig((c) => {
      if (!c) return c;
      const cur = c.atendentes.length;
      if (next === cur) return c;
      if (next < cur) return { atendentes: c.atendentes.slice(0, next) };
      const extra = Array.from({ length: next - cur }, (_, k) => novoAtendente(cur + k));
      return { atendentes: [...c.atendentes, ...extra] };
    });
  };

  const removerAtendente = (index: number) => {
    setConfig((c) => {
      if (!c || c.atendentes.length <= 1) return c;
      return { atendentes: c.atendentes.filter((_, i) => i !== index) };
    });
  };

  const removerBloco = (atendenteIndex: number, blocoIndex: number) => {
    setConfig((c) => {
      if (!c) return c;
      return {
        atendentes: c.atendentes.map((at, i) =>
          i === atendenteIndex ? { ...at, blocos: at.blocos.filter((_, bi) => bi !== blocoIndex) } : at,
        ),
      };
    });
  };

  const solicitarQuantidade = (nextRaw: number) => {
    const next = Math.max(1, Math.min(20, Number.isFinite(nextRaw) ? Math.floor(nextRaw) : 1));
    if (!config) return;
    if (next < config.atendentes.length) {
      setRemoveConfirm({ type: "quantidade", next });
      return;
    }
    ajustarQuantidadeAtendentes(nextRaw);
  };

  const applyRemoveConfirm = () => {
    if (!removeConfirm) return;
    if (removeConfirm.type === "atendente") {
      removerAtendente(removeConfirm.index);
    } else if (removeConfirm.type === "bloco") {
      removerBloco(removeConfirm.atendenteIndex, removeConfirm.blocoIndex);
    } else {
      ajustarQuantidadeAtendentes(removeConfirm.next);
    }
  };

  const confirmDialogCopy = useMemo(() => {
    if (!removeConfirm || !config) return null;
    if (removeConfirm.type === "atendente") {
      return {
        title: "Remover atendente?",
        message: `Deseja desativar "${removeConfirm.nome}"? Os horários desta pessoa serão removidos da configuração (guarde para aplicar no bot).`,
      };
    }
    if (removeConfirm.type === "bloco") {
      return {
        title: "Remover bloco de horário?",
        message: `Remover este período de atendimento de "${removeConfirm.atendenteNome}"?`,
      };
    }
    const removidos = config.atendentes.length - removeConfirm.next;
    return {
      title: "Reduzir atendentes ativos?",
      message: `Isso remove ${removidos} atendente(s) do final da lista. Deseja continuar?`,
    };
  }, [removeConfirm, config]);

  const atualizarBloco = (
    atendenteIdx: number,
    blocoIdx: number,
    patch: Partial<HorarioBlocoAtendente>,
    target: "blocos" | "almoco",
  ) => {
    setConfig((c) => {
      if (!c) return c;
      const atendentes = c.atendentes.map((at, i) => {
        if (i !== atendenteIdx) return at;
        if (target === "almoco") {
          if (!at.almoco) return at;
          return { ...at, almoco: { ...at.almoco, ...patch } };
        }
        return {
          ...at,
          blocos: at.blocos.map((bloco, j) => (j === blocoIdx ? { ...bloco, ...patch } : bloco)),
        };
      });
      return { atendentes };
    });
  };

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        A carregar configuração da equipe…
      </Typography>
    );
  }

  if (loadError || !config) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => setReloadTick((v) => v + 1)}>
            Tentar de novo
          </Button>
        }
      >
        {loadError || "Sem dados."}
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Card variant="outlined">
        <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <TextField
              type="number"
              label="Atendentes ativos"
              size="small"
              inputProps={{ min: 1, max: 20 }}
              value={config.atendentes.length}
              onChange={(e) => solicitarQuantidade(Number(e.target.value))}
              sx={{ width: { xs: "100%", sm: 140 } }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => ajustarQuantidadeAtendentes(config.atendentes.length + 1)}
            >
              Novo atendente
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={1.5}>
        {config.atendentes.map((at, ai) => {
          const temAlmoco = Boolean(at.almoco);
          const almoco = at.almoco ?? almocoPadrao();

          return (
            <Grid key={at.id} size={{ xs: 12, lg: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardHeader
                  title={at.nome || `Atendente ${ai + 1}`}
                  subheader={`Cada horário reservado: ${at.intervaloMinutos} min`}
                  sx={{ py: 1, px: 1.5, "& .MuiCardHeader-title": { fontSize: "0.95rem" } }}
                  action={
                    config.atendentes.length > 1 ? (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setRemoveConfirm({
                            type: "atendente",
                            index: ai,
                            nome: at.nome || `Atendente ${ai + 1}`,
                          })
                        }
                        aria-label="Desativar atendente"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                />
                <Divider />
                <CardContent sx={{ pt: 1.25, pb: 1.25 }}>
                  <Grid container spacing={1} sx={{ mb: 1.25 }}>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        fullWidth
                        label="Nome"
                        size="small"
                        value={at.nome}
                        inputProps={{ maxLength: 120 }}
                        onChange={(e) => {
                          const nome = e.target.value.slice(0, 120);
                          atualizarAtendente(ai, { nome, id: toId(nome, ai) });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Duração de cada horário (min)"
                        size="small"
                        helperText="Tempo de cada marcação na agenda (15 a 180 min)"
                        inputProps={{ min: 15, max: 180, step: 5 }}
                        value={at.intervaloMinutos}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isInteger(n) && n >= 15 && n <= 180) {
                            atualizarAtendente(ai, { intervaloMinutos: n });
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.75 }}>
                    Horários de atendimento
                  </Typography>
                  <Stack spacing={0.75} sx={{ mb: 1 }}>
                    {at.blocos.map((bloco, bi) => (
                      <BlocoHorarioRow
                        key={`${at.id}-bloco-${bi}`}
                        label={at.blocos.length > 1 ? `#${bi + 1}` : undefined}
                        inicio={blocoToTime(bloco, "inicio")}
                        fim={blocoToTime(bloco, "fim")}
                        showRemove={at.blocos.length > 1}
                        onRemove={() =>
                          setRemoveConfirm({
                            type: "bloco",
                            atendenteIndex: ai,
                            blocoIndex: bi,
                            atendenteNome: at.nome || `Atendente ${ai + 1}`,
                          })
                        }
                        onInicio={(v) => {
                          const hm = timeToHm(v);
                          if (hm) atualizarBloco(ai, bi, { inicioH: hm.h, inicioM: hm.m }, "blocos");
                        }}
                        onFim={(v) => {
                          const hm = timeToHm(v);
                          if (hm) atualizarBloco(ai, bi, { fimH: hm.h, fimM: hm.m }, "blocos");
                        }}
                      />
                    ))}
                  </Stack>
                  <Button
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() =>
                      atualizarAtendente(ai, {
                        blocos: [...at.blocos, { inicioH: 9, inicioM: 0, fimH: 12, fimM: 0 }],
                      })
                    }
                    sx={{ mb: 1 }}
                  >
                    Bloco
                  </Button>

                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={temAlmoco}
                        onChange={(e) => {
                          if (e.target.checked) {
                            atualizarAtendente(ai, { almoco: almocoPadrao() });
                          } else {
                            const copia = { ...at };
                            delete copia.almoco;
                            atualizarAtendente(ai, copia);
                          }
                        }}
                      />
                    }
                    label={<Typography variant="body2">Horário de almoço</Typography>}
                    sx={{ m: 0, display: "flex" }}
                  />
                  {temAlmoco ? (
                    <Box sx={{ mt: 0.75, pl: 0.5 }}>
                      <BlocoHorarioRow
                        label="Almoço"
                        inicio={blocoToTime(almoco, "inicio")}
                        fim={blocoToTime(almoco, "fim")}
                        onInicio={(v) => {
                          const hm = timeToHm(v);
                          if (hm) atualizarBloco(ai, 0, { inicioH: hm.h, inicioM: hm.m }, "almoco");
                        }}
                        onFim={(v) => {
                          const hm = timeToHm(v);
                          if (hm) atualizarBloco(ai, 0, { fimH: hm.h, fimM: hm.m }, "almoco");
                        }}
                      />
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Button variant="contained" disabled={saving} onClick={() => void salvar()}>
          {saving ? "A guardar…" : "Guardar equipe e horários"}
        </Button>
        {saveError ? (
          <Alert severity="error" sx={{ py: 0, flex: 1 }}>
            {saveError}
          </Alert>
        ) : null}
      </Stack>

      <ConfirmDialog
        open={removeConfirm !== null && confirmDialogCopy !== null}
        title={confirmDialogCopy?.title ?? ""}
        message={confirmDialogCopy?.message ?? ""}
        confirmLabel="Remover"
        onConfirm={applyRemoveConfirm}
        onClose={() => setRemoveConfirm(null)}
      />
    </Stack>
  );
}
