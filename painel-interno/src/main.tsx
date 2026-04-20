import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { getMsalInstance, isAzureLoginConfigured } from "./authConfig.ts";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Página sem o elemento #root necessário para o painel.");
}

void (async () => {
  if (isAzureLoginConfigured()) {
    const { MsalProvider } = await import("@azure/msal-react");
    const instance = getMsalInstance();
    await instance.initialize();
    await instance.handleRedirectPromise();
    createRoot(rootEl).render(
      <StrictMode>
        <MsalProvider instance={instance}>
          <App mode="azure" />
        </MsalProvider>
      </StrictMode>
    );
  } else {
    createRoot(rootEl).render(
      <StrictMode>
        <App mode="legacy" />
      </StrictMode>
    );
  }
})().catch((err) => {
  console.error("[Painel] Erro ao iniciar a aplicação:", err);
  rootEl.textContent =
    "Erro ao iniciar o painel. Pressione F12, abra as ferramentas do desenvolvedor e leia as mensagens de erro (aba em que aparecem avisos em vermelho).";
});
