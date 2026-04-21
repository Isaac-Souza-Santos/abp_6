import { useCallback, useEffect, useState } from "react";
import { adminPanelToken, apiBaseUrl } from "../config/env";
import type { AgendaAtendentesConfig, AtendenteAgendaConfig, HorarioBlocoAtendente } from "../types/painel";

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
      <div className="agendaConfigCard">
        <p className="agendaConfigLead">A carregar configuração da equipe…</p>
      </div>
    );
  }

  if (loadError || !config) {
    return (
      <div className="agendaConfigCard">
        <p className="agendaConfigError" role="alert">
          {loadError || "Sem dados."}
        </p>
        <button type="button" className="btn btnSecondary" onClick={() => void load()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="agendaConfigCard">
      <h2 className="agendaConfigTitle">Atendentes ativos, quantidade e agenda por atendente</h2>
      <p className="agendaConfigLead">
        Nesta aba você controla quem está ativo para receber marcações. Para <strong>ativar</strong>, adicione atendentes;
        para <strong>desativar</strong>, remova. Também pode ajustar intervalo, blocos de atendimento e almoço de cada um.
      </p>

      <div className="agendaConfigBlocoRow">
        <label className="agendaField">
          <span className="agendaFieldLabel">Quantidade de atendentes ativos</span>
          <input
            type="number"
            min={1}
            max={20}
            className="agendaInput agendaIntervalInput"
            value={config.atendentes.length}
            onChange={(e) => ajustarQuantidadeAtendentes(Number(e.target.value))}
          />
        </label>
        <button type="button" className="btn btnSecondary btnSmall" onClick={() => ajustarQuantidadeAtendentes(config.atendentes.length + 1)}>
          + Ativar novo atendente
        </button>
      </div>

      <div className="agendaConfigList">
        {config.atendentes.map((at, ai) => {
          const temAlmoco = Boolean(at.almoco);
          const almoco = at.almoco ?? almocoPadrao();
          return (
            <div key={at.id} className="agendaConfigAtendente">
              <div className="agendaConfigBlocoRow">
                <label className="agendaField">
                  <span className="agendaFieldLabel">Nome do atendente</span>
                  <input
                    type="text"
                    className="agendaInput"
                    value={at.nome}
                    maxLength={120}
                    onChange={(e) => {
                      const nome = e.target.value.slice(0, 120);
                      atualizarAtendente(ai, { nome, id: toId(nome, ai) });
                    }}
                  />
                </label>
                <label className="agendaField">
                  <span className="agendaFieldLabel">Intervalo dos slots (min)</span>
                  <input
                    type="number"
                    className="agendaInput agendaIntervalInput"
                    min={15}
                    max={180}
                    step={5}
                    value={at.intervaloMinutos}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isInteger(n) && n >= 15 && n <= 180) {
                        atualizarAtendente(ai, { intervaloMinutos: n });
                      }
                    }}
                  />
                </label>
                {config.atendentes.length > 1 ? (
                  <button type="button" className="btnRemoveLine" onClick={() => removerAtendente(ai)}>
                    Desativar este atendente
                  </button>
                ) : null}
              </div>

              <p className="agendaConfigSub">Agenda de atendimento</p>
              <ul className="agendaConfigBlocos">
                {at.blocos.map((bloco, bi) => (
                  <li key={`${at.id}-bloco-${bi}`} className="agendaConfigBlocoRow">
                    <label className="agendaField">
                      <span className="agendaFieldLabel">Início</span>
                      <input
                        type="time"
                        className="agendaInput agendaTimeInput"
                        value={blocoToTime(bloco, "inicio")}
                        onChange={(e) => {
                          const hm = timeToHm(e.target.value);
                          if (hm) atualizarBloco(ai, bi, { inicioH: hm.h, inicioM: hm.m }, "blocos");
                        }}
                      />
                    </label>
                    <label className="agendaField">
                      <span className="agendaFieldLabel">Fim</span>
                      <input
                        type="time"
                        className="agendaInput agendaTimeInput"
                        value={blocoToTime(bloco, "fim")}
                        onChange={(e) => {
                          const hm = timeToHm(e.target.value);
                          if (hm) atualizarBloco(ai, bi, { fimH: hm.h, fimM: hm.m }, "blocos");
                        }}
                      />
                    </label>
                    {at.blocos.length > 1 ? (
                      <button
                        type="button"
                        className="btnRemoveLine"
                        onClick={() => {
                          atualizarAtendente(ai, { blocos: at.blocos.filter((_, i) => i !== bi) });
                        }}
                      >
                        Remover bloco
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btnSecondary btnSmall"
                onClick={() => {
                  atualizarAtendente(ai, {
                    blocos: [...at.blocos, { inicioH: 9, inicioM: 0, fimH: 12, fimM: 0 }],
                  });
                }}
              >
                + Adicionar bloco de agenda
              </button>

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
                      value={blocoToTime(almoco, "inicio")}
                      onChange={(e) => {
                        const hm = timeToHm(e.target.value);
                        if (hm) {
                          atualizarBloco(ai, 0, { inicioH: hm.h, inicioM: hm.m }, "almoco");
                        }
                      }}
                    />
                  </label>
                  <label className="agendaField">
                    <span className="agendaFieldLabel">Fim do almoço</span>
                    <input
                      type="time"
                      className="agendaInput agendaTimeInput"
                      value={blocoToTime(almoco, "fim")}
                      onChange={(e) => {
                        const hm = timeToHm(e.target.value);
                        if (hm) {
                          atualizarBloco(ai, 0, { fimH: hm.h, fimM: hm.m }, "almoco");
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
        <button type="button" className="btn btnPrimary" disabled={saving} onClick={() => void salvar()}>
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
