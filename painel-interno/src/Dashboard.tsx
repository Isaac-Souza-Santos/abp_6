import Alert from "@mui/material/Alert";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AgendaEquipeSection } from "./components/AgendaEquipeSection";
import { WhatsappConfigSection } from "./components/WhatsappConfigSection";
import { AjustesAgendaSection } from "./components/AjustesAgendaSection";
import { AgendaConsultaList } from "./components/AgendaConsultaList";
import { FiltersBar } from "./components/FiltersBar";
import { MetricsTabPanel } from "./components/MetricsTabPanel";
import { PanelHeader } from "./components/PanelHeader";
import { PanelTabList } from "./components/PanelTabList";
import { adminPanelToken, apiBaseUrl, useMockData } from "./config/env";
import { mockApiResponse } from "./mocks/painelMockData";
import type { Agendamento, ApiResponse, PainelTab, StatusAgendamento } from "./types/painel";
import "./App.css";

export type DashboardProps = {
  getIdToken: () => Promise<string | null>;
  /** Nome da conta Microsoft (quando o painel usa login Azure). */
  nomeUtilizadorSessao?: string;
  onSignOut: () => void;
};

export default function Dashboard({ getIdToken, nomeUtilizadorSessao, onSignOut }: DashboardProps) {
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
    if (useMockData) {
      await new Promise((r) => setTimeout(r, 350));
      setData(mockApiResponse);
      setLoading(false);
      return;
    }
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

  const buildExportFileName = useCallback((ext: "csv" | "json"): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `agendamentos-filtrados-${y}${m}${d}-${hh}${mm}.${ext}`;
  }, []);

  const downloadTextFile = useCallback((filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportFilteredAsJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      filters: { searchTerm, statusFilter, dateFilter },
      total: filteredAgendamentos.length,
      agendamentos: filteredAgendamentos,
    };
    downloadTextFile(buildExportFileName("json"), JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  }, [buildExportFileName, dateFilter, downloadTextFile, filteredAgendamentos, searchTerm, statusFilter]);

  const exportFilteredAsCsv = useCallback(() => {
    const headers = [
      "id",
      "status",
      "nome",
      "telefone",
      "slotInicio",
      "dataPreferida",
      "motivo",
      "atendenteNome",
      "atendenteId",
      "virouProcesso",
      "gestaoPublica",
    ];
    const esc = (v: unknown): string => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];
    for (const ag of filteredAgendamentos) {
      lines.push(
        [
          ag.id,
          ag.status,
          ag.nome,
          ag.telefone,
          ag.slotInicio ?? "",
          ag.dataPreferida,
          ag.motivo,
          ag.atendenteNome ?? "",
          ag.atendenteId ?? "",
          ag.virouProcesso ? "sim" : "nao",
          ag.gestaoPublica ? "sim" : "nao",
        ]
          .map(esc)
          .join(",")
      );
    }
    downloadTextFile(buildExportFileName("csv"), `${lines.join("\n")}\n`, "text/csv;charset=utf-8");
  }, [buildExportFileName, downloadTextFile, filteredAgendamentos]);

  return (
    <div className="appShell">
      <main className="container">
        <PanelHeader loading={loading} onRefresh={() => void loadData()} onSignOut={onSignOut} />

        {useMockData ? (
          <Alert severity="warning" variant="outlined" sx={{ py: 0.25 }}>
            Modo demonstração: dados fictícios (apenas desenvolvimento local). Para usar a API real, defina{" "}
            <code>VITE_USE_MOCK_DATA=false</code> em <code>.env.local</code>.
          </Alert>
        ) : null}

        <PanelTabList active={tab} onChange={setTab} />

        {error ? <Alert severity="error">{error}</Alert> : null}

        {(tab === "agendamentos" || tab === "ajustes") && (
          <FiltersBar
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            dateFilter={dateFilter}
            exportDisabled={filteredAgendamentos.length === 0}
            onSearchChange={setSearchTerm}
            onStatusChange={setStatusFilter}
            onDateChange={setDateFilter}
            onExportCsv={exportFilteredAsCsv}
            onExportJson={exportFilteredAsJson}
          />
        )}

        {tab === "agendamentos" && <AgendaConsultaList items={filteredAgendamentos} loading={loading} />}

        {tab === "ajustes" && (
          <AjustesAgendaSection
            items={filteredAgendamentos}
            loading={loading}
            getAuthHeaders={buildAuthHeaders}
            nomeUtilizadorSessao={nomeUtilizadorSessao}
            onSaved={() => void loadData()}
          />
        )}

        {tab === "whatsapp" && <WhatsappConfigSection getAuthHeaders={buildAuthHeaders} />}

        {tab === "equipe" && <AgendaEquipeSection getAuthHeaders={buildAuthHeaders} />}

        {tab === "metricas" && <MetricsTabPanel data={data} loading={loading} />}
      </main>
    </div>
  );
}
