// Simplified database integration layer
// Uses the build-safe db module instead of complex connection pooling

import { db, getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

// Re-export the simple database client
export { db as prisma, db as optimizedPrisma, getDb };

// Simple retry wrapper for database operations
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        logger.warn(`Database operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error(`Database operation failed after ${maxRetries} attempts`);
  throw lastError;
}

// Connection stats (simplified)
export function getConnectionStats() {
  return {
    activeConnections: 1,
    maxConnections: 10,
    availableConnections: 9,
    connectionNames: ['default'],
  };
}

// Database health check
export async function getDatabaseHealth() {
  if (process.env.SKIP_DB_DURING_BUILD === 'true') {
    return {
      status: 'skipped',
      message: 'Database checks skipped during build',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const start = Date.now();
    await getDb().$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

// Placeholder for connection pool (for backwards compatibility)
export const connectionPool = {
  healthCheck: getDatabaseHealth,
  getConnectionStats,
  getClient: () => getDb(),
};
