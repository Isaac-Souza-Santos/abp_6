import type { ReactNode } from "react";
import { rotuloStatus } from "../constants/status";
import type { Agendamento } from "../types/painel";
import { formatDateTime } from "../utils/formatDate";

type Variant = "consulta" | "ajuste";

type Props = {
  ag: Agendamento;
  variant: Variant;
  children?: ReactNode;
};

export function AgendaCard({ ag, variant, children }: Props) {
  const cardClass = variant === "ajuste" ? "agendaCard agendaCardEditable" : "agendaCard";

  return (
    <li className={cardClass}>
      <div className="agendaCardTop">
        <span className={`status status-${ag.status}`}>{rotuloStatus[ag.status]}</span>
        <span className="agendaProtocol" title="Protocolo">
          {ag.id}
        </span>
      </div>
      <p className="agendaName">{ag.nome}</p>
      <p className="agendaMotivo">{ag.motivo}</p>

      {ag.participantes && ag.participantes.length > 0 ? (
        <div className="agendaParticipantesReadonly">
          <span className="agendaParticipantesLabel">Outras pessoas neste agendamento</span>
          <ul className="agendaParticipantesUl">
            {ag.participantes.map((p, i) => (
              <li key={i}>
                <strong>{p.nome}</strong>
                {p.telefone ? <span className="agendaParticipantesTel"> · {p.telefone}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {variant === "consulta" && ag.observacaoAtendente ? (
        <div className="agendaObsReadonly">
          <span className="agendaObsLabel">Observação atual</span>
          <p className="agendaObsText">{ag.observacaoAtendente}</p>
        </div>
      ) : null}

      <dl className="agendaMeta">
        <div>
          <dt>Contato</dt>
          <dd>{ag.telefone}</dd>
        </div>
        <div>
          <dt>Data preferida</dt>
          <dd>{ag.dataPreferida || formatDateTime(ag.slotInicio || "")}</dd>
        </div>
        {ag.atendenteNome || ag.atendenteId ? (
          <div>
            <dt>Linha de atendimento</dt>
            <dd>{ag.atendenteNome || ag.atendenteId}</dd>
          </div>
        ) : null}
        {variant === "consulta" ? (
          <div>
            <dt>Criado em</dt>
            <dd>{formatDateTime(ag.criadoEm)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Atualizado</dt>
          <dd>{formatDateTime(ag.atualizadoEm)}</dd>
        </div>
      </dl>

      {children}
    </li>
  );
}
