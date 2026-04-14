import * as fs from 'fs';
import * as path from 'path';

/** Locks de instância única do Chromium no userDataDir (e às vezes em subpastas). */
const LOCK_NAMES = new Set([
  'SingletonLock',
  'SingletonCookie',
  'SingletonSocket',
  'DevToolsActivePort',
]);

/** Pastas grandes onde não procuramos (performance; locks não ficam aí). */
const SKIP_DIRS = new Set([
  'Cache',
  'Code Cache',
  'GPUCache',
  'GrShaderCache',
  'ShaderCache',
  'IndexedDB',
  'Service Worker',
  'VideoDecodeStats',
  'blob_storage',
  'Crashpad',
  'Download Service',
  'Sessions',
  'segmentation_platform',
  'component_crx_cache',
  'extensions_crx_cache',
  'BrowserMetrics',
  'CertificateRevocation',
]);

function tryRemove(p: string): boolean {
  try {
    if (!fs.existsSync(p)) return false;
    const st = fs.lstatSync(p);
    if (st.isDirectory()) {
      fs.rmSync(p, { recursive: true, force: true });
    } else {
      try {
        fs.chmodSync(p, 0o666);
      } catch {
        /* Windows / SMB pode ignorar */
      }
      fs.unlinkSync(p);
    }
    return true;
  } catch {
    return false;
  }
}

function isLockFileName(name: string): boolean {
  return LOCK_NAMES.has(name) || name.startsWith('Singleton');
}

/** Remove arquivos de lock em qualquer profundidade razoável (útil em perfis antigos / SMB). */
function removeLockFilesRecursive(dir: string, depth: number): number {
  if (depth > 10) return 0;
  let removed = 0;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      removed += removeLockFilesRecursive(full, depth + 1);
    } else if (isLockFileName(ent.name)) {
      // Inclui socket Unix (SingletonSocket), FIFO, etc. — em Azure Files isso costuma ficar órfão e o Chrome recusa o launch.
      if (tryRemove(full)) {
        removed += 1;
      }
    }
  }
  return removed;
}

/**
 * Remove locks de instância única do Chromium no userDataDir.
 * Em volume persistente (ex.: Azure Files), após reinício do pod o processo some mas os locks ficam e o launch falha com
 * "The browser is already running for ... Use a different userDataDir".
 */
export function clearStaleChromiumProfileLocks(userDataDir: string): number {
  if (!userDataDir || !fs.existsSync(userDataDir)) return 0;
  return removeLockFilesRecursive(userDataDir, 0);
}
