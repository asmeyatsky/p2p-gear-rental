import { PrismaClient } from '@prisma/client';
// import { validateEnvVar } from './api-error-handler'; // Commented out

declare global {
  // allow global `var` declarations
  var prisma: PrismaClient | undefined;
}

// Validate database URL
// const databaseUrl = validateEnvVar('DATABASE_URL', process.env.DATABASE_URL); // Commented out
const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:0/placeholder'; // Inert build-time placeholder; never connects

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: 'pretty',
  
  // Connection pool settings for better performance
  // Note: These are set via DATABASE_URL query params in production
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handling
const cleanup = async () => {
  console.log('Shutting down Prisma client...');
  await prisma.$disconnect();
};

// Handle different shutdown signals (skip during build to prevent interference)
if (process.env.SKIP_DB_DURING_BUILD !== 'true') {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}

// Helper function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Helper function for database health check
export async function getDatabaseStats() {
  try {
    const [userCount, gearCount, rentalCount] = await Promise.all([
      prisma.user.count(),
      prisma.gear.count(),
      prisma.rental.count(),
    ]);

    return {
      connected: true,
      users: userCount,
      gear: gearCount,
      rentals: rentalCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}