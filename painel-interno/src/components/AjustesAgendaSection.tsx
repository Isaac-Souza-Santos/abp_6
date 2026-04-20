import { AgendaCard } from "./AgendaCard";
import { AgendaCardEditor } from "./AgendaCardEditor";
import { adminPanelToken, apiBaseUrl } from "../config/env";
import type { Agendamento } from "../types/painel";

type Props = {
  items: Agendamento[];
  loading: boolean;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onSaved: () => void;
};

export function AjustesAgendaSection({ items, loading, getAuthHeaders, onSaved }: Props) {
  return (
    <section className="tabPanel" role="tabpanel" aria-label="Ajustes da agenda">
      <p className="tabIntro">
        Altere o <strong>status</strong>, marque <strong>virou processo</strong> / <strong>gestão pública</strong> e
        escreva <strong>observações</strong>. Use <em>Guardar alterações</em> em cada protocolo.
      </p>
      <div className="agendaList">
        {items.length === 0 ? (
          <div className="agendaEmpty">
            {loading ? "Carregando agendamentos…" : "Nenhum agendamento encontrado com os filtros atuais."}
          </div>
        ) : (
          <ul className="agendaGrid">
            {items.map((ag) => (
              <AgendaCard key={ag.id} ag={ag} variant="ajuste">
                <AgendaCardEditor
                  key={`${ag.id}-${ag.atualizadoEm}`}
                  ag={ag}
                  apiBaseUrl={apiBaseUrl}
                  adminPanelToken={adminPanelToken}
                  getAuthHeaders={getAuthHeaders}
                  onSaved={onSaved}
                />
              </AgendaCard>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
