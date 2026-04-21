#!/usr/bin/env node
/**
 * Cria as issues da Sprint 2 do painel interno sem duplicar títulos já existentes.
 * Lê scripts/sprint2-painel-tasks.json.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

function loadEnvFromFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].replace(/^["']|["']$/g, '').trim();
    if ((key === 'GITHUB_TOKEN' || key === 'GH_TOKEN' || key === 'GITHUB_REPO') && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

function loadAuthEnv() {
  if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) return;
  const root = join(__dirname, '..');
  loadEnvFromFile(join(root, '.env'));
  loadEnvFromFile(join(root, 'security', '.env'));
}

function getRepoFromGit() {
  try {
    const out = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const m = out.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

loadAuthEnv();

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const repo = (process.env.GITHUB_REPO || getRepoFromGit() || '').replace(/\.git$/i, '');
const [owner, repoName] = repo.split('/');

if (!token) {
  console.error('Defina GITHUB_TOKEN ou GH_TOKEN no ambiente, .env ou security/.env');
  process.exit(1);
}
if (!owner || !repoName) {
  console.error('Não foi possível determinar o repositório (owner/repo).');
  process.exit(1);
}

const api = `https://api.github.com/repos/${owner}/${repoName}`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
};

async function request(method, path, body) {
  const url = path.startsWith('http') ? path : `${api}${path}`;
  const opt = { method, headers };
  if (body) opt.body = JSON.stringify(body);
  const res = await fetch(url, opt);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.headers.get('content-length') === '0' ? null : res.json();
}

function priorityToLabel(priority) {
  if (priority === 'Alta') return 'prioridade-alta';
  if (priority === 'Média') return 'prioridade-media';
  return 'prioridade-baixa';
}

async function ensureLabel(name, color, description) {
  if (DRY_RUN) return;
  try {
    await request('GET', `/labels/${encodeURIComponent(name)}`);
  } catch {
    await request('POST', '/labels', { name, color, description });
  }
}

async function ensureMilestone(title, description) {
  const list = await request('GET', '/milestones?state=all&per_page=100');
  const found = (list || []).find((m) => m.title === title);
  if (found) return found.number;
  if (DRY_RUN) return 0;
  const created = await request('POST', '/milestones', { title, description, state: 'open' });
  return created.number;
}

async function listIssueTitles() {
  const titles = new Set();
  let page = 1;
  for (;;) {
    const batch = await request('GET', `/issues?state=all&per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const issue of batch) {
      if (!issue.pull_request && issue.title) titles.add(issue.title);
    }
    if (batch.length < 100) break;
    page += 1;
  }
  return titles;
}

async function createIssue(task, milestoneNumber) {
  const title = `[Sprint 2 - Painel] ${task.id} – ${task.title}`;
  const body = [
    '## Descrição',
    task.title,
    '',
    '## Critério de aceite',
    `- [ ] ${task.acceptanceCriteria}`,
    '',
    '## Sprint',
    'Sprint 2 (Painel interno)',
    '',
    '## Prioridade',
    task.priority,
  ].join('\n');
  if (DRY_RUN) {
    return { number: 0, node_id: 'dry-run', title, html_url: '' };
  }
  return request('POST', '/issues', {
    title,
    body,
    milestone: milestoneNumber || undefined,
    labels: ['Sprint 2', 'painel-interno', priorityToLabel(task.priority)],
  });
}

async function main() {
  const data = JSON.parse(readFileSync(join(__dirname, 'sprint2-painel-tasks.json'), 'utf-8'));
  console.log(`Repo: ${owner}/${repoName}`);
  if (DRY_RUN) console.log('DRY RUN ativado.');

  await ensureLabel('Sprint 2', '0e8a16', 'Sprint 2');
  await ensureLabel('painel-interno', '1d76db', 'Tarefas do painel interno');
  await ensureLabel('prioridade-alta', 'b60205', 'Prioridade alta');
  await ensureLabel('prioridade-media', 'fbca04', 'Prioridade média');
  await ensureLabel('prioridade-baixa', 'c2e0c6', 'Prioridade baixa');

  const milestoneNumber = await ensureMilestone(data.milestone.title, data.milestone.description || '');
  const existingTitles = await listIssueTitles();
  const createdIssues = [];
  const skipped = [];

  for (const task of data.tasks) {
    const title = `[Sprint 2 - Painel] ${task.id} – ${task.title}`;
    if (existingTitles.has(title)) {
      skipped.push(title);
      console.log(`Já existe: ${title}`);
      continue;
    }
    const issue = await createIssue(task, milestoneNumber);
    createdIssues.push({
      number: issue.number,
      node_id: issue.node_id,
      title: issue.title,
      html_url: issue.html_url,
    });
    console.log(`Criada: #${issue.number} ${issue.title}`);
  }

  if (!DRY_RUN) {
    const outPath = join(__dirname, '.github-created-issues.json');
    let previous = [];
    if (existsSync(outPath)) {
      try {
        const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
        if (Array.isArray(parsed.createdIssues)) previous = parsed.createdIssues;
      } catch {}
    }
    const mergedByTitle = new Map();
    for (const item of [...previous, ...createdIssues]) mergedByTitle.set(item.title, item);
    writeFileSync(
      outPath,
      JSON.stringify({ repo: `${owner}/${repoName}`, createdIssues: [...mergedByTitle.values()] }, null, 2),
      'utf-8'
    );
  }

  console.log(`\nCriadas: ${createdIssues.length} | Já existentes: ${skipped.length}`);
  if (skipped.length > 0) {
    console.log('Ignoradas por já existirem:');
    for (const t of skipped) console.log(`- ${t}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
