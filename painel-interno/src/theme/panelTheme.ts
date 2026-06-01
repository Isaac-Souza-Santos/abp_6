import { createTheme } from "@mui/material/styles";

/** Tema alinhado aos tokens do painel (índigo / slate). */
export const panelTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4f46e5", dark: "#4338ca", light: "#818cf8" },
    success: { main: "#059669" },
    error: { main: "#dc2626" },
    warning: { main: "#d97706" },
    info: { main: "#2563eb" },
    background: { default: "#e8edf5", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    subtitle2: { fontWeight: 600, fontSize: "0.8rem" },
    body2: { fontSize: "0.85rem" },
    caption: { fontSize: "0.72rem", color: "#64748b" },
  },
  components: {
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 12,
          "&:last-child": { paddingBottom: 12 },
        },
      },
    },
    MuiButton: {
      defaultProps: { size: "small" },
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
    MuiTextField: {
      defaultProps: { size: "small", margin: "dense" },
    },
    MuiFormControl: {
      defaultProps: { size: "small", margin: "dense" },
    },
  },
});
