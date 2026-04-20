import type { ParticipanteFormRow } from "../utils/participantes";

const MAX_ROWS = 30;

type Props = {
  rows: ParticipanteFormRow[];
  onChange: (next: ParticipanteFormRow[]) => void;
};

export function ParticipantesAgendaFields({ rows, onChange }: Props) {
  const add = () => {
    if (rows.length >= MAX_ROWS) return;
    onChange([...rows, { nome: "", telefone: "" }]);
  };

  const remove = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const patch = (index: number, field: keyof ParticipanteFormRow, value: string) => {
    const next = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    onChange(next);
  };

  return (
    <div className="participantesBlock">
      <div className="participantesBlockHead">
        <span className="participantesBlockTitle">Outras pessoas neste agendamento</span>
        <span className="participantesBlockHint">Até {MAX_ROWS} nomes (além do solicitante principal no topo do cartão).</span>
      </div>
      {rows.length === 0 ? (
        <p className="participantesEmpty">Nenhuma pessoa adicional. Use &quot;Adicionar pessoa&quot; para incluir.</p>
      ) : (
        <ul className="participantesList">
          {rows.map((row, index) => (
            <li key={index} className="participanteRow">
              <input
                className="participanteInput"
                type="text"
                placeholder="Nome completo"
                value={row.nome}
                onChange={(e) => patch(index, "nome", e.target.value)}
                maxLength={200}
                aria-label={`Nome da pessoa ${index + 1}`}
              />
              <input
                className="participanteInput participanteInputTel"
                type="text"
                placeholder="Telefone (opcional)"
                value={row.telefone}
                onChange={(e) => patch(index, "telefone", e.target.value)}
                maxLength={40}
                aria-label={`Telefone da pessoa ${index + 1}`}
              />
              <button type="button" className="btnRemoveParticipante" onClick={() => remove(index)} aria-label="Remover pessoa">
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btnAddParticipante" onClick={add} disabled={rows.length >= MAX_ROWS}>
        + Adicionar pessoa
      </button>
    </div>
  );
}
