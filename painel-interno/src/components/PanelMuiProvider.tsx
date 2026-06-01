import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { panelTheme } from "../theme/panelTheme";

type Props = { children: ReactNode };

export function PanelMuiProvider({ children }: Props) {
  return (
    <ThemeProvider theme={panelTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
