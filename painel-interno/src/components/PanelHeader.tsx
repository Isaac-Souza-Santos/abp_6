type Props = {
  loading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
};

export function PanelHeader({ loading, onRefresh, onSignOut }: Props) {
  return (
    <header className="panelHeader">
      <div className="panelHeaderBrand">
        <span className="panelHeaderBadge" aria-hidden="true">
          Procon
        </span>
        <div>
          <h1>Painel interno de agendamentos</h1>
          <p className="panelHeaderDesc">
            Consulte e filtre pedidos em <strong>Agendamentos</strong>. Altere status, registo de quem atendeu e
            observações em <strong>Ajustes da agenda</strong>. Configure atendentes e horários em{" "}
            <strong>Equipe e horários</strong>.
          </p>
        </div>
      </div>
      <div className="panelHeaderActions">
        <button type="button" className="btn btnGhost" onClick={onSignOut}>
          Sair
        </button>
        <button type="button" className="btn btnPrimary" onClick={onRefresh} disabled={loading}>
          {loading ? "A atualizar…" : "Atualizar"}
        </button>
      </div>
    </header>
  );
}
