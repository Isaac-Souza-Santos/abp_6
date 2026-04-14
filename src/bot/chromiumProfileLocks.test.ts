import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { clearStaleChromiumProfileLocks } from './chromiumProfileLocks';

describe('clearStaleChromiumProfileLocks', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-locks-'));
    fs.mkdirSync(path.join(dir, 'Default'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('remove SingletonLock e DevToolsActivePort na raiz do perfil', () => {
    fs.writeFileSync(path.join(dir, 'SingletonLock'), 'x');
    fs.writeFileSync(path.join(dir, 'DevToolsActivePort'), 'port');
    const n = clearStaleChromiumProfileLocks(dir);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(fs.existsSync(path.join(dir, 'SingletonLock'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'DevToolsActivePort'))).toBe(false);
  });

  it('remove locks em Default/', () => {
    fs.writeFileSync(path.join(dir, 'Default', 'SingletonLock'), 'x');
    expect(clearStaleChromiumProfileLocks(dir)).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(path.join(dir, 'Default', 'SingletonLock'))).toBe(false);
  });

  it('retorna 0 se diretório não existe', () => {
    expect(clearStaleChromiumProfileLocks(path.join(dir, 'missing'))).toBe(0);
  });

  it('remove SingletonLock em subpasta (não listada em SKIP_DIRS)', () => {
    const sub = path.join(dir, 'SomeSub');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'SingletonLock'), 'x');
    expect(clearStaleChromiumProfileLocks(dir)).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(path.join(sub, 'SingletonLock'))).toBe(false);
  });
});
