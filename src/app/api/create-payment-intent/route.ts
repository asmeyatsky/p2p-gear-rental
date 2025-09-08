import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { AuthenticationError, ValidationError, ApiError, RateLimitError } from '@/lib/api-error-handler'; // Import necessary error classes
import { rateLimitConfig, getClientIdentifier } from '@/lib/rate-limit'; // Import rate limit utilities
import { monitoring } from '@/lib/monitoring'; // Import monitoring instance
import { logger } from '@/lib/logger';
import { createPaymentIntentSchema } from '@/lib/validations/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date();
  let response: NextResponse = new NextResponse();
  let error: string | undefined;
  let statusCode: number = 200; // Default status code

  // Extract client info for monitoring
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const requestSize = request.headers.get('content-length') ?
                     parseInt(request.headers.get('content-length')!) : 0;

  try {
    // Rate Limiting Logic - Use stricter payment rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimiter = rateLimitConfig.payment.limiter;
    const limit = rateLimitConfig.payment.limit;

    try {
      const rateLimitResult = await rateLimiter.check(identifier, limit);
      // Add rate limit headers if possible
      // Note: Headers can only be set on the final NextResponse object
    } catch (err) {
      if (err instanceof RateLimitError) {
        statusCode = err.statusCode;
        throw err; // Re-throw to be caught by the outer error handler
      }
      // If rate limiting fails for other reasons, log and re-throw
      logger.error('Rate limiting error:', { error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    
    // Validate request body with Zod schema
    const validatedData = createPaymentIntentSchema.parse(body);
    const { rentalId, amount, gearTitle } = validatedData;

    // Verify the rental exists and belongs to the user
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        gear: {
          select: {
            title: true,
            dailyRate: true,
            userId: true,
          }
        }
      }
    });

    if (!rental) {
      throw new ValidationError('Rental not found');
    }

    if (rental.renterId !== session.user.id) {
      throw new ValidationError('You are not authorized to pay for this rental');
    }

    if (rental.paymentStatus === 'succeeded') {
      throw new ValidationError('Payment has already been completed for this rental');
    }

    // Calculate expected amount based on rental details
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedAmount = Math.round(days * rental.gear.dailyRate * 100);

    if (Math.abs(amount - expectedAmount) > 100) { // Allow $1 difference for rounding
      throw new ValidationError('Payment amount does not really match rental cost');
    }

    // Create or update payment intent
    let paymentIntent: Stripe.PaymentIntent;

    if (rental.paymentIntentId) {
      // Update existing payment intent
      try {
        paymentIntent = await stripe.paymentIntents.update(rental.paymentIntentId, {
          amount,
          metadata: {
            rentalId,
            gearTitle,
            gearOwnerId: rental.gear.userId,
            renterId: session.user.id,
            startDate: rental.startDate.toString(),
            endDate: rental.endDate.toString(),
          },
        });

        logger.info('Updated existing payment intent', {
          paymentIntentId: paymentIntent.id,
          rentalId,
          amount: amount / 100
        }, 'STRIPE');

      } catch (err) {
        // If update fails, create new payment intent
        logger.warn('Failed to update payment intent, creating new one', {
          rentalId,
          error: err instanceof Error ? err.message : 'Unknown error'
        }, 'STRIPE');

        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            rentalId,
            gearTitle,
            gearOwnerId: rental.gear.userId,
            renterId: session.user.id,
            startDate: rental.startDate.toString(),
            endDate: rental.endDate.toString(),
          },
        });
      }
    } else {
      // Create new payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          rentalId,
          gearTitle,
          gearOwnerId: rental.gear.userId,
          renterId: session.user.id,
          startDate: rental.startDate.toString(),
          endDate: rental.endDate.toString(),
        },
      });

      logger.info('Created new payment intent', {
        paymentIntentId: paymentIntent.id,
        rentalId,
        amount: amount / 100
      }, 'STRIPE');
    }

    // Update rental with payment intent details
    await prisma.rental.update({
      where: { id: rentalId },
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        paymentStatus: paymentIntent.status,
      },
    });

    logger.info('Payment intent created successfully', {
      paymentIntentId: paymentIntent.id,
      rentalId,
      amount: amount / 100,
      userId: session.user.id
    }, 'STRIPE');

    response = NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (err) {
    // Error Handling Logic (from withErrorHandler)
    logger.error('API Error:', { error: err instanceof Error ? err.message : 'Unknown error' }); // Log the error for monitoring

    if (err instanceof ApiError) {
      // Cast to ApiError to access properties
      const apiError = err as ApiError;
      statusCode = apiError.statusCode;
      response = NextResponse.json(
        {
          error: apiError.message,
          code: apiError.code,
          timestamp: new Date().toISOString(), // Add timestamp here
        },
        { status: apiError.statusCode }
      );
    } else if (err instanceof Error) {
      // Don't expose internal error details in production
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;

      statusCode = 500;
      response = NextResponse.json(
        {
          error: message,
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    error = err instanceof Error ? err.message : 'Unknown error'; // Capture error message for monitoring
  } finally {
    // Monitoring Logic (from withMonitoring)
    const responseTime = Date.now() - startTime;
    const responseSize = response.headers.get('content-length') ?
                        parseInt(response.headers.get('content-length')!) : 0;

    monitoring.logRequest({
      method: request.method,
      path: new URL(request.url).pathname,
      statusCode: response.status,
      responseTime,
      timestamp,
      ip,
      userAgent,
      error,
      requestSize,
      responseSize,
    });
  }

  return response;
}