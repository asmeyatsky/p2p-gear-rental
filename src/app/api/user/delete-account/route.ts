import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { withErrorHandler, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirmDelete: z.literal('DELETE MY ACCOUNT', {
    error: 'You must type "DELETE MY ACCOUNT" to confirm deletion',
  }),
});

export const DELETE = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.auth.limiter, rateLimitConfig.auth.limit)(
      async (req: NextRequest) => {
        const { user } = await authenticateRequest(req);
        const userId = user.id;

        // Validate confirmation
        const body = await req.json();
        deleteAccountSchema.parse(body);

        logger.warn('Account deletion initiated', { userId }, 'API');

        // Delete all user data in a transaction
        // Deletion order matters due to FK constraints:
        // 1. DisputeResponses on other people's disputes
        // 2. Messages on other people's conversations
        // 3. Rentals (cascade handles: Review, Conversation→Message, Dispute→DisputeResponse, DamageClaim)
        // 4. Gear listings
        // 5. User record
        await trackDatabaseQuery('user.deleteAccount', () =>
          prisma.$transaction(async (tx) => {
            // Delete dispute responses authored by this user (on any dispute)
            await tx.disputeResponse.deleteMany({
              where: { userId },
            });

            // Delete messages sent by this user (on any conversation)
            await tx.message.deleteMany({
              where: { senderId: userId },
            });

            // Delete rentals where user is renter or owner
            // Cascades: Review, Conversation→Message, Dispute→DisputeResponse, DamageClaim
            await tx.rental.deleteMany({
              where: {
                OR: [{ renterId: userId }, { ownerId: userId }],
              },
            });

            // Delete gear listings
            await tx.gear.deleteMany({
              where: { userId },
            });

            // Delete the user record
            await tx.user.delete({
              where: { id: userId },
            });
          })
        );

        // Invalidate all user-related caches
        await Promise.all([
          CacheManager.invalidatePattern(`user:${userId}:*`),
          CacheManager.invalidatePattern(`rental:user:${userId}:*`),
          CacheManager.invalidatePattern('gear:list:*'),
        ]);

        logger.warn('Account deletion completed', { userId }, 'API');

        return NextResponse.json({
          message: 'Account and all associated data have been permanently deleted',
        });
      }
    )
  )
);
