import path from 'path';
import fs from 'fs';

const CWD = process.cwd();
const SECURITY_DIR = path.join(CWD, 'security');

/** Se a pasta security/ existir na raiz do projeto, usamos ela para .env, sessão e data. */
function hasSecurityFolder(): boolean {
  try {
    return fs.existsSync(SECURITY_DIR) && fs.statSync(SECURITY_DIR).isDirectory();
  } catch {
    return false;
  }
}

const useSecurity = hasSecurityFolder();

/** Caminho do arquivo .env (security/.env ou .env na raiz). */
export function getEnvPath(): string {
  return useSecurity ? path.join(SECURITY_DIR, '.env') : path.join(CWD, '.env');
}

/** Caminho da pasta de sessão WhatsApp (security/.wwebjs_auth ou .wwebjs_auth na raiz). */
export function getAuthPath(): string {
  return useSecurity ? path.join(SECURITY_DIR, '.wwebjs_auth') : path.join(CWD, '.wwebjs_auth');
}

/** Caminho da pasta data/ (security/data ou data na raiz). */
export function getDataDir(): string {
  return useSecurity ? path.join(SECURITY_DIR, 'data') : path.join(CWD, 'data');
}

/** Indica se o projeto está usando a pasta security/ para ambiente. */
export function isUsingSecurityFolder(): boolean {
  return useSecurity;
}
