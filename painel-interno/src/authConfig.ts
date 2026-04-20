import type { Configuration, RedirectRequest } from "@azure/msal-browser";
import { PublicClientApplication } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID?.trim() ?? "";
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID?.trim() || "common";

export const loginScopes = ["openid", "profile", "email"] as const;

export function isAzureLoginConfigured(): boolean {
  return Boolean(clientId);
}

export const loginRequest: RedirectRequest = {
  scopes: [...loginScopes],
};

let msalInstance: PublicClientApplication | null = null;

export function getMsalInstance(): PublicClientApplication {
  if (!clientId) {
    throw new Error("VITE_AZURE_CLIENT_ID não definido");
  }
  if (!msalInstance) {
    const redirectUri =
      import.meta.env.VITE_AZURE_REDIRECT_URI?.trim() || `${typeof window !== "undefined" ? window.location.origin : ""}/`;
    const config: Configuration = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri,
      },
      cache: {
        cacheLocation: "sessionStorage",
      },
    };
    msalInstance = new PublicClientApplication(config);
  }
  return msalInstance;
}
