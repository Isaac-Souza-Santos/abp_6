import { useCallback, useEffect, useMemo, useState } from "react";
import { AjustesAgendaSection } from "./components/AjustesAgendaSection";
import { AgendaConsultaList } from "./components/AgendaConsultaList";
import { FiltersBar } from "./components/FiltersBar";
import { MetricsTabPanel } from "./components/MetricsTabPanel";
import { PanelHeader } from "./components/PanelHeader";
import { PanelTabList } from "./components/PanelTabList";
import { adminPanelToken, apiBaseUrl } from "./config/env";
import type { Agendamento, ApiResponse, PainelTab, StatusAgendamento } from "./types/painel";
import "./App.css";

export type DashboardProps = {
  getIdToken: () => Promise<string | null>;
  onSignOut: () => void;
};

export default function Dashboard({ getIdToken, onSignOut }: DashboardProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<PainelTab>("agendamentos");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusAgendamento | "todos">("todos");
  const [dateFilter, setDateFilter] = useState("");

  const buildAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const idToken = await getIdToken();
    const headers: Record<string, string> = {};
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }
    if (adminPanelToken) {
      headers["x-admin-token"] = adminPanelToken;
    }
    return headers;
  }, [getIdToken]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${apiBaseUrl}/admin/agendamentos`);
      if (adminPanelToken) {
        url.searchParams.set("token", adminPanelToken);
      }

      const headers = await buildAuthHeaders();

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
          "Falha de rede ou CORS. Verifique: (1) se no build a variável VITE_API_BASE_URL aponta para a URL pública do bot em HTTPS; " +
          "(2) se em produção a imagem do bot expõe GET /admin/agendamentos e se ADMIN_PANEL_ORIGIN coincide com a URL deste painel (https); " +
          "(3) no navegador, F12 → Rede, se o pedido foi bloqueado por CORS.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buildAuthHeaders]);

  useEffect(() => {
    // Fetch inicial na montagem (loadData atualiza estado após GET).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intencional
    void loadData();
  }, [loadData]);

  const filteredAgendamentos = useMemo((): Agendamento[] => {
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
      const extras = (ag.participantes ?? [])
        .map((p) => `${p.nome} ${p.telefone ?? ""}`)
        .join(" ");
      const haystack = `${ag.id} ${ag.nome} ${ag.telefone} ${ag.motivo} ${extras}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [data, dateFilter, searchTerm, statusFilter]);

  return (
    <main className="container">
      <PanelHeader loading={loading} onRefresh={() => void loadData()} onSignOut={onSignOut} />

      <PanelTabList active={tab} onChange={setTab} />

      {error && <p className="error">{error}</p>}

      {(tab === "agendamentos" || tab === "ajustes") && (
        <FiltersBar
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onDateChange={setDateFilter}
        />
      )}

      {tab === "agendamentos" && <AgendaConsultaList items={filteredAgendamentos} loading={loading} />}

      {tab === "ajustes" && (
        <AjustesAgendaSection
          items={filteredAgendamentos}
          loading={loading}
          getAuthHeaders={buildAuthHeaders}
          onSaved={() => void loadData()}
        />
      )}

      {tab === "metricas" && <MetricsTabPanel data={data} loading={loading} />}
    </main>
  );
}
