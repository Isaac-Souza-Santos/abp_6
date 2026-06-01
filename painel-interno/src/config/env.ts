/** URL base da API do bot (sem barra final). */
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Token estático opcional para `/admin/*`. */
export const adminPanelToken = import.meta.env.VITE_ADMIN_PANEL_TOKEN || "";

/**
 * Dados fictícios para pré-visualizar o painel sem API (só em `npm run dev`).
 * Defina `VITE_USE_MOCK_DATA=false` no `.env.local` para usar o backend real.
 */
export const useMockData =
  import.meta.env.DEV && String(import.meta.env.VITE_USE_MOCK_DATA ?? "true").toLowerCase() !== "false";
