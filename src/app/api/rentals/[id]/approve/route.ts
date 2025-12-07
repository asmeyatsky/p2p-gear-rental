import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError, NotFoundError, ForbiddenError, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';

export const PUT = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();

        if (!session || !session.user) {
          throw new AuthenticationError();
        }

        // Parse request body
        const body = await request.json();
        const { message } = body;

        logger.info('Rental approval request', { 
          rentalId: id,
          ownerId: session.user.id 
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

        if (rental.ownerId !== session.user.id) {
          throw new ForbiddenError('You are not the owner of this rental request');
        }

        if (rental.status !== 'PENDING') {
          throw new ValidationError(`Rental request is already ${rental.status}`);
        }

        // Update rental status
        const updatedRental = await trackDatabaseQuery('rental.update', () =>
          prisma.rental.update({
            where: { id },
            data: {
              status: 'APPROVED',
              approvedAt: new Date(),
              message: message || rental.message,
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
          CacheManager.del(CacheManager.keys.rental.user(rental.renterId)),
          CacheManager.del(CacheManager.keys.rental.user(rental.ownerId)),
          CacheManager.del(CacheManager.keys.rental.item(id)),
        ]);

        logger.info('Rental approved successfully', { 
          rentalId: id,
          ownerId: session.user.id,
          renterId: rental.renterId,
          gearTitle: rental.gear.title
        }, 'API');

        return NextResponse.json(updatedRental);
      }
    )
  )
);
