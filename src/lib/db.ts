import { PrismaClient } from '@prisma/client';

// Simple, build-safe database client
// No connection pools, no health checks, no automatic initialization

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only create client when actually needed (lazy initialization)
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Lazy getter - only initializes on first actual use
export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// For backwards compatibility - but using Proxy for truly lazy access
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    // Skip during build time
    if (process.env.SKIP_DB_DURING_BUILD === 'true') {
      // Return a no-op for any property access during build
      if (typeof prop === 'string') {
        return new Proxy(() => Promise.resolve(null), {
          get: () => () => Promise.resolve(null),
          apply: () => Promise.resolve(null),
        });
      }
      return undefined;
    }
    return getDb()[prop as keyof PrismaClient];
  },
});

// Backwards compatible alias
export const prisma = db;

// Export for direct use
export { PrismaClient };
