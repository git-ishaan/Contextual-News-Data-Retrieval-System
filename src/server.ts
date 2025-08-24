import { buildServer } from './app';
import { env } from './config';
import { logger } from './core/logger';

async function gracefulShutdown(signal: string, app: Awaited<ReturnType<typeof buildServer>>) {
  logger.info(`Received signal: ${signal}. Shutting down gracefully...`);
  await app.close();
  process.exit(0);
}

async function main() {
  const app = await buildServer();

  const signals = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, () => gracefulShutdown(signal, app));
  }
  
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
