import { config } from "dotenv";
import http from "http";
import { getEnvPath } from "./config/paths";

config({ path: getEnvPath() });

import { ProconBot } from "./bot/ProconBot";
import { AgendamentoStore } from "./services/AgendamentoStore";
import { isAzureAdminPanelAuthConfigured, verifyAdminPanelAzureToken } from "./azureAdminAuth";
import type { ParticipanteAgenda } from "./types/agendamento";
import { agendaAtendentesConfigStore, parseAgendaAtendentesConfig } from "./services/AgendaAtendentesConfigStore";
import {
  agendaLembreteConfirmacaoStore,
  parseAgendaLembreteConfirmacaoConfig,
} from "./services/AgendaLembreteConfirmacaoStore";
import { iniciarAgendadorLembreteConfirmacao } from "./services/lembreteConfirmacaoLoop";
import { GroqMetricasStore } from "./services/GroqMetricasStore";

const healthPort = Number(process.env.HEALTH_PORT || 3000);
const adminPanelOrigin = process.env.ADMIN_PANEL_ORIGIN || "*";
const adminPanelToken = process.env.ADMIN_PANEL_TOKEN?.trim();

const agendamentoStore = new AgendamentoStore();
const groqMetricasStore = new GroqMetricasStore();

function setJsonHeaders(res: http.ServerResponse): void {
  res.setHeader("Content-Type", "application/json");
}

function setAdminCorsHeaders(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", adminPanelOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,Authorization");
}

const MAX_ADMIN_JSON_BYTES = 65536;
const STATUS_VALUES = ["solicitado", "confirmado", "cancelado", "atendido"] as const;
type StatusAgendamento = (typeof STATUS_VALUES)[number];

