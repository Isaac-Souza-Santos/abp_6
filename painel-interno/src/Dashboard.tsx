import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

type StatusAgendamento = "solicitado" | "confirmado" | "cancelado" | "atendido";

type Agendamento = {
  id: string;
  telefone: string;
  nome: string;
  motivo: string;
  dataPreferida: string;
  slotInicio?: string;
  status: StatusAgendamento;
  criadoEm: string;
  atualizadoEm: string;
  virouProcesso?: boolean;
  gestaoPublica?: boolean;
};

type ApiResponse = {
  total: number;
  agendamentos: Agendamento[];
  metricas: {
    total: number;
    hoje: number;
    ultimos7Dias: number;
    viraDado: number;
    viraProcesso: number;
    gestaoPublica: number;
    porStatus: Record<StatusAgendamento, number>;
  };
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const adminPanelToken = import.meta.env.VITE_ADMIN_PANEL_TOKEN || "";
const statusOptions: Array<StatusAgendamento | "todos"> = ["todos", "solicitado", "confirmado", "cancelado", "atendido"];

type PainelTab = "agendamentos" | "metricas";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

export type DashboardProps = {
  /** ID token Entra (Bearer) quando login Azure está ativo; null em modo legado. */
  getIdToken: () => Promise<string | null>;
  onSignOut?: () => void;
};

export default function Dashboard({ getIdToken, onSignOut }: DashboardProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<PainelTab>("agendamentos");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusAgendamento | "todos">("todos");
  const [dateFilter, setDateFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${apiBaseUrl}/admin/agendamentos`);
      if (adminPanelToken) {
        url.searchParams.set("token", adminPanelToken);
      }

      const idToken = await getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
      if (adminPanelToken) {
        headers["x-admin-token"] = adminPanelToken;
      }

      const response = await fetch(url.toString(), { headers });
      if (!response.ok) {
        throw new Error(`Falha ao carregar agendamentos (${response.status}).`);
      }

      const payload = (await response.json()) as ApiResponse;
      setData(payload);
    } catch (err) {
      let message = err instanceof Error ? err.message : "Erro desconhecido ao carregar dados.";
      if (message === "Failed to fetch" || message.includes("NetworkError")) {
        message =
          "Falha de rede ou CORS. Confirme: (1) URL da API em build (VITE_API_BASE_URL) aponta para o bot público em HTTPS; " +
          "(2) a imagem do bot em produção inclui GET /admin/agendamentos e ADMIN_PANEL_ORIGIN igual à URL deste painel (https); " +
          "(3) no DevTools → Network, veja se o pedido aparece como bloqueado por CORS.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredAgendamentos = useMemo(() => {
    if (!data) return [];

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return data.agendamentos.filter((ag) => {
      if (statusFilter !== "todos" && ag.status !== statusFilter) {
        return false;
      }

      if (dateFilter) {
        const sourceDate = ag.slotInicio || ag.criadoEm;
        if (!sourceDate.startsWith(dateFilter)) {
          return false;
        }
      }

      if (!normalizedSearch) return true;
      const haystack = `${ag.id} ${ag.nome} ${ag.telefone} ${ag.motivo}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [data, dateFilter, searchTerm, statusFilter]);

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>Painel interno de agendamentos</h1>
          <p>Visualização somente leitura do bot Procon Jacareí.</p>
        </div>
        <div className="headerActions">
          {onSignOut && (
            <button type="button" className="btnGhost" onClick={onSignOut}>
              Sair
            </button>
          )}
          <button type="button" onClick={() => void loadData()} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Secções do painel">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "agendamentos"}
          className={`tab ${tab === "agendamentos" ? "tabActive" : ""}`}
          onClick={() => setTab("agendamentos")}
        >
          Agendamentos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "metricas"}
          className={`tab ${tab === "metricas" ? "tabActive" : ""}`}
          onClick={() => setTab("metricas")}
        >
          Métricas
        </button>
      </nav>

      {error && <p className="error">{error}</p>}

      {tab === "agendamentos" && (
        <>
          <section className="filters">
            <input
              type="search"
              placeholder="Buscar por nome, telefone, protocolo ou motivo..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusAgendamento | "todos")}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </section>

          <section className="tableWrap" role="tabpanel">
            <table>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Data/horário</th>
                  <th>Status</th>
                  <th>Criação</th>
                  <th>Ciclo do protocolo</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgendamentos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty">
                      {loading ? "Carregando agendamentos..." : "Nenhum agendamento encontrado para os filtros aplicados."}
                    </td>
                  </tr>
                )}
                {filteredAgendamentos.map((ag) => (
                  <tr key={ag.id}>
                    <td>{ag.id}</td>
                    <td>{ag.nome}</td>
                    <td>{ag.telefone}</td>
                    <td>{ag.dataPreferida || formatDateTime(ag.slotInicio || "")}</td>
                    <td>
                      <span className={`status status-${ag.status}`}>{ag.status}</span>
                    </td>
                    <td>{formatDateTime(ag.criadoEm)}</td>
                    <td>
                      {ag.virouProcesso ? "Processo" : "-"} / {ag.gestaoPublica ? "Gestão" : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === "metricas" && (
        <div className="tabPanel" role="tabpanel">
          {!data?.metricas && (
            <p className="emptyInline">{loading ? "A carregar métricas…" : "Sem dados de métricas."}</p>
          )}
          {data?.metricas && (
            <>
              <p className="metricsLead">
                Resumo calculado no servidor a partir de todos os agendamentos ({data.total} registos na API).
              </p>
              <section className="cards">
                <article className="card">
                  <span>Total (agendamentos)</span>
                  <strong>{data.metricas.total}</strong>
                </article>
                <article className="card">
                  <span>Hoje</span>
                  <strong>{data.metricas.hoje}</strong>
                </article>
                <article className="card">
                  <span>Últimos 7 dias</span>
                  <strong>{data.metricas.ultimos7Dias}</strong>
                </article>
                <article className="card">
                  <span>Vira dado</span>
                  <strong>{data.metricas.viraDado}</strong>
                </article>
                <article className="card">
                  <span>Virou processo</span>
                  <strong>{data.metricas.viraProcesso}</strong>
                </article>
                <article className="card">
                  <span>Gestão pública</span>
                  <strong>{data.metricas.gestaoPublica}</strong>
                </article>
              </section>

              <section className="metricsBlock">
                <h2 className="metricsBlockTitle">Por status de agendamento</h2>
                <div className="tableWrap">
                  <table className="metricsTable">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Quantidade</th>
                        <th>Parte do total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(["solicitado", "confirmado", "cancelado", "atendido"] as StatusAgendamento[]).map((st) => {
                        const q = data.metricas.porStatus[st] ?? 0;
                        const pct =
                          data.metricas.total > 0 ? Math.round((q / data.metricas.total) * 1000) / 10 : 0;
                        return (
                          <tr key={st}>
                            <td>
                              <span className={`status status-${st}`}>{st}</span>
                            </td>
                            <td>{q}</td>
                            <td>
                              <div className="barCell">
                                <div className="barTrack" aria-hidden>
                                  <div className="barFill" style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="barPct">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </main>
  );
}
