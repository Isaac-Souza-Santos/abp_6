type Props = {
  loading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
};

export function PanelHeader({ loading, onRefresh, onSignOut }: Props) {
  return (
    <header className="header">
      <div>
        <h1>Painel interno de agendamentos</h1>
        <p>
          Consulte e filtre pedidos em <strong>Agendamentos</strong>. Altere status, registo de quem atendeu e observações
          em <strong>Ajustes da agenda</strong>. Configure atendentes e horários em <strong>Equipe e horários</strong>.
        </p>
      </div>
      <div className="headerActions">
        <button type="button" className="btnGhost" onClick={onSignOut}>
          Sair
        </button>
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
    </header>
  );
}
