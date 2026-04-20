import { AgendaCard } from "./AgendaCard";
import type { Agendamento } from "../types/painel";

type Props = {
  items: Agendamento[];
  loading: boolean;
};

export function AgendaConsultaList({ items, loading }: Props) {
  if (items.length === 0) {
    return (
      <section className="agendaList" role="tabpanel" aria-label="Lista de agendamentos">
        <div className="agendaEmpty">
          {loading ? "Carregando agendamentos…" : "Nenhum agendamento encontrado com os filtros atuais."}
        </div>
      </section>
    );
  }

  return (
    <section className="agendaList" role="tabpanel" aria-label="Lista de agendamentos">
      <ul className="agendaGrid">
        {items.map((ag) => (
          <AgendaCard key={ag.id} ag={ag} variant="consulta" />
        ))}
      </ul>
    </section>
  );
}
