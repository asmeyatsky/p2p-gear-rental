import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { withErrorHandler, NotFoundError, ForbiddenError, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';

export const PUT = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        
        const { user } = await authenticateRequest(request);

        // Parse request body
        const body = await request.json();
        const { message } = body;

        logger.info('Rental rejection request', { 
          rentalId: id,
          ownerId: user.id 
        }, 'API');

        // Get rental details
        const rental = await trackDatabaseQuery('rental.findUnique', () =>
          prisma.rental.findUnique({
            where: { id },
            include: {
              gear: { select: { id: true, title: true } },
              renter: { select: { id: true, email: true, full_name: true } }
            }
          })
        );

        if (!rental) {
          throw new NotFoundError('Rental request not found');
        }

        const rentalData = rental as any;

        if (rentalData.ownerId !== user.id) {
          throw new ForbiddenError('You are not the owner of this rental request');
        }

        if (rentalData.status !== 'PENDING') {
          throw new ValidationError(`Rental request is already ${rentalData.status}`);
        }

        // Update rental status
        const updatedRental = await trackDatabaseQuery('rental.update', () =>
          prisma.rental.update({
            where: { id },
            data: {
              status: 'REJECTED',
              message: message || rentalData.message,
            },
            include: {
              gear: { select: { id: true, title: true } },
              renter: { select: { id: true, email: true, full_name: true } },
              owner: { select: { id: true, email: true, full_name: true } }
            }
          })
        );

        // Invalidate relevant caches
        await Promise.all([
          CacheManager.del(CacheManager.keys.rental.user(rentalData.renterId)),
          CacheManager.del(CacheManager.keys.rental.user(rentalData.ownerId)),
          CacheManager.del(CacheManager.keys.rental.item(id)),
        ]);

        logger.info('Rental rejected successfully', {
          rentalId: id,
          ownerId: user.id,
          renterId: rentalData.renterId,
          gearTitle: rentalData.gear?.title,
          rejectionMessage: message || 'No message provided'
        }, 'API');

        return NextResponse.json(updatedRental);
      }
    )
  )
);
