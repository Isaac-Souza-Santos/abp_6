import { config } from "dotenv";
import http from "http";
import { getEnvPath } from "./config/paths";

config({ path: getEnvPath() });

import { ProconBot } from "./bot/ProconBot";
import { AgendamentoStore } from "./services/AgendamentoStore";
import { isAzureAdminPanelAuthConfigured, verifyAdminPanelAzureToken } from "./azureAdminAuth";

const healthPort = Number(process.env.HEALTH_PORT || 3000);
const adminPanelOrigin = process.env.ADMIN_PANEL_ORIGIN || "*";
const adminPanelToken = process.env.ADMIN_PANEL_TOKEN?.trim();

const agendamentoStore = new AgendamentoStore();

function setJsonHeaders(res: http.ServerResponse): void {
  res.setHeader("Content-Type", "application/json");
}

function setAdminCorsHeaders(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", adminPanelOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token,Authorization");
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
        res.writeHead(200);
        res.end(
          JSON.stringify({
            total: agendamentos.length,
            agendamentos,
            metricas,
          })
        );
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
}

main().catch((err) => {
  console.error("Erro ao iniciar bot:", err);
  process.exit(1);
});
