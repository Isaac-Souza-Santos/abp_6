import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'groq-metricas.json');

interface MetricasGroq {
  satisfatoria: number;
  naoSatisfatoria: number;
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load(): MetricasGroq {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) return { satisfatoria: 0, naoSatisfatoria: 0 };
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw) as MetricasGroq;
  } catch {
    return { satisfatoria: 0, naoSatisfatoria: 0 };
  }
}

function save(m: MetricasGroq): void {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(m, null, 2), 'utf-8');
}

/**
 * Armazena contagem de avaliações pós-resposta Groq: satisfatória vs não satisfatória.
 * Persiste em data/groq-metricas.json.
 */
export class GroqMetricasStore {
  incrementSatisfatoria(): void {
    const m = load();
    m.satisfatoria += 1;
    save(m);
  }

  incrementNaoSatisfatoria(): void {
    const m = load();
    m.naoSatisfatoria += 1;
    save(m);
  }

  getMetricas(): MetricasGroq {
    return load();
  }
}
