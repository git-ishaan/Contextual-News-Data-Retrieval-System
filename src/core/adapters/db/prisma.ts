import { PrismaClient } from '@prisma/client';
import { logger } from '../../logger';

// Initialize Prisma client with custom logging
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },   // Emit query events
    { emit: 'stdout', level: 'info' },   // Log info to stdout
    { emit: 'stdout', level: 'warn' },   // Log warnings to stdout
    { emit: 'stdout', level: 'error' },  // Log errors to stdout
  ],
});

// Log all queries for debugging
prisma.$on('query', (e) => {
  logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma query');
});

// Log Prisma client initialization
logger.info('Prisma client initialized.');

// Export Prisma client instance
export { prisma };
