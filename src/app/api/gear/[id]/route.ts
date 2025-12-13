import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, ValidationError, NotFoundError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { requireAuth, requireOwnership, addSecurityHeaders } from '@/lib/auth/middleware';
import { updateGearSchema } from '@/lib/validations/gear';
import { CacheManager } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { queryOptimizer } from '@/lib/database/query-optimizer';
import { executeWithRetry } from '@/lib/database';

export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: { id: string } }) => {
        const gearId = params.id;

        if (!gearId) {
          throw new ValidationError('Gear ID is required');
        }

        logger.debug('Gear details request', { gearId }, 'API');

        // Try cache first
        const cacheKey = CacheManager.keys.gear.detail(gearId);
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          const response = NextResponse.json(cached);
          return addSecurityHeaders(response);
        }

        // Get gear with all related data using optimized query
        const gear = await executeWithRetry(() =>
          queryOptimizer.getGearDetail(gearId, {
            useCache: false, // Already handled by route-level cache
            includeMetrics: process.env.NODE_ENV !== 'production'
          })
        );

        if (!gear) {
          throw new NotFoundError('Gear not found');
        }

        // Cache for 10 minutes
        await CacheManager.set(cacheKey, gear, CacheManager.TTL.LONG);

        logger.info('Gear details retrieved', { 
          gearId, 
          title: gear.title,
          ownerId: gear.userId
        }, 'API');

        const response = NextResponse.json(gear);
        return addSecurityHeaders(response);
      }
    )
  )
);

export const PUT = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: { id: string } }) => {
        const gearId = params.id;

        if (!gearId) {
          throw new ValidationError('Gear ID is required');
        }

        // Authenticate user and verify ownership
        const authContext = await requireAuth();
        await requireOwnership('gear', gearId, authContext);

        // Parse and validate request body
        const body = await request.json();
        const validatedData = updateGearSchema.parse(body);

        logger.info('Gear update request', { 
          gearId, 
          userId: authContext.userId,
          fieldsUpdated: Object.keys(validatedData)
        }, 'API');

        // Update gear with retry logic
        const updatedGear = await executeWithRetry(() =>
          trackDatabaseQuery('gear.update', () =>
            prisma.gear.update({
              where: { id: gearId },
              data: {
                ...validatedData,
                updatedAt: new Date(),
              },
              include: {
                user: {
                  select: { 
                    id: true, 
                    email: true, 
                    full_name: true,
                    averageRating: true,
                    totalReviews: true
                  }
                }
              }
            })
          )
        );

        // Invalidate related caches
        await Promise.all([
          CacheManager.del(CacheManager.keys.gear.detail(gearId)),
          CacheManager.del(CacheManager.keys.gear.user(authContext.userId)),
          CacheManager.invalidatePattern('gear:list:*'),
          validatedData.category ? CacheManager.del(CacheManager.keys.gear.category(validatedData.category)) : Promise.resolve(),
        ]);

        logger.info('Gear updated successfully', { 
          gearId, 
          userId: authContext.userId,
          title: updatedGear.title
        }, 'API');

        const response = NextResponse.json(updatedGear);
        return addSecurityHeaders(response);
      }
    )
  )
);

export const DELETE = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: { id: string } }) => {
        const gearId = params.id;

        if (!gearId) {
          throw new ValidationError('Gear ID is required');
        }

        // Authenticate user and verify ownership
        const authContext = await requireAuth();
        await requireOwnership('gear', gearId, authContext);

        logger.info('Gear deletion request', { 
          gearId, 
          userId: authContext.userId 
        }, 'API');

        // Check if gear has active rentals with retry logic
        const activeRentals = await executeWithRetry(() =>
          trackDatabaseQuery('rental.count', () =>
            prisma.rental.count({
              where: {
                gearId,
                status: { in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE'] }
              }
            })
          )
        );

        if (activeRentals > 0) {
          throw new ValidationError('Cannot delete gear with active rentals');
        }

        // Get gear info before deletion for cache invalidation
        const gear = await executeWithRetry(() =>
          prisma.gear.findUnique({
            where: { id: gearId },
            select: { category: true, title: true }
          })
        );

        // Delete gear (this will cascade to related records due to DB constraints)
        await executeWithRetry(() =>
          trackDatabaseQuery('gear.delete', () =>
            prisma.gear.delete({
              where: { id: gearId }
            })
          )
        );

        // Invalidate related caches
        await Promise.all([
          CacheManager.del(CacheManager.keys.gear.detail(gearId)),
          CacheManager.del(CacheManager.keys.gear.user(authContext.userId)),
          CacheManager.invalidatePattern('gear:list:*'),
          gear?.category ? CacheManager.del(CacheManager.keys.gear.category(gear.category)) : Promise.resolve(),
        ]);

        logger.info('Gear deleted successfully', { 
          gearId, 
          userId: authContext.userId,
          title: gear?.title
        }, 'API');

        const response = NextResponse.json({ message: 'Gear deleted successfully' });
        return addSecurityHeaders(response);
      }
    )
  )
);