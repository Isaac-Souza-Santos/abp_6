import { useCallback, useEffect, useState } from "react";
import { adminPanelToken, apiBaseUrl } from "../config/env";
import type { AgendaAtendentesConfig, AtendenteAgendaConfig, HorarioBlocoAtendente } from "../types/painel";

type Props = {
  getAuthHeaders: () => Promise<Record<string, string>>;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function almocoToTime(b: HorarioBlocoAtendente, key: "inicio" | "fim"): string {
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

export function AtendentesAgendaConfigEditor({ getAuthHeaders }: Props) {
  const [config, setConfig] = useState<AgendaAtendentesConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
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
    void load();
  }, [load]);

  const salvar = async () => {
    if (!config) return;
    setSaving(true);
    setSaveError(null);
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

  if (loading) {
    return (
      <div className="agendaConfigCard">
        <p className="agendaConfigLead">A carregar horários de almoço…</p>
      </div>
    );
  }

  if (loadError || !config) {
    return (
      <div className="agendaConfigCard">
        <p className="agendaConfigError" role="alert">
          {loadError || "Sem dados."}
        </p>
        <button type="button" className="btnSecondary" onClick={() => void load()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="agendaConfigCard">
      <h2 className="agendaConfigTitle">Horário de almoço por atendente</h2>
      <p className="agendaConfigLead">
        Marque o intervalo em que <strong>este atendente não recebe marcações</strong> (ex.: 12h00–13h00). O expediente
        padrão (9h–12h e 14h–17h, slots de 30 min) continua definido no sistema; aqui altera-se apenas o almoço.
      </p>

      <div className="agendaConfigList">
        {config.atendentes.map((at, ai) => {
          const temAlmoco = Boolean(at.almoco);
          const almoco = at.almoco ?? almocoPadrao();
          return (
            <div key={at.id} className="agendaConfigAtendente">
              <p className="agendaConfigAtendenteNome">{at.nome}</p>
              <label className="agendaCheck agendaCheckBlock">
                <input
                  type="checkbox"
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
                <span>Reservar horário de almoço (não oferecer slots neste intervalo)</span>
              </label>
              {temAlmoco ? (
                <div className="agendaConfigBlocoRow">
                  <label className="agendaField">
                    <span className="agendaFieldLabel">Início do almoço</span>
                    <input
                      type="time"
                      className="agendaInput agendaTimeInput"
                      value={almocoToTime(almoco, "inicio")}
                      onChange={(e) => {
                        const hm = timeToHm(e.target.value);
                        if (hm && at.almoco) {
                          atualizarAtendente(ai, {
                            almoco: { ...at.almoco, inicioH: hm.h, inicioM: hm.m },
                          });
                        }
                      }}
                    />
                  </label>
                  <label className="agendaField">
                    <span className="agendaFieldLabel">Fim do almoço</span>
                    <input
                      type="time"
                      className="agendaInput agendaTimeInput"
                      value={almocoToTime(almoco, "fim")}
                      onChange={(e) => {
                        const hm = timeToHm(e.target.value);
                        if (hm && at.almoco) {
                          atualizarAtendente(ai, {
                            almoco: { ...at.almoco, fimH: hm.h, fimM: hm.m },
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="agendaConfigActions">
        <button type="button" className="btnSave" disabled={saving} onClick={() => void salvar()}>
          {saving ? "A guardar…" : "Guardar horários de almoço"}
        </button>
        {saveError ? (
          <span className="agendaSaveError" role="alert">
            {saveError}
          </span>
        ) : null}
      </div>
    </div>
  );
}
