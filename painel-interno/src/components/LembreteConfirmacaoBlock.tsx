import { useCallback, useEffect, useState } from "react";
import { adminPanelToken, apiBaseUrl } from "../config/env";
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
      <div className="agendaConfigCard panelStack">
        <p className="agendaConfigLead" style={{ marginBottom: 0 }}>
          A carregar lembrete por WhatsApp…
        </p>
      </div>
    );
  }

  if (loadError && !config) {
    return (
      <div className="agendaConfigCard panelStack">
        <p className="agendaConfigError">{loadError}</p>
        <button type="button" className="btn btnSecondary btnSmall" onClick={() => void load()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="agendaConfigCard panelStack">
      <h2 className="agendaConfigTitle">Confirmação por WhatsApp (automático)</h2>
      <p className="agendaConfigLead">
        O bot envia esta mensagem <strong>uma vez por agendamento</strong>, quando faltar o número de dias abaixo até o
        horário reservado (<code>slot</code>), desde que o protocolo tenha horário na agenda, não esteja cancelado,
        confirmado ou atendido e o WhatsApp do servidor esteja ligado. O padrão é <strong>1 dia antes</strong>. Inclua no
        texto a pergunta com <strong>*1*</strong> (sim) e <strong>*2*</strong> (não): o cidadão responde e o sistema
        atualiza o status para <em>confirmado</em> ou <em>cancelado</em>.
      </p>

      <label className="agendaCheckBlock" style={{ display: "flex", gap: "10px", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={config.ativo}
          onChange={(e) => setConfig({ ...config, ativo: e.target.checked })}
        />
        <span>Enviar lembretes automáticos</span>
      </label>

      <div style={{ marginTop: "14px" }}>
        <label className="agendaConfigSub" htmlFor="antecedenciaDias" style={{ display: "block", marginBottom: "6px" }}>
          Dias de antecedência (1 a 14)
        </label>
        <input
          id="antecedenciaDias"
          type="number"
          min={1}
          max={14}
          className="agendaIntervalInput"
          value={config.antecedenciaDias}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isInteger(n) || n < 1 || n > 14) return;
            setConfig({ ...config, antecedenciaDias: n });
          }}
        />
      </div>

      <p className="agendaConfigSub" style={{ marginTop: "16px" }}>
        Texto da mensagem (use os marcadores abaixo)
      </p>
      <textarea
        className="lembreteTemplateTextarea"
        value={config.mensagemTemplate}
        onChange={(e) => setConfig({ ...config, mensagemTemplate: e.target.value })}
        rows={14}
        spellCheck={false}
      />
      <p className="agendaFieldHint" style={{ marginTop: "8px", fontSize: "0.82rem", color: "#64748b" }}>
        Marcadores: <code>{"{nome}"}</code>, <code>{"{dataHora}"}</code>, <code>{"{motivo}"}</code>,{" "}
        <code>{"{protocolo}"}</code>, <code>{"{guiche}"}</code>, <code>{"{endereco}"}</code>. O modelo padrão já pede{" "}
        <em>1</em> / <em>2</em> para confirmar ou cancelar o comparecimento.
      </p>

      {saveError ? <p className="agendaConfigError">{saveError}</p> : null}

      <div className="agendaConfigActions">
        <button type="button" className="btn btnPrimary" disabled={saving} onClick={() => void salvar()}>
          {saving ? "A guardar…" : "Guardar lembrete"}
        </button>
      </div>
    </div>
  );
}
