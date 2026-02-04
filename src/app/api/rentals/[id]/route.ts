import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { withErrorHandler, NotFoundError, ForbiddenError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';

export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;

        const { user } = await authenticateRequest(request);

        logger.debug('Fetch single rental', { rentalId: id, userId: user.id }, 'API');

        // Check cache first
        const cacheKey = CacheManager.keys.rental.item(id);
        const cached = await CacheManager.get(cacheKey);

        if (cached) {
          return NextResponse.json(cached);
        }

        const rental = await trackDatabaseQuery('rental.findUnique', () =>
          prisma.rental.findUnique({
            where: { id },
            include: {
              gear: {
                select: {
                  id: true,
                  title: true,
                  images: true,
                  dailyRate: true,
                  insuranceRequired: true,
                  insuranceRate: true,
                },
              },
              renter: { select: { id: true, email: true, full_name: true } },
              owner: { select: { id: true, email: true, full_name: true } },
            },
          })
        );

        if (!rental) {
          throw new NotFoundError('Rental not found');
        }

        const rentalData = rental as any;

        // Only the renter or owner can view the rental
        if (rentalData.renterId !== user.id && rentalData.ownerId !== user.id) {
          throw new ForbiddenError('You do not have access to this rental');
        }

        await CacheManager.set(cacheKey, rentalData, CacheManager.TTL.SHORT);

        return NextResponse.json(rentalData);
      }
    )
  )
);
