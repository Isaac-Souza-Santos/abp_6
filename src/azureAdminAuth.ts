import type { JWTVerifyGetKey } from "jose";

const tenantId = process.env.ADMIN_PANEL_AZURE_TENANT_ID?.trim();
const clientId = process.env.ADMIN_PANEL_AZURE_CLIENT_ID?.trim();

export function isAzureAdminPanelAuthConfigured(): boolean {
  return Boolean(tenantId && clientId);
}

type JoseModule = typeof import("jose");

let joseModulePromise: Promise<JoseModule> | null = null;
let jwks: JWTVerifyGetKey | null = null;

function getJoseModule(): Promise<JoseModule> {
  if (!joseModulePromise) {
    joseModulePromise = import("jose");
  }
  return joseModulePromise;
}

async function getJwks(): Promise<JWTVerifyGetKey> {
  if (!tenantId) {
    throw new Error("ADMIN_PANEL_AZURE_TENANT_ID em falta");
  }
  if (!jwks) {
    const jose = await getJoseModule();
    jwks = jose.createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
    );
  }
  return jwks;
}

/**
 * Valida ID token (ou access token com aud = client id) emitido pelo Entra ID,
 * alinhado à app registration do painel (SPA).
 */
export async function verifyAdminPanelAzureToken(token: string): Promise<boolean> {
  if (!tenantId || !clientId) return false;
  try {
    const jose = await getJoseModule();
    const jwks = await getJwks();
    await jose.jwtVerify(token, jwks, {
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      audience: clientId,
    });
    return true;
  } catch {
    return false;
  }
}
