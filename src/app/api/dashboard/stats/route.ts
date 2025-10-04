import { NextResponse, NextRequest } from 'next/server';

import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring } from '@/lib/monitoring';
import { CacheManager } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { queryOptimizer } from '@/lib/database/query-optimizer';
import { executeWithRetry } from '@/lib/database/connection-pool';

export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest) => {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          throw new AuthenticationError();
        }

        const userId = session.user.id;

        logger.debug('Dashboard stats request', { userId }, 'API');

        // Check cache first
        const cacheKey = CacheManager.keys.user.dashboard(userId);
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          logger.debug('Dashboard stats cache hit', { userId }, 'CACHE');
          return NextResponse.json(cached);
        }

        try {
          // Use optimized dashboard stats query
          const stats = await executeWithRetry(() =>
            queryOptimizer.getUserDashboardStats(userId, {
              useCache: false, // Already handled at route level
              includeMetrics: process.env.NODE_ENV !== 'production'
            })
          );

          // Cache the result for 5 minutes
          await CacheManager.set(cacheKey, stats, CacheManager.TTL.MEDIUM);

          logger.info('Dashboard stats retrieved successfully', {
            userId,
            totalGear: stats.gear?.total || 0,
            totalRentalsAsOwner: stats.rentals?.totalAsOwner || 0,
            totalEarnings: stats.earnings?.total || 0,
            averageRating: stats.reviews?.averageRating || 0
          }, 'API');

          return NextResponse.json(stats);

        } catch (error) {
          console.error('Dashboard stats error:', error);
          throw new Error('Failed to fetch dashboard statistics');
        }
      }
    )
  )
);