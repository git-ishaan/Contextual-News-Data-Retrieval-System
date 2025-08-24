import { PrismaClient } from '@prisma/client';
import { logger } from '../../logger';

// Initialize Prisma client with custom logging configuration
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

// Log all queries in non-production environments for debugging
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma query');
  }
});

// Log Prisma client initialization
logger.info('Prisma client initialized.');

// Export Prisma client instance for use in the app
export { prisma };