import { prisma } from '@/lib/db';
import { getCached, setCache } from '@/lib/cache';
import { logger } from '@/lib/logger';

// Query performance monitoring and optimization utilities

interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  includeMetrics?: boolean;
}

interface QueryMetrics {
  executionTime: number;
  cacheHit: boolean;
  queryType: string;
  recordCount?: number;
}

export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private metrics: Map<string, QueryMetrics[]> = new Map();

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  // Optimized gear listing with intelligent caching and pagination
  async getGearListings(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    userId?: string;
  }, options: QueryOptions = {}) {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('gear-listings', params);
    
    try {
      // Check cache first if enabled
      if (options.useCache !== false) {
        const cached = await getCached<any>(cacheKey);
        if (cached) {
          this.recordMetrics('gear-listings', {
            executionTime: Date.now() - startTime,
            cacheHit: true,
            queryType: 'SELECT',
            recordCount: cached.data?.length
          });
          return cached;
        }
      }

      const page = params.page || 1;
      const limit = Math.min(params.limit || 20, 50); // Cap at 50
      const skip = (page - 1) * limit;

      // Build optimized where clause
      const whereClause = this.buildGearWhereClause(params);

      // Use Promise.all for parallel queries
      const [gear, totalCount] = await Promise.all([
        // Main gear query with optimized includes
        prisma.gear.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: this.buildOrderBy(params.sortBy),
          select: {
            id: true,
            title: true,
            description: true,
            dailyRate: true,
            weeklyRate: true,
            monthlyRate: true,
            images: true,
            city: true,
            state: true,
            category: true,
            brand: true,
            model: true,
            condition: true,
            createdAt: true,
            updatedAt: true,
            // Optimized user selection
            user: {
              select: {
                id: true,
                full_name: true,
                averageRating: true,
                totalReviews: true
              }
            },
            // Only include reviews count, not full reviews
            _count: true
          }
        }),

        // Optimized count query
        prisma.gear.count({ where: whereClause })
      ]);

      const result = {
        data: gear,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };

      // Cache the result
      if (options.useCache !== false) {
        await setCache(cacheKey, result, options.cacheTTL || 300); // 5 minutes default
      }

      this.recordMetrics('gear-listings', {
        executionTime: Date.now() - startTime,
        cacheHit: false,
        queryType: 'SELECT',
        recordCount: gear.length
      });

      return result;

    } catch (error) {
      logger.error('Query optimization error in getGearListings:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Optimized gear detail with related data
  async getGearDetail(gearId: string, options: QueryOptions = {}) {
    const startTime = Date.now();
    const cacheKey = `gear-detail:${gearId}`;

    try {
      if (options.useCache !== false) {
        const cached = await getCached<any>(cacheKey);
        if (cached) {
          this.recordMetrics('gear-detail', {
            executionTime: Date.now() - startTime,
            cacheHit: true,
            queryType: 'SELECT'
          });
          return cached;
        }
      }

      const gear = await prisma.gear.findUnique({
        where: { id: gearId },
        select: {
          id: true,
          title: true,
          description: true,
          dailyRate: true,
          weeklyRate: true,
          monthlyRate: true,
          images: true,
          city: true,
          state: true,
          category: true,
          brand: true,
          model: true,
          condition: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              full_name: true,
              averageRating: true,
              totalReviews: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              rentals: {
                where: {
                  status: { in: ['PENDING', 'APPROVED', 'CONFIRMED'] }
                }
              }
            }
          }
        }
      });

      if (options.useCache !== false) {
        await setCache(cacheKey, gear, options.cacheTTL || 600); // 10 minutes
      }

      this.recordMetrics('gear-detail', {
        executionTime: Date.now() - startTime,
        cacheHit: false,
        queryType: 'SELECT'
      });

      return gear;

    } catch (error) {
      logger.error('Query optimization error in getGearDetail:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Optimized user dashboard stats
  async getUserDashboardStats(userId: string, options: QueryOptions = {}) {
    const startTime = Date.now();
    const cacheKey = `dashboard-stats:${userId}`;

    try {
      if (options.useCache !== false) {
        const cached = await getCached<any>(cacheKey);
        if (cached) {
          this.recordMetrics('dashboard-stats', {
            executionTime: Date.now() - startTime,
            cacheHit: true,
            queryType: 'SELECT'
          });
          return cached;
        }
      }

      // Use Promise.all for parallel execution
      const [
        gearStats,
        rentalStats,
        earningsData,
        recentActivity,
        reviewStats
      ] = await Promise.all([
        // Gear statistics
        Promise.all([
          prisma.gear.count({ where: { userId } }),
          prisma.gear.aggregate({
            where: { userId },
            _avg: { dailyRate: true }
          })
        ]),

        // Rental statistics
        Promise.all([
          prisma.rental.count({ where: { ownerId: userId } }),
          prisma.rental.count({ where: { renterId: userId } }),
          prisma.rental.count({
            where: {
              OR: [{ ownerId: userId }, { renterId: userId }],
              status: { in: ['CONFIRMED', 'APPROVED'] },
              endDate: { gt: new Date() }
            }
          }),
          prisma.rental.count({
            where: { ownerId: userId, status: 'PENDING' }
          })
        ]),

        // Earnings data - Payment model not implemented yet
        // prisma.payment.aggregate({
        //   where: {
        //     rental: { ownerId: userId },
        //     status: 'completed'
        //   },
        //   _sum: { amount: true }
        // }),
        Promise.resolve({ _sum: { amount: 0 } }),

        // Recent activity (limited and optimized)
        prisma.rental.findMany({
          where: { ownerId: userId },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            gear: { select: { title: true } },
            renter: { select: { full_name: true } }
          }
        }),

        // Review statistics
        prisma.review.aggregate({
          where: { revieweeId: userId },
          _avg: { rating: true },
          _count: { id: true }
        })
      ]);

      const [totalGear, avgDailyRate] = gearStats;
      const [totalAsOwner, totalAsRenter, activeRentals, pendingRequests] = rentalStats;

      const result = {
        gear: {
          total: totalGear,
          averageDailyRate: avgDailyRate._avg.dailyRate || 0
        },
        rentals: {
          totalAsOwner,
          totalAsRenter,
          active: activeRentals,
          pending: pendingRequests
        },
        earnings: {
          total: earningsData._sum.amount || 0
        },
        reviews: {
          averageRating: reviewStats?._avg?.rating || 0,
          totalReviews: reviewStats?._count?.id || 0
        },
        recentActivity
      };

      if (options.useCache !== false) {
        await setCache(cacheKey, result, options.cacheTTL || 300); // 5 minutes
      }

      this.recordMetrics('dashboard-stats', {
        executionTime: Date.now() - startTime,
        cacheHit: false,
        queryType: 'SELECT'
      });

      return result;

    } catch (error) {
      logger.error('Query optimization error in getUserDashboardStats:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Optimized rental availability check
  async checkGearAvailability(
    gearId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      const conflictingRental = await prisma.rental.findFirst({
        where: {
          gearId,
          id: excludeRentalId ? { not: excludeRentalId } : undefined,
          status: { in: ['PENDING', 'APPROVED', 'CONFIRMED'] },
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: startDate } }
          ]
        },
        select: { id: true } // Only need to know if it exists
      });

      this.recordMetrics('availability-check', {
        executionTime: Date.now() - startTime,
        cacheHit: false,
        queryType: 'SELECT'
      });

      return !conflictingRental;

    } catch (error) {
      logger.error('Query optimization error in checkGearAvailability:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Helper methods
  private buildGearWhereClause(params: any) {
    const where: any = {};

    // Text search across multiple fields
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { brand: { contains: params.search, mode: 'insensitive' } },
        { model: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (params.category) {
      where.category = params.category;
    }

    // Price range
    if (params.minPrice || params.maxPrice) {
      where.dailyRate = {};
      if (params.minPrice) where.dailyRate.gte = params.minPrice;
      if (params.maxPrice) where.dailyRate.lte = params.maxPrice;
    }

    // Location filter
    if (params.location) {
      const [city, state] = params.location.split(',').map((s: string) => s.trim());
      if (city) where.city = { contains: city, mode: 'insensitive' };
      if (state) where.state = { contains: state, mode: 'insensitive' };
    }

    // Availability filter (most complex)
    if (params.startDate && params.endDate) {
      where.NOT = {
        rentals: {
          some: {
            AND: [
              {
                OR: [
                  { startDate: { lte: new Date(params.endDate) } },
                  { endDate: { gte: new Date(params.startDate) } }
                ]
              },
              {
                status: { in: ['PENDING', 'APPROVED', 'CONFIRMED'] }
              }
            ]
          }
        }
      };
    }

    // Exclude user's own gear
    if (params.userId) {
      where.userId = { not: params.userId };
    }

    return where;
  }

  private buildOrderBy(sortBy?: string) {
    switch (sortBy) {
      case 'price-low':
        return { dailyRate: 'asc' as const };
      case 'price-high':
        return { dailyRate: 'desc' as const };
      case 'rating':
        return { user: { averageRating: 'desc' as const } };
      case 'distance':
        // Would need geolocation implementation
        return { createdAt: 'desc' as const };
      default:
        return { createdAt: 'desc' as const };
    }
  }

  private generateCacheKey(operation: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result: any, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${operation}:${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`;
  }

  private recordMetrics(operation: string, metrics: QueryMetrics) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push({
      ...metrics,
      queryType: metrics.queryType,
      timestamp: Date.now()
    } as any);

    // Keep only last 100 metrics per operation
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }

    // Log slow queries
    if (metrics.executionTime > 1000) { // 1 second
      logger.warn(`Slow query detected: ${operation}`, {
        executionTime: metrics.executionTime,
        cacheHit: metrics.cacheHit,
        recordCount: metrics.recordCount
      });
    }
  }

  // Get performance metrics for monitoring
  getPerformanceMetrics(operation?: string) {
    if (operation) {
      return this.metrics.get(operation) || [];
    }
    
    const allMetrics: any = {};
    for (const [op, metrics] of this.metrics.entries()) {
      allMetrics[op] = {
        totalQueries: metrics.length,
        averageExecutionTime: metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length,
        cacheHitRate: metrics.filter(m => m.cacheHit).length / metrics.length,
        slowQueries: metrics.filter(m => m.executionTime > 1000).length
      };
    }
    
    return allMetrics;
  }

  // Clear metrics for testing or reset
  clearMetrics(operation?: string) {
    if (operation) {
      this.metrics.delete(operation);
    } else {
      this.metrics.clear();
    }
  }
}

export const queryOptimizer = QueryOptimizer.getInstance();