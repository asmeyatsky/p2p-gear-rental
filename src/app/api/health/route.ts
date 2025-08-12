import { NextRequest, NextResponse } from 'next/server';
import { testDatabaseConnection, getDatabaseStats } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'unknown',
    checks: {
      database: { status: 'unknown' as string, details: {} },
      env_vars: { status: 'unknown' as string, missing: [] as string[] },
    },
  };

  // Test database connection
  try {
    const dbConnected = await testDatabaseConnection();
    const dbStats = await getDatabaseStats();
    
    healthCheck.checks.database = {
      status: dbConnected ? 'healthy' : 'unhealthy',
      details: dbStats,
    };
  } catch (error) {
    healthCheck.checks.database = {
      status: 'error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }

  // Check critical environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY',
  ];

  const missing: string[] = [];
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  healthCheck.checks.env_vars = {
    status: missing.length === 0 ? 'healthy' : 'unhealthy',
    missing,
  };

  // Determine overall status
  const allHealthy = Object.values(healthCheck.checks).every(
    check => check.status === 'healthy'
  );
  
  healthCheck.status = allHealthy ? 'healthy' : 'unhealthy';
  
  const statusCode = allHealthy ? 200 : 503;
  
  return NextResponse.json(healthCheck, { status: statusCode });
});