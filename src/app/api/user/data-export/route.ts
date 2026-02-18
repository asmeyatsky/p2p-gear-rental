import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { withErrorHandler } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.auth.limiter, rateLimitConfig.auth.limit)(
      async (req: NextRequest) => {
        const { user } = await authenticateRequest(req);
        const userId = user.id;

        logger.info('GDPR data export requested', { userId }, 'API');

        // Query all user-related data in parallel
        const [
          profile,
          gearListings,
          rentalsAsRenter,
          rentalsAsOwner,
          reviewsGiven,
          reviewsReceived,
          messagesSent,
          disputesReported,
          disputesAgainst,
          disputeResponses,
        ] = await trackDatabaseQuery('user.dataExport', () =>
          Promise.all([
            prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                full_name: true,
                bio: true,
                profileImageUrl: true,
                phoneNumber: true,
                phoneVerified: true,
                verificationStatus: true,
                city: true,
                state: true,
                zipCode: true,
                averageRating: true,
                totalReviews: true,
                completedRentals: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
            prisma.gear.findMany({
              where: { userId },
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
                isAvailable: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
            prisma.rental.findMany({
              where: { renterId: userId },
              select: {
                id: true,
                gearId: true,
                ownerId: true,
                startDate: true,
                endDate: true,
                status: true,
                message: true,
                totalPrice: true,
                basePrice: true,
                serviceFee: true,
                insuranceType: true,
                insurancePremium: true,
                createdAt: true,
              },
            }),
            prisma.rental.findMany({
              where: { ownerId: userId },
              select: {
                id: true,
                gearId: true,
                renterId: true,
                startDate: true,
                endDate: true,
                status: true,
                totalPrice: true,
                basePrice: true,
                hostingFee: true,
                createdAt: true,
              },
            }),
            prisma.review.findMany({
              where: { reviewerId: userId },
              select: {
                id: true,
                rating: true,
                comment: true,
                rentalId: true,
                revieweeId: true,
                createdAt: true,
              },
            }),
            prisma.review.findMany({
              where: { revieweeId: userId },
              select: {
                id: true,
                rating: true,
                comment: true,
                rentalId: true,
                reviewerId: true,
                createdAt: true,
              },
            }),
            prisma.message.findMany({
              where: { senderId: userId },
              select: {
                id: true,
                content: true,
                conversationId: true,
                readAt: true,
                createdAt: true,
              },
            }),
            prisma.dispute.findMany({
              where: { reporterId: userId },
              select: {
                id: true,
                rentalId: true,
                respondentId: true,
                category: true,
                subject: true,
                description: true,
                status: true,
                createdAt: true,
              },
            }),
            prisma.dispute.findMany({
              where: { respondentId: userId },
              select: {
                id: true,
                rentalId: true,
                reporterId: true,
                category: true,
                subject: true,
                description: true,
                status: true,
                createdAt: true,
              },
            }),
            prisma.disputeResponse.findMany({
              where: { userId },
              select: {
                id: true,
                disputeId: true,
                message: true,
                createdAt: true,
              },
            }),
          ])
        );

        const exportData = {
          exportDate: new Date().toISOString(),
          profile,
          gearListings,
          rentalsAsRenter,
          rentalsAsOwner,
          reviewsGiven,
          reviewsReceived,
          messagesSent,
          disputesReported,
          disputesAgainst,
          disputeResponses,
        };

        logger.info('GDPR data export completed', {
          userId,
          gearCount: gearListings.length,
          rentalCount: rentalsAsRenter.length + rentalsAsOwner.length,
        }, 'API');

        return new NextResponse(JSON.stringify(exportData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="gearshare-data-export-${new Date().toISOString().split('T')[0]}.json"`,
          },
        });
      }
    )
  )
);
