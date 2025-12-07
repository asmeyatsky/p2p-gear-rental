import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, NotFoundError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';

interface AvailabilityContext {
  params: Promise<{ id: string }>;
}

// GET /api/gear/[id]/availability - Get unavailable dates for a gear item
export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (_request: NextRequest, context?: AvailabilityContext) => {
        const { id: gearId } = await context!.params;

        logger.debug('Fetching gear availability', { gearId }, 'API');

        // Check cache first
        const cacheKey = `gear:${gearId}:availability`;
        const cached = await CacheManager.get(cacheKey);

        if (cached) {
          logger.debug('Cache hit for gear availability', { gearId }, 'CACHE');
          return NextResponse.json(cached);
        }

        // Verify gear exists
        const gear = await trackDatabaseQuery('gear.findUnique.availability', () =>
          prisma.gear.findUnique({
            where: { id: gearId },
            select: { id: true, title: true },
          })
        );

        if (!gear) {
          throw new NotFoundError('Gear not found');
        }

        // Get all active/approved/pending rentals for this gear
        const rentals = await trackDatabaseQuery('rental.findMany.availability', () =>
          prisma.rental.findMany({
            where: {
              gearId,
              status: {
                in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE'],
              },
              // Only include future or ongoing rentals
              endDate: {
                gte: new Date(),
              },
            },
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true,
            },
            orderBy: {
              startDate: 'asc',
            },
          })
        );

        // Build list of unavailable date ranges
        const unavailableDates = rentals.map(rental => ({
          start: rental.startDate.toISOString().split('T')[0],
          end: rental.endDate.toISOString().split('T')[0],
          status: rental.status,
        }));

        const response = {
          gearId,
          unavailableDates,
          totalBookings: rentals.length,
        };

        // Cache the result (short TTL since availability changes)
        await CacheManager.set(cacheKey, response, CacheManager.TTL.SHORT);

        logger.info('Gear availability fetched', {
          gearId,
          unavailablePeriods: unavailableDates.length,
        }, 'API');

        return NextResponse.json(response);
      }
    )
  )
);

// POST /api/gear/[id]/availability/check - Check if specific dates are available
export const POST = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, context?: AvailabilityContext) => {
        const { id: gearId } = await context!.params;
        const body = await request.json();
        const { startDate, endDate } = body;

        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate are required' },
            { status: 400 }
          );
        }

        logger.debug('Checking gear availability for dates', {
          gearId,
          startDate,
          endDate,
        }, 'API');

        // Check for conflicting rentals
        const conflicts = await trackDatabaseQuery('rental.findMany.checkAvailability', () =>
          prisma.rental.findMany({
            where: {
              gearId,
              status: {
                in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE'],
              },
              OR: [
                {
                  startDate: { lte: new Date(startDate) },
                  endDate: { gte: new Date(startDate) },
                },
                {
                  startDate: { lte: new Date(endDate) },
                  endDate: { gte: new Date(endDate) },
                },
                {
                  startDate: { gte: new Date(startDate) },
                  endDate: { lte: new Date(endDate) },
                },
              ],
            },
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          })
        );

        const isAvailable = conflicts.length === 0;

        logger.info('Availability check completed', {
          gearId,
          startDate,
          endDate,
          isAvailable,
          conflictCount: conflicts.length,
        }, 'API');

        return NextResponse.json({
          gearId,
          startDate,
          endDate,
          isAvailable,
          conflicts: isAvailable ? [] : conflicts.map(c => ({
            start: c.startDate.toISOString().split('T')[0],
            end: c.endDate.toISOString().split('T')[0],
          })),
        });
      }
    )
  )
);
