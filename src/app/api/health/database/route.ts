import { NextResponse, NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring } from '@/lib/monitoring';
import { getDatabaseHealth } from '@/lib/database';
import { logger } from '@/lib/logger';

// Database health check endpoint
export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.health.limiter, rateLimitConfig.health.limit)(
      async (request: NextRequest) => {
        logger.debug('Database health check requested');

        const health = await getDatabaseHealth();

        // Set appropriate HTTP status based on health
        const status = health.status === 'healthy' ? 200 : 503;

        logger.info('Database health check completed', {
          status: health.status,
          activeConnections: health.connections?.activeConnections || 0,
          cacheStatus: health.cache?.status || 'unknown',
          averageResponseTime: health.performance?.averageResponseTime || 0,
          cacheHitRate: health.performance?.cacheHitRate || 0
        });

        return NextResponse.json(health, { status });
      }
    )
  )
);