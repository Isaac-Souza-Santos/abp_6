import * as fs from 'fs';
import * as path from 'path';

const LOCK_NAMES = [
  'SingletonLock',
  'SingletonCookie',
  'SingletonSocket',
  'DevToolsActivePort',
];

function tryRemove(p: string): boolean {
  try {
    if (!fs.existsSync(p)) return false;
    const st = fs.lstatSync(p);
    if (st.isDirectory()) {
      fs.rmSync(p, { recursive: true, force: true });
    } else {
      fs.unlinkSync(p);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove locks de instância única do Chromium no userDataDir.
 * Em volume persistente (ex.: Azure Files), após reinício do pod o processo some mas os locks ficam e o launch falha com
 * "The browser is already running for ... Use a different userDataDir".
 */
export function clearStaleChromiumProfileLocks(userDataDir: string): number {
  if (!userDataDir || !fs.existsSync(userDataDir)) return 0;
  let removed = 0;
  for (const name of LOCK_NAMES) {
    if (tryRemove(path.join(userDataDir, name))) removed += 1;
  }
  const def = path.join(userDataDir, 'Default');
  if (fs.existsSync(def)) {
    for (const name of LOCK_NAMES) {
      if (tryRemove(path.join(def, name))) removed += 1;
    }
  }
  return removed;
}
