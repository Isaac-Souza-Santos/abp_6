import { AtendentesAgendaConfigEditor } from "./AtendentesAgendaConfigEditor";

type Props = {
  getAuthHeaders: () => Promise<Record<string, string>>;
};

export function AgendaEquipeSection({ getAuthHeaders }: Props) {
  return (
    <section className="tabPanel" role="tabpanel" aria-label="Equipe e horários">
      <p className="tabIntro">
        Aqui você define <strong>quem está ativo para atendimento</strong>, a <strong>quantidade de atendentes</strong> e
        a <strong>agenda de cada um</strong> (blocos de atendimento, intervalo e almoço).
      </p>
      <AtendentesAgendaConfigEditor getAuthHeaders={getAuthHeaders} />
    </section>
  );
}
