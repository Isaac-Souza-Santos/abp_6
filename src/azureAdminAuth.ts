import * as jose from "jose";

const tenantId = process.env.ADMIN_PANEL_AZURE_TENANT_ID?.trim();
const clientId = process.env.ADMIN_PANEL_AZURE_CLIENT_ID?.trim();

export function isAzureAdminPanelAuthConfigured(): boolean {
  return Boolean(tenantId && clientId);
}

let jwks: jose.JWTVerifyGetKey | null = null;

function getJwks(): jose.JWTVerifyGetKey {
  if (!tenantId) {
    throw new Error("ADMIN_PANEL_AZURE_TENANT_ID em falta");
  }
  if (!jwks) {
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
    await jose.jwtVerify(token, getJwks(), {
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      audience: clientId,
    });
    return true;
  } catch {
    return false;
  }
}
