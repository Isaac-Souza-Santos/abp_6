import path from 'path';
import fs from 'fs';

const CWD = process.cwd();
const SECURITY_DIR = path.join(CWD, 'security');

function hasSecurityFolder(): boolean {
  try {
    return fs.existsSync(SECURITY_DIR) && fs.statSync(SECURITY_DIR).isDirectory();
  } catch {
    return false;
  }
}

const useSecurity = hasSecurityFolder();

export function getEnvPath(): string {
  return useSecurity ? path.join(SECURITY_DIR, '.env') : path.join(CWD, '.env');
}

/** Pasta de sessão WhatsApp: usa security/.wwebjs_auth se existir; senão .wwebjs_auth na raiz. */
export function getAuthPath(): string {
  const inSecurity = path.join(SECURITY_DIR, '.wwebjs_auth');
  const atRoot = path.join(CWD, '.wwebjs_auth');
  if (useSecurity && fs.existsSync(inSecurity)) return inSecurity;
  return atRoot;
}

/** Dados de runtime (agendamentos, métricas): sempre na raiz `data/`, fora de `security/`. */
export function getDataDir(): string {
  return path.join(CWD, 'data');
}

export function isUsingSecurityFolder(): boolean {
  return useSecurity;
}
