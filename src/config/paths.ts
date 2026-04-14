import path from 'path';
import fs from 'fs';

const CWD = process.cwd();
const SECURITY_DIR = path.join(CWD, 'security');
const AUTH_PATH_ENV = process.env.AUTH_PATH?.trim();
const DATA_DIR_ENV = process.env.DATA_DIR?.trim();

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
  if (AUTH_PATH_ENV) return path.resolve(CWD, AUTH_PATH_ENV);
  const inSecurity = path.join(SECURITY_DIR, '.wwebjs_auth');
  const atRoot = path.join(CWD, '.wwebjs_auth');
  if (useSecurity && fs.existsSync(inSecurity)) return inSecurity;
  return atRoot;
}

/** Dados de runtime (agendamentos, métricas): sempre na raiz `data/`, fora de `security/`. */
export function getDataDir(): string {
  if (DATA_DIR_ENV) return path.resolve(CWD, DATA_DIR_ENV);
  return path.join(CWD, 'data');
}

export function isUsingSecurityFolder(): boolean {
  return useSecurity;
}