function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buf.length;
      if (size > MAX_ADMIN_JSON_BYTES) {
        reject(new Error("Payload too large"));
        return;
      }
      chunks.push(buf);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        if (!raw) {
          resolve({});
          return;
        }
        const parsed = JSON.parse(raw) as unknown;
        resolve(typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

const MAX_PARTICIPANTES = 30;

function parseParticipantesAgenda(arr: unknown[]): ParticipanteAgenda[] {
  const out: ParticipanteAgenda[] = [];
  for (const el of arr) {
    if (out.length >= MAX_PARTICIPANTES) break;
    if (!el || typeof el !== "object") continue;
    const o = el as Record<string, unknown>;
    const nome = typeof o.nome === "string" ? o.nome.trim().slice(0, 200) : "";
    if (!nome) continue;
    const telRaw = typeof o.telefone === "string" ? o.telefone.trim().slice(0, 40) : "";
    out.push(telRaw ? { nome, telefone: telRaw } : { nome });
  }
  return out;
}

function parseAgendamentoPatch(body: Record<string, unknown>): Partial<{
  status: StatusAgendamento;
  observacaoAtendente: string;
  virouProcesso: boolean;
  gestaoPublica: boolean;
  participantes: ParticipanteAgenda[];
  atendidoPorNome: string;
}> {
  const patch: Partial<{
    status: StatusAgendamento;
    observacaoAtendente: string;
    virouProcesso: boolean;
    gestaoPublica: boolean;
    participantes: ParticipanteAgenda[];
    atendidoPorNome: string;
  }> = {};

  if (typeof body.status === "string" && (STATUS_VALUES as readonly string[]).includes(body.status)) {
    patch.status = body.status as StatusAgendamento;
  }
  if (typeof body.observacaoAtendente === "string") {
    patch.observacaoAtendente = body.observacaoAtendente.slice(0, 4000);
  }
  if (typeof body.virouProcesso === "boolean") {
    patch.virouProcesso = body.virouProcesso;
  }
  if (typeof body.gestaoPublica === "boolean") {
    patch.gestaoPublica = body.gestaoPublica;
  }
  if (Object.prototype.hasOwnProperty.call(body, "participantes") && Array.isArray(body.participantes)) {
    patch.participantes = parseParticipantesAgenda(body.participantes);
  }
  if (Object.prototype.hasOwnProperty.call(body, "atendidoPorNome")) {
    if (body.atendidoPorNome === null) {
      patch.atendidoPorNome = "";
    } else if (typeof body.atendidoPorNome === "string") {
      patch.atendidoPorNome = body.atendidoPorNome.trim().slice(0, 200);
    }
  }
  return patch;
}

function extractBearerToken(req: http.IncomingMessage): string | null {
  const raw = req.headers.authorization;
  if (!raw || typeof raw !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match ? match[1].trim() : null;
}

async function isAdminRequestAuthorized(req: http.IncomingMessage, url: URL): Promise<boolean> {
  const hasStatic = Boolean(adminPanelToken);
  const hasAzure = isAzureAdminPanelAuthConfigured();
  const staticMatch =
    hasStatic &&
    (url.searchParams.get("token") === adminPanelToken ||
      (req.headers["x-admin-token"] || "").toString() === adminPanelToken);

  const bearer = extractBearerToken(req);
  const azureMatch = hasAzure && bearer ? await verifyAdminPanelAzureToken(bearer) : false;

  if (hasStatic && staticMatch) return true;
  if (hasAzure && azureMatch) return true;
  if (!hasStatic && !hasAzure) return true;
  return false;
}

function startHealthServer(bot: ProconBot): void {
  const server = http.createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      if (url.pathname.startsWith("/admin/")) {
        setAdminCorsHeaders(res);
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        if (!(await isAdminRequestAuthorized(req, url))) {
          setJsonHeaders(res);
          res.writeHead(401);
          res.end(JSON.stringify({ error: "Unauthorized" }));
          return;
        }
      }

      if (url.pathname === "/livez") {
        setJsonHeaders(res);
        res.writeHead(200);
        res.end(JSON.stringify({ status: "alive" }));
        return;
      }

      if (url.pathname === "/readyz") {
        const ready = bot.isReady();
        setJsonHeaders(res);
        res.writeHead(ready ? 200 : 503);
        res.end(JSON.stringify({ status: ready ? "ready" : "starting" }));
        return;
      }

      if (url.pathname === "/healthz") {
        setJsonHeaders(res);
        res.writeHead(200);
        res.end(JSON.stringify({ alive: true, ready: bot.isReady() }));
        return;
      }

      if (url.pathname === "/admin/agendamentos" && req.method === "GET") {
        setJsonHeaders(res);
        const agendamentos = agendamentoStore.listarTodos();
        const metricas = agendamentoStore.getMetricas();
        const groqMetricas = groqMetricasStore.getMetricas();
        res.writeHead(200);
        res.end(
          JSON.stringify({
            total: agendamentos.length,
            agendamentos,
            metricas,
            groqMetricas,
          })
        );
        return;
      }

      if (url.pathname === "/admin/agenda-atendentes" && req.method === "GET") {
        setJsonHeaders(res);
        res.writeHead(200);
        res.end(JSON.stringify(agendaAtendentesConfigStore.getConfig()));
        return;
      }

      if (url.pathname === "/admin/agenda-atendentes" && req.method === "PUT") {
        setJsonHeaders(res);
        let body: Record<string, unknown>;
        try {
          body = await readJsonBody(req);
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Corpo inválido ou demasiado grande." }));
          return;
        }
        const parsed = parseAgendaAtendentesConfig(body);
        if (!parsed) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error:
                "Configuração inválida. Envie { atendentes: [{ id?, nome, intervaloMinutos?, blocos?, almoco?: { inicioH, inicioM, fimH, fimM } }] }.",
            })
          );
          return;
        }
        agendaAtendentesConfigStore.saveConfig(parsed);
        res.writeHead(200);
        res.end(JSON.stringify(parsed));
        return;
      }

      if (url.pathname === "/admin/agenda-lembrete-confirmacao" && req.method === "GET") {
        setJsonHeaders(res);
        res.writeHead(200);
        res.end(JSON.stringify(agendaLembreteConfirmacaoStore.getConfig()));
        return;
      }

      if (url.pathname === "/admin/agenda-lembrete-confirmacao" && req.method === "PUT") {
        setJsonHeaders(res);
        let body: Record<string, unknown>;
        try {
          body = await readJsonBody(req);
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Corpo inválido ou demasiado grande." }));
          return;
        }
        const parsed = parseAgendaLembreteConfirmacaoConfig(body);
        if (!parsed) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error:
                "Configuração inválida. Envie { ativo: boolean, antecedenciaDias: 1..14, mensagemTemplate: string (mín. 20 caracteres) } com placeholders {nome}, {dataHora}, {motivo}, {protocolo}, {guiche}, {endereco}.",
            })
          );
          return;
        }
        agendaLembreteConfirmacaoStore.saveConfig(parsed);
        res.writeHead(200);
        res.end(JSON.stringify(parsed));
        return;
      }

      const patchMatch = /^\/admin\/agendamentos\/([^/]+)$/.exec(url.pathname);
      if (patchMatch && req.method === "PATCH") {
        setJsonHeaders(res);
        const id = decodeURIComponent(patchMatch[1]);
        let body: Record<string, unknown>;
        try {
          body = await readJsonBody(req);
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Corpo inválido ou demasiado grande." }));
          return;
        }
        if (Object.prototype.hasOwnProperty.call(body, "participantes") && !Array.isArray(body.participantes)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "participantes deve ser um array de objetos { nome, telefone? }." }));
          return;
        }
        if (
          Object.prototype.hasOwnProperty.call(body, "atendidoPorNome") &&
          body.atendidoPorNome !== null &&
          typeof body.atendidoPorNome !== "string"
        ) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "atendidoPorNome deve ser texto ou null (para limpar)." }));
          return;
        }
        const patch = parseAgendamentoPatch(body);
        if (Object.keys(patch).length === 0) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error:
                "Nenhum campo válido para atualizar (status, observacaoAtendente, virouProcesso, gestaoPublica, participantes, atendidoPorNome).",
            })
          );
          return;
        }
        const ok = agendamentoStore.update(id, patch);
        if (!ok) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "Agendamento não encontrado." }));
          return;
        }
        const agendamento = agendamentoStore.getById(id);
        res.writeHead(200);
        res.end(JSON.stringify({ agendamento }));
        return;
      }

      setJsonHeaders(res);
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    })().catch((err) => {
      console.error("Erro no servidor HTTP:", err);
      setJsonHeaders(res);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Internal server error" }));
    });
  });

  server.listen(healthPort, () => {
    console.log(`Health server ativo na porta ${healthPort}`);
  });
}

async function main(): Promise<void> {
  const bot = new ProconBot();
  startHealthServer(bot);
  await bot.start();
  iniciarAgendadorLembreteConfirmacao(bot, agendamentoStore);
}

main().catch((err) => {
  console.error("Erro ao iniciar bot:", err);
  process.exit(1);
});
