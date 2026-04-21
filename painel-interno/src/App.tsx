import { useCallback } from "react";
import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import Dashboard from "./Dashboard";
import { LoginScreen } from "./LoginScreen";
import { loginRequest } from "./authConfig";

export type AppMode = "azure" | "legacy";

export type AppProps = {
  mode: AppMode;
};

function AzureShell() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const getIdToken = useCallback(async () => {
    const account = accounts[0];
    if (!account) return null;
    const result = await instance.acquireTokenSilent({
      scopes: [...loginRequest.scopes],
      account,
    });
    return result.idToken ?? null;
  }, [instance, accounts]);

  const msalBooting =
    inProgress === InteractionStatus.Startup || inProgress === InteractionStatus.HandleRedirect;

  if (msalBooting) {
    return (
      <div className="appBoot" role="status" aria-live="polite">
        Iniciando sessão…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const account = accounts[0];
  const nomeUtilizadorSessao = account?.name?.trim() || account?.username?.trim() || undefined;

  return (
    <Dashboard
      getIdToken={getIdToken}
      nomeUtilizadorSessao={nomeUtilizadorSessao}
      onSignOut={() => {
        void instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
      }}
    />
  );
}

function legacySignOut(): void {
  try {
    sessionStorage.clear();
  } catch {
    /* ignorar */
  }
  window.location.reload();
}

export default function App({ mode }: AppProps) {
  if (mode === "legacy") {
    return <Dashboard getIdToken={async () => null} nomeUtilizadorSessao={undefined} onSignOut={legacySignOut} />;
  }
  return <AzureShell />;
}
