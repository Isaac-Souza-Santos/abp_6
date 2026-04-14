import { config } from 'dotenv';
import http from 'http';
import { getEnvPath } from './config/paths';

config({ path: getEnvPath() });

import { ProconBot } from './bot/ProconBot';

const healthPort = Number(process.env.HEALTH_PORT || 3000);

function startHealthServer(bot: ProconBot): void {
  const server = http.createServer((req, res) => {
    if (req.url === '/livez') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'alive' }));
      return;
    }

    if (req.url === '/readyz') {
      const ready = bot.isReady();
      res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: ready ? 'ready' : 'starting' }));
      return;
    }

    if (req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ alive: true, ready: bot.isReady() }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
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
  console.error('Erro ao iniciar bot:', err);
  process.exit(1);
});
