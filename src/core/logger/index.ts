import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

// We now export the configuration object for Fastify
export const pinoConfig = isProduction
  ? // In production, we configure a file stream
    { level: 'info' }
  : // In development, we use pino-pretty for nice console output
    {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    };

// We also export the logger instance for use in scripts, etc.
export const logger = pino(pinoConfig);