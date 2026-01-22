import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError, NotFoundError, ForbiddenError, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { container } from '@/infrastructure/config/dependency-injection';

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

        logger.info('Rental completion request', {
          rentalId: id,
          userId: session.user.id
        }, 'API');

        // Get rental details
        const rental = await trackDatabaseQuery('rental.findUnique', () =>
          prisma.rental.findUnique({
            where: { id },
            include: {
              gear: { select: { id: true, title: true } },
              renter: { select: { id: true, email: true, full_name: true } },
              owner: { select: { id: true, email: true, full_name: true } }
            }
          })
        );

        if (!rental) {
          throw new NotFoundError('Rental request not found');
        }

        const rentalData = rental as any;

        // Only the owner (gear owner) can mark the rental as completed
        if (rentalData.ownerId !== session.user.id) {
          throw new ForbiddenError('You are not authorized to complete this rental');
        }

        if (!['APPROVED', 'ACTIVE'].includes(rentalData.status)) {
          throw new ValidationError(`Rental request is ${rentalData.status}. Only approved or active rentals can be marked as completed.`);
        }

        // Update rental status to completed
        const updatedRental = await trackDatabaseQuery('rental.update', () =>
          prisma.rental.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(), // Add completedAt field
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

        // Send notification to renter about completion
        try {
          const notificationService = container.getNotificationService();
          await notificationService.sendNotification(
            rentalData.renterId,
            `Your rental of ${rentalData.gear?.title} has been marked as completed by the owner. You can now leave a review.`,
            'Rental Completed'
          );
        } catch (error) {
          logger.error('Failed to send completion notification', {
            error: (error as Error).message,
            rentalId: id,
            renterId: rentalData.renterId
          }, 'NOTIFICATIONS');
          // Don't fail the request if notification fails
        }

        logger.info('Rental completed successfully', {
          rentalId: id,
          ownerId: session.user.id,
          renterId: rentalData.renterId,
          gearTitle: rentalData.gear?.title
        }, 'API');

        return NextResponse.json(updatedRental);
      }
    )
  )
);