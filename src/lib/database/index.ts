// Central database integration layer with optimized operations
import { connectionPool, optimizedPrisma, executeWithRetry, getConnectionStats } from './connection-pool';
import { queryOptimizer } from './query-optimizer';
import { CacheManager } from '@/lib/cache';
import { logger } from '@/lib/logger';

// Export all database utilities
export { connectionPool, optimizedPrisma, executeWithRetry, getConnectionStats };
export { queryOptimizer };

// Database health monitoring
export async function getDatabaseHealth() {
  try {
    const [connectionHealth, cacheHealth] = await Promise.all([
      connectionPool.healthCheck(),
      CacheManager.healthCheck()
    ]);

    const connectionStats = getConnectionStats();
    const queryMetrics = queryOptimizer.getPerformanceMetrics();

    return {
      status: connectionHealth.healthy ? 'healthy' : 'unhealthy',
      connections: {
        ...connectionHealth.connections,
        latency: connectionHealth.latency
      },
      cache: {
        status: cacheHealth ? 'healthy' : 'unhealthy'
      },
      performance: {
        queryMetrics,
        slowQueriesLast10Min: Object.values(queryMetrics).reduce(
          (sum: number, metric: any) => sum + (metric.slowQueries || 0), 
          0
        ),
        averageResponseTime: Object.values(queryMetrics).reduce(
          (sum: number, metric: any) => sum + (metric.averageExecutionTime || 0), 
          0
        ) / Object.keys(queryMetrics).length || 0,
        cacheHitRate: Object.values(queryMetrics).reduce(
          (sum: number, metric: any) => sum + (metric.cacheHitRate || 0), 
          0
        ) / Object.keys(queryMetrics).length || 0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// Optimized database operations for common patterns
export class DatabaseOperations {
  // Get gear with availability check
  static async getGearWithAvailability(
    gearId: string, 
    startDate?: Date, 
    endDate?: Date
  ) {
    const gear = await executeWithRetry(() =>
      queryOptimizer.getGearDetail(gearId, { useCache: true })
    );

    if (!gear) return null;

    let isAvailable = true;
    if (startDate && endDate) {
      isAvailable = await executeWithRetry(() =>
        queryOptimizer.checkGearAvailability(gearId, startDate, endDate)
      );
    }

    return {
      ...gear,
      isAvailable,
      availabilityChecked: !!(startDate && endDate)
    };
  }

  // Bulk operations for better performance
  static async bulkUpdateGearStatus(gearIds: string[], updates: any) {
    return executeWithRetry(async () => {
      const results = await Promise.all(
        gearIds.map(id =>
          optimizedPrisma.gear.update({
            where: { id },
            data: updates
          })
        )
      );

      // Invalidate caches for updated gear
      await Promise.all([
        ...gearIds.map(id => CacheManager.del(CacheManager.keys.gear.detail(id))),
        CacheManager.invalidatePattern('gear:list:*')
      ]);

      return results;
    });
  }

  // Optimized search with caching
  static async searchGear(params: {
    query?: string;
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) {
    return executeWithRetry(() =>
      queryOptimizer.getGearListings(params, {
        useCache: true,
        cacheTTL: CacheManager.TTL.MEDIUM
      })
    );
  }

  // User analytics with caching
  static async getUserAnalytics(userId: string) {
    const cacheKey = `analytics:user:${userId}`;
    const cached = await CacheManager.get(cacheKey);
    if (cached) return cached;

    const analytics = await executeWithRetry(() =>
      queryOptimizer.getUserDashboardStats(userId, { useCache: true })
    );

    await CacheManager.set(cacheKey, analytics, CacheManager.TTL.LONG);
    return analytics;
  }

  // Batch rental operations
  static async processRentalBatch(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: any;
  }>) {
    return executeWithRetry(async () => {
      const results = [];

      for (const op of operations) {
        let result;
        switch (op.type) {
          case 'create':
            result = await optimizedPrisma.rental.create({ data: op.data });
            break;
          case 'update':
            result = await optimizedPrisma.rental.update({
              where: { id: op.id! },
              data: op.data
            });
            break;
          case 'delete':
            result = await optimizedPrisma.rental.delete({
              where: { id: op.id! }
            });
            break;
        }
        results.push(result);
      }

      // Invalidate relevant caches
      await CacheManager.invalidatePattern('rentals:*');
      await CacheManager.invalidatePattern('user:dashboard:*');

      return results;
    });
  }

  // Performance-optimized aggregation queries
  static async getGearCategoryStats() {
    const cacheKey = 'stats:gear:categories';
    const cached = await CacheManager.get(cacheKey);
    if (cached) return cached;

    const stats = await executeWithRetry(async () => {
      const [categoryCounts, avgPricesByCategory] = await Promise.all([
        optimizedPrisma.gear.groupBy({
          by: ['category'],
          _count: { category: true },
          where: { category: { not: null } }
        }),
        optimizedPrisma.gear.groupBy({
          by: ['category'],
          _avg: { dailyRate: true },
          where: { category: { not: null } }
        })
      ]);

      return categoryCounts.map(cat => ({
        category: cat.category,
        count: cat._count.category,
        averagePrice: avgPricesByCategory.find(
          avg => avg.category === cat.category
        )?._avg.dailyRate || 0
      }));
    });

    await CacheManager.set(cacheKey, stats, CacheManager.TTL.VERY_LONG);
    return stats;
  }

  // Cleanup and maintenance operations
  static async performMaintenance() {
    logger.info('Starting database maintenance operations');

    try {
      // Clean up old performance metrics
      queryOptimizer.clearMetrics();

      // Get connection stats for monitoring
      const stats = getConnectionStats();
      logger.info('Database maintenance completed', {
        activeConnections: stats.activeConnections,
        availableConnections: stats.availableConnections
      });

      return { success: true, stats };
    } catch (error) {
      logger.error('Database maintenance failed:', error);
      return { success: false, error };
    }
  }
}

// Export convenience functions
export const {
  getGearWithAvailability,
  bulkUpdateGearStatus,
  searchGear,
  getUserAnalytics,
  processRentalBatch,
  getGearCategoryStats,
  performMaintenance
} = DatabaseOperations;

// Initialize database optimization
export async function initializeDatabase() {
  try {
    logger.info('Initializing database optimization layer');
    
    // Create default optimized client if not already created
    const defaultClient = connectionPool.getClient('default');
    
    // Verify connection
    await defaultClient.$queryRaw`SELECT 1`;
    
    logger.info('Database initialization completed successfully');
    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    return false;
  }
}