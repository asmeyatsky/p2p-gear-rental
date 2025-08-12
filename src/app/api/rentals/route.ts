import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-11-20.acacia' as any, // Use supported API version
});

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

        // Parse request body
        const body = await request.json();
        const { gearId, startDate, endDate, message } = body;

        // Basic validation
        if (!gearId || !startDate || !endDate) {
          throw new ValidationError('Missing required fields: gearId, startDate, endDate');
        }

        logger.info('Rental creation request', { 
          userId: session.user.id,
          gearId,
          startDate,
          endDate
        }, 'API');

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
          throw new ValidationError('Invalid dates provided');
        }

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

        // Calculate rental duration and amount
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const amount = Math.round(gear.dailyRate * diffDays * 100); // Amount in cents

        logger.debug('Rental calculation', { 
          diffDays,
          dailyRate: gear.dailyRate,
          totalAmount: amount / 100
        }, 'API');

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
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
          },
        });

        logger.debug('Stripe payment intent created', { 
          paymentIntentId: paymentIntent.id,
          amount: amount / 100,
          currency: 'USD'
        }, 'STRIPE');

        // Create the rental request
        const rental = await trackDatabaseQuery('rental.create', () =>
          prisma.rental.create({
            data: {
              gearId,
              renterId: session.user.id,
              ownerId: gear.userId || '',
              startDate,
              endDate,
              status: 'pending',
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
          amount: amount / 100
        }, 'API');

        return NextResponse.json({ 
          rental, 
          clientSecret: paymentIntent.client_secret 
        }, { status: 201 });
      }
    )
  )
);
