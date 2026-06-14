import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PanelMuiProvider } from "./components/PanelMuiProvider.tsx";
import "./index.css";
import App from "./App.tsx";
import { getMsalInstance, isAzureLoginConfigured } from "./authConfig.ts";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Página sem o elemento #root necessário para o painel.");
}

void (async () => {
  // If VITE_TEST_AUTH is set, start in test mode to bypass interactive login for E2E.
  const isTestAuth = Boolean((process.env as any).VITE_TEST_AUTH || import.meta.env.VITE_TEST_AUTH);
  if (isTestAuth) {
    createRoot(rootEl).render(
      <StrictMode>
        <PanelMuiProvider>
          <App mode="test" />
        </PanelMuiProvider>
      </StrictMode>
    );
    return;
  }

  if (isAzureLoginConfigured()) {
    const { MsalProvider } = await import("@azure/msal-react");
    const instance = getMsalInstance();
    await instance.initialize();
    await instance.handleRedirectPromise();
    createRoot(rootEl).render(
      <StrictMode>
        <PanelMuiProvider>
          <MsalProvider instance={instance}>
            <App mode="azure" />
          </MsalProvider>
        </PanelMuiProvider>
      </StrictMode>
    );
  } else {
    createRoot(rootEl).render(
      <StrictMode>
        <PanelMuiProvider>
          <App mode="legacy" />
        </PanelMuiProvider>
      </StrictMode>
    );
  }
})().catch((err) => {
  console.error("[Painel] Erro ao iniciar a aplicação:", err);
  rootEl.textContent =
    "Erro ao iniciar o painel. Pressione F12, abra as ferramentas do desenvolvedor e leia as mensagens de erro (aba em que aparecem avisos em vermelho).";
});
