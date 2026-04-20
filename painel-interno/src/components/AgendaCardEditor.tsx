import { useCallback, useState } from "react";
import { rotuloStatus, statusEditaveis } from "../constants/status";
import type { Agendamento, StatusAgendamento } from "../types/painel";
import { participantesFormFromServer, participantesPayloadEqual, participantesToPayload, type ParticipanteFormRow } from "../utils/participantes";
import { ParticipantesAgendaFields } from "./ParticipantesAgendaFields";

type Props = {
  ag: Agendamento;
  apiBaseUrl: string;
  adminPanelToken: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onSaved: () => void;
};

export function AgendaCardEditor({ ag, apiBaseUrl, adminPanelToken, getAuthHeaders, onSaved }: Props) {
  const [status, setStatus] = useState<StatusAgendamento>(ag.status);
  const [virouProcesso, setVirouProcesso] = useState(Boolean(ag.virouProcesso));
  const [gestaoPublica, setGestaoPublica] = useState(Boolean(ag.gestaoPublica));
  const [observacao, setObservacao] = useState(ag.observacaoAtendente ?? "");
  const [participantesRows, setParticipantesRows] = useState<ParticipanteFormRow[]>(() => participantesFormFromServer(ag.participantes));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const payloadParticipantes = participantesToPayload(participantesRows);

  const dirty =
    status !== ag.status ||
    virouProcesso !== Boolean(ag.virouProcesso) ||
    gestaoPublica !== Boolean(ag.gestaoPublica) ||
    observacao !== (ag.observacaoAtendente ?? "") ||
    !participantesPayloadEqual(ag.participantes, payloadParticipantes);

  const save = useCallback(async () => {
    setSaveError("");
    setSaving(true);
    try {
      const url = new URL(`${apiBaseUrl}/admin/agendamentos/${encodeURIComponent(ag.id)}`);
      if (adminPanelToken) {
        url.searchParams.set("token", adminPanelToken);
      }
      const headers = await getAuthHeaders();
      const body: Record<string, unknown> = {};
      if (status !== ag.status) body.status = status;
      if (virouProcesso !== Boolean(ag.virouProcesso)) body.virouProcesso = virouProcesso;
      if (gestaoPublica !== Boolean(ag.gestaoPublica)) body.gestaoPublica = gestaoPublica;
      if (observacao !== (ag.observacaoAtendente ?? "")) body.observacaoAtendente = observacao;
      const nextP = participantesToPayload(participantesRows);
      if (!participantesPayloadEqual(ag.participantes, nextP)) {
        body.participantes = nextP;
      }

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
  }, [
    ag,
    apiBaseUrl,
    adminPanelToken,
    gestaoPublica,
    getAuthHeaders,
    observacao,
    onSaved,
    participantesRows,
    status,
    virouProcesso,
  ]);

  return (
    <div className="agendaControls">
      <ParticipantesAgendaFields rows={participantesRows} onChange={setParticipantesRows} />

      <div className="agendaControlsRow">
        <label className="agendaField">
          <span className="agendaFieldLabel">Status</span>
          <select
            className="agendaSelect"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusAgendamento)}
            aria-label="Status do agendamento"
          >
            {statusEditaveis.map((s) => (
              <option key={s} value={s}>
                {rotuloStatus[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="agendaCheck">
          <input type="checkbox" checked={virouProcesso} onChange={(e) => setVirouProcesso(e.target.checked)} />
          <span>Virou processo</span>
        </label>
        <label className="agendaCheck">
          <input type="checkbox" checked={gestaoPublica} onChange={(e) => setGestaoPublica(e.target.checked)} />
          <span>Gestão pública</span>
        </label>
      </div>
      <label className="agendaField agendaFieldBlock">
        <span className="agendaFieldLabel">Observação do atendente</span>
        <textarea
          className="agendaTextarea"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
          maxLength={4000}
          placeholder="Notas internas (opcional)…"
        />
      </label>
      <div className="agendaControlsActions">
        <button type="button" className="btnSave" disabled={!dirty || saving} onClick={() => void save()}>
          {saving ? "A guardar…" : "Guardar alterações"}
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
