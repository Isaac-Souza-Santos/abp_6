import { ProconBot } from './bot/ProconBot';

async function main(): Promise<void> {
  const bot = new ProconBot();
  await bot.start();
}

main().catch((err) => {
  console.error('Erro ao iniciar bot:', err);
  process.exit(1);
});
