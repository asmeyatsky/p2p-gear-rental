import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { withErrorHandler, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { createRentalSchema } from '@/lib/validations/rental';
import { calculatePriceBreakdown, calculateNumberOfDays, getBestDailyRate } from '@/lib/pricing';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil', // Use supported API version
});

export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (req: NextRequest) => {
        const { user } = await authenticateRequest(req);
        const userId = user.id;
        
        logger.debug('Fetching rentals for user', { userId }, 'API');

        // Check cache first
        const cacheKey = CacheManager.keys.rental.user(userId);
        const cached = await CacheManager.get(cacheKey);
        
        if (cached) {
          logger.debug('Cache hit for user rentals', { userId, cacheKey }, 'CACHE');
          return NextResponse.json(cached);
        }

        logger.debug('Cache miss for user rentals', { userId, cacheKey }, 'CACHE');

        // Fetch from database
        const rentals = await trackDatabaseQuery('rental.findMany', () =>
          prisma.rental.findMany({
            where: {
              OR: [
                { renterId: userId },
                { ownerId: userId },
              ],
            },
            include: {
              gear: true,
              renter: {
                select: {
                  id: true,
                  email: true,
                  full_name: true,
                },
              },
              owner: {
                select: {
                  id: true,
                  email: true,
                  full_name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        );

        const rentalList = rentals as any[];

        // Cache the result
        await CacheManager.set(cacheKey, rentalList, CacheManager.TTL.SHORT);

        logger.info('Rentals fetched successfully', {
          userId,
          count: rentalList.length,
          asRenter: rentalList.filter((r: any) => r.renterId === userId).length,
          asOwner: rentalList.filter((r: any) => r.ownerId === userId).length
        }, 'API');

        return NextResponse.json(rentalList);
      }
    )
  )
);

export const POST = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest) => {
        const { user } = await authenticateRequest(request);

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createRentalSchema.parse(body);
        const { gearId, startDate, endDate, message } = validatedData;

        logger.info('Rental creation request', { 
          userId: user.id,
          gearId,
          startDate,
          endDate
        }, 'API');

        // Check if gear exists and get ownerId
        const gear = await trackDatabaseQuery('gear.findUnique', () =>
          prisma.gear.findUnique({
            where: { id: gearId },
          })
        );

        if (!gear) {
          throw new ValidationError('Gear not found');
        }

        const gearData = gear as any;

        // Prevent renting own gear
        if (gearData.userId === user.id) {
          throw new ValidationError('Cannot rent your own gear');
        }

        // Check for booking conflicts - prevent double booking
        const conflictingRentals = await trackDatabaseQuery('rental.findMany.conflicts', () =>
          prisma.rental.findMany({
            where: {
              gearId,
              status: {
                in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE'],
              },
              OR: [
                // New rental starts during existing rental
                {
                  startDate: { lte: new Date(startDate) },
                  endDate: { gte: new Date(startDate) },
                },
                // New rental ends during existing rental
                {
                  startDate: { lte: new Date(endDate) },
                  endDate: { gte: new Date(endDate) },
                },
                // New rental completely overlaps existing rental
                {
                  startDate: { gte: new Date(startDate) },
                  endDate: { lte: new Date(endDate) },
                },
              ],
            },
          })
        );

        const conflictList = conflictingRentals as any[];
        if (conflictList.length > 0) {
          logger.warn('Booking conflict detected', {
            gearId,
            requestedDates: { startDate, endDate },
            conflictingRentals: conflictList.map((r: any) => ({
              id: r.id,
              startDate: r.startDate,
              endDate: r.endDate,
              status: r.status,
            })),
          }, 'API');
          throw new ValidationError('This gear is not available for the selected dates. Please choose different dates.');
        }

        // Calculate rental duration and pricing
        const numberOfDays = calculateNumberOfDays(new Date(startDate), new Date(endDate));

        // Get the best applicable daily rate
        const effectiveDailyRate = getBestDailyRate(
          gearData.dailyRate,
          gearData.weeklyRate,
          gearData.monthlyRate,
          numberOfDays
        );

        // Calculate full price breakdown with fees
        const priceBreakdown = calculatePriceBreakdown({
          dailyRate: effectiveDailyRate,
          numberOfDays,
          insuranceRequired: gearData.insuranceRequired,
          insuranceRate: gearData.insuranceRate,
        });

        const amountInCents = Math.round(priceBreakdown.totalPrice * 100);

        logger.debug('Rental calculation', {
          numberOfDays,
          effectiveDailyRate,
          basePrice: priceBreakdown.basePrice,
          insuranceAmount: priceBreakdown.insuranceAmount,
          serviceFee: priceBreakdown.serviceFee,
          hostingFee: priceBreakdown.hostingFee,
          totalPrice: priceBreakdown.totalPrice,
          ownerPayout: priceBreakdown.ownerPayout,
          platformRevenue: priceBreakdown.platformRevenue,
        }, 'API');

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            gearId: gearData.id,
            renterId: user.id,
            ownerId: gearData.userId || '',
            startDate,
            endDate,
            basePrice: priceBreakdown.basePrice.toString(),
            insuranceAmount: priceBreakdown.insuranceAmount.toString(),
            serviceFee: priceBreakdown.serviceFee.toString(),
            hostingFee: priceBreakdown.hostingFee.toString(),
          },
        });

        logger.debug('Stripe payment intent created', {
          paymentIntentId: paymentIntent.id,
          amount: priceBreakdown.totalPrice,
          currency: 'USD'
        }, 'STRIPE');

        // Create the rental request with full price breakdown
        const rental = await trackDatabaseQuery('rental.create', () =>
          prisma.rental.create({
            data: {
              gearId,
              renterId: user.id,
              ownerId: gearData.userId || '',
              startDate,
              endDate,
              status: 'PENDING',
              totalPrice: priceBreakdown.totalPrice,
              basePrice: priceBreakdown.basePrice,
              serviceFee: priceBreakdown.serviceFee,
              hostingFee: priceBreakdown.hostingFee,
              insurancePremium: priceBreakdown.insuranceAmount,
              insuranceType: gearData.insuranceRequired ? 'STANDARD' : 'NONE',
              message,
              paymentIntentId: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
              paymentStatus: paymentIntent.status,
            },
          })
        );

        const createdRental = rental as any;

        // Invalidate relevant caches
        await Promise.all([
          CacheManager.del(CacheManager.keys.rental.user(user.id)),
          CacheManager.del(CacheManager.keys.rental.user(gearData.userId || '')),
          CacheManager.del(CacheManager.keys.gear.detail(gearId)),
        ]);

        logger.info('Rental created successfully', {
          rentalId: createdRental.id,
          gearId,
          renterId: user.id,
          ownerId: gearData.userId,
          totalPrice: priceBreakdown.totalPrice,
          platformRevenue: priceBreakdown.platformRevenue,
        }, 'API');

        return NextResponse.json({
          rental: createdRental,
          clientSecret: paymentIntent.client_secret,
          priceBreakdown: {
            basePrice: priceBreakdown.basePrice,
            insuranceAmount: priceBreakdown.insuranceAmount,
            serviceFee: priceBreakdown.serviceFee,
            hostingFee: priceBreakdown.hostingFee,
            totalPrice: priceBreakdown.totalPrice,
            numberOfDays: priceBreakdown.numberOfDays,
            dailyRate: priceBreakdown.dailyRate,
          },
        }, { status: 201 });
      }
    )
  )
);
