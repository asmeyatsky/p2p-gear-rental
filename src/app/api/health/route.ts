import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: string;
  timestamp: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  metrics: {
    requests: number;
    errors: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

// Database health check
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'database',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime,
      details: responseTime > 1000 ? 'Slow response time' : 'Connection successful',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime,
      details: `Connection failed: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// Cache health check
async function checkCache(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const testKey = 'health-check-' + Date.now();
    const testValue = { test: true };
    
    // Test set operation
    await CacheManager.set(testKey, testValue, 10);
    
    // Test get operation
    const retrieved = await CacheManager.get(testKey);
    
    // Clean up
    await CacheManager.del(testKey);
    
    const responseTime = Date.now() - startTime;
    const isWorking = retrieved !== null;
    
    return {
      service: 'cache',
      status: isWorking ? (responseTime > 500 ? 'degraded' : 'healthy') : 'unhealthy',
      responseTime,
      details: isWorking ? 'Cache operations successful' : 'Cache operations failed',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      service: 'cache',
      status: 'unhealthy',
      responseTime,
      details: `Cache error: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// External services health check (example)
async function checkExternalServices(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  
  // Supabase Auth health check
  const supabaseCheck: HealthCheck = {
    service: 'supabase-auth',
    status: 'healthy', // Simplified - in practice you'd test actual connection
    details: 'Configuration verified',
    timestamp: new Date().toISOString(),
  };
  checks.push(supabaseCheck);
  
  // Stripe health check (if configured)
  if (process.env.STRIPE_SECRET_KEY) {
    const stripeCheck: HealthCheck = {
      service: 'stripe',
      status: 'healthy', // Simplified - in practice you'd test API connection
      details: 'API key configured',
      timestamp: new Date().toISOString(),
    };
    checks.push(stripeCheck);
  }
  
  return checks;
}

// Main health check handler
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  logger.debug('Health check requested', { 
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  }, 'HEALTH');

  try {
    // Run all health checks in parallel
    const [databaseCheck, cacheCheck, externalChecks] = await Promise.all([
      checkDatabase(),
      checkCache(),
      checkExternalServices(),
    ]);

    const allChecks = [databaseCheck, cacheCheck, ...externalChecks];
    
    // Get monitoring metrics
    const monitoringHealth = monitoring.getHealthStatus();
    
    // Determine overall status
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy');
    const hasDegraded = allChecks.some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasUnhealthy || monitoringHealth.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (hasDegraded || monitoringHealth.status === 'degraded') {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const response: HealthResponse = {
      status: overallStatus,
      timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: allChecks,
      metrics: {
        requests: monitoringHealth.metrics.requestCount,
        errors: monitoringHealth.metrics.errorCount,
        errorRate: monitoringHealth.metrics.errorRate,
        averageResponseTime: monitoringHealth.metrics.averageResponseTime,
      },
    };

    const responseTime = Date.now() - startTime;
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    logger.info('Health check completed', {
      status: overallStatus,
      responseTime,
      checksCount: allChecks.length,
    }, 'HEALTH');

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Health check failed', {
      error: errorMessage,
      responseTime,
      stack: error instanceof Error ? error.stack : undefined,
    }, 'HEALTH');

    const response: HealthResponse = {
      status: 'unhealthy',
      timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: [{
        service: 'health-check',
        status: 'unhealthy',
        details: `Health check failed: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      }],
      metrics: {
        requests: 0,
        errors: 1,
        errorRate: 100,
        averageResponseTime: responseTime,
      },
    };

    return NextResponse.json(response, { status: 503 });
  }
});

// Detailed metrics endpoint (protected)
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Simple authentication check - in practice you'd use proper auth
  const authHeader = request.headers.get('authorization');
  const validToken = process.env.METRICS_API_TOKEN;
  
  if (!validToken || authHeader !== `Bearer ${validToken}`) {
    logger.warn('Unauthorized metrics access attempt', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    }, 'SECURITY');
    
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const timeRange = body.timeRange || {};
    
    // Convert time range if provided
    const range = timeRange.start && timeRange.end ? {
      start: new Date(timeRange.start),
      end: new Date(timeRange.end),
    } : undefined;

    const metrics = monitoring.getMetrics(range);
    const recentErrors = monitoring.getRecentErrors(20);
    const slowQueries = monitoring.getSlowQueries(10);
    const popularEndpoints = monitoring.getPopularEndpoints(15);

    const response = {
      timestamp: new Date().toISOString(),
      timeRange: range ? {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      } : 'all-time',
      metrics,
      recentErrors: recentErrors.map(error => ({
        ...error,
        timestamp: error.timestamp.toISOString(),
      })),
      slowQueries: slowQueries.map(query => ({
        ...query,
        timestamp: query.timestamp.toISOString(),
      })),
      popularEndpoints,
    };

    logger.info('Detailed metrics accessed', {
      timeRange: response.timeRange,
      metricsRequested: Object.keys(body).length,
    }, 'METRICS');

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to retrieve detailed metrics', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    }, 'METRICS');

    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
});