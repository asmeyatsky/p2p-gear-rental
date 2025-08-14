import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring } from '@/lib/monitoring';

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

        try {
          // Calculate date ranges
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

          // Get all rentals where user is owner or renter
          const allRentals = await prisma.rental.findMany({
            where: {
              OR: [
                { ownerId: userId },
                { renterId: userId }
              ]
            },
            include: {
              gear: {
                select: {
                  dailyRate: true
                }
              }
            }
          });

          // Get rentals where user is the owner (earning money)
          const ownerRentals = allRentals.filter(rental => rental.ownerId === userId);

          // Calculate basic stats
          const totalRentals = allRentals.length;
          const activeRentals = allRentals.filter(rental => 
            rental.status === 'approved' || rental.status === 'active'
          ).length;
          const pendingRequests = ownerRentals.filter(rental => 
            rental.status === 'pending'
          ).length;
          const completedRentals = allRentals.filter(rental => 
            rental.status === 'completed'
          ).length;

          // Calculate earnings (only from rentals where user is the owner)
          const completedOwnerRentals = ownerRentals.filter(rental => 
            rental.status === 'completed'
          );

          let totalEarnings = 0;
          let thisMonthEarnings = 0;
          let lastMonthEarnings = 0;

          for (const rental of completedOwnerRentals) {
            const startDate = new Date(rental.startDate);
            const endDate = new Date(rental.endDate);
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const earnings = days * rental.gear.dailyRate;

            totalEarnings += earnings;

            // Check if rental was completed this month
            const completedAt = new Date(rental.updatedAt || rental.createdAt);
            if (completedAt >= startOfMonth) {
              thisMonthEarnings += earnings;
            }

            // Check if rental was completed last month
            if (completedAt >= startOfLastMonth && completedAt <= endOfLastMonth) {
              lastMonthEarnings += earnings;
            }
          }

          // Calculate this month's rental count
          const thisMonthRentals = allRentals.filter(rental => {
            const createdAt = new Date(rental.createdAt);
            return createdAt >= startOfMonth;
          }).length;

          const lastMonthRentals = allRentals.filter(rental => {
            const createdAt = new Date(rental.createdAt);
            return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
          }).length;

          // Calculate average rating (placeholder - would need review system)
          // For now, we'll return null or a default value
          const averageRating = null;

          // Calculate trends
          const earningsTrend = lastMonthEarnings > 0 
            ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
            : thisMonthEarnings > 0 ? 100 : 0;

          const rentalsTrend = lastMonthRentals > 0
            ? ((thisMonthRentals - lastMonthRentals) / lastMonthRentals) * 100
            : thisMonthRentals > 0 ? 100 : 0;

          const stats = {
            totalRentals,
            activeRentals,
            pendingRequests,
            completedRentals,
            totalEarnings,
            averageRating,
            thisMonthEarnings,
            thisMonthRentals,
            trends: {
              earnings: {
                value: Math.round(earningsTrend),
                isPositive: earningsTrend >= 0
              },
              rentals: {
                value: Math.round(rentalsTrend),
                isPositive: rentalsTrend >= 0
              }
            }
          };

          return NextResponse.json(stats);

        } catch (error) {
          console.error('Dashboard stats error:', error);
          throw new Error('Failed to fetch dashboard statistics');
        }
      }
    )
  )
);