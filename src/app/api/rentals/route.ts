import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError, ValidationError } from '@/lib/api-error-handler';
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
      async () => {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();

        if (!session || !session.user) {
          throw new AuthenticationError();
        }

        const userId = session.user.id;
        
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

        // Cache the result
        await CacheManager.set(cacheKey, rentals, CacheManager.TTL.SHORT);

        logger.info('Rentals fetched successfully', { 
          userId,
          count: rentals.length,
          asRenter: rentals.filter(r => r.renterId === userId).length,
          asOwner: rentals.filter(r => r.ownerId === userId).length
        }, 'API');

        return NextResponse.json(rentals);
      }
    )
  )
);

export const POST = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest) => {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();

        if (!session || !session.user) {
          throw new AuthenticationError();
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createRentalSchema.parse(body);
        const { gearId, startDate, endDate, message } = validatedData;

        logger.info('Rental creation request', { 
          userId: session.user.id,
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

        // Prevent renting own gear
        if (gear.userId === session.user.id) {
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

        if (conflictingRentals.length > 0) {
          logger.warn('Booking conflict detected', {
            gearId,
            requestedDates: { startDate, endDate },
            conflictingRentals: conflictingRentals.map(r => ({
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
          gear.dailyRate,
          gear.weeklyRate,
          gear.monthlyRate,
          numberOfDays
        );

        // Calculate full price breakdown with fees
        const priceBreakdown = calculatePriceBreakdown({
          dailyRate: effectiveDailyRate,
          numberOfDays,
          insuranceRequired: gear.insuranceRequired,
          insuranceRate: gear.insuranceRate,
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
            gearId: gear.id,
            renterId: session.user.id,
            ownerId: gear.userId || '',
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
              renterId: session.user.id,
              ownerId: gear.userId || '',
              startDate,
              endDate,
              status: 'PENDING',
              totalPrice: priceBreakdown.totalPrice,
              basePrice: priceBreakdown.basePrice,
              serviceFee: priceBreakdown.serviceFee,
              hostingFee: priceBreakdown.hostingFee,
              insurancePremium: priceBreakdown.insuranceAmount,
              insuranceType: gear.insuranceRequired ? 'STANDARD' : 'NONE',
              message,
              paymentIntentId: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
              paymentStatus: paymentIntent.status,
            },
          })
        );

        // Invalidate relevant caches
        await Promise.all([
          CacheManager.del(CacheManager.keys.rental.user(session.user.id)),
          CacheManager.del(CacheManager.keys.rental.user(gear.userId || '')),
          CacheManager.del(CacheManager.keys.gear.detail(gearId)),
        ]);

        logger.info('Rental created successfully', {
          rentalId: rental.id,
          gearId,
          renterId: session.user.id,
          ownerId: gear.userId,
          totalPrice: priceBreakdown.totalPrice,
          platformRevenue: priceBreakdown.platformRevenue,
        }, 'API');

        return NextResponse.json({
          rental,
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
