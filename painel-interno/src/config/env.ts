/** URL base da API do bot (sem barra final). */
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Token estático opcional para `/admin/*`. */
export const adminPanelToken = import.meta.env.VITE_ADMIN_PANEL_TOKEN || "";
