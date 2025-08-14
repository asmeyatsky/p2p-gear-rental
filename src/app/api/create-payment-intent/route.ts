import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-11-20.acacia' as any,
});

export const POST = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest) => {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          throw new AuthenticationError();
        }

        const body = await request.json();
        const { rentalId, amount, gearTitle } = body;

        if (!rentalId || !amount || !gearTitle) {
          throw new ValidationError('Missing required fields: rentalId, amount, gearTitle');
        }

        if (amount < 50) { // Minimum $0.50
          throw new ValidationError('Amount must be at least $0.50');
        }

        if (amount > 500000) { // Maximum $5,000
          throw new ValidationError('Amount cannot exceed $5,000');
        }

        try {
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
            throw new ValidationError('Payment amount does not match rental cost');
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

            } catch (error) {
              // If update fails, create new payment intent
              logger.warn('Failed to update payment intent, creating new one', {
                rentalId,
                error: error instanceof Error ? error.message : 'Unknown error'
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

          return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
          });

        } catch (error) {
          logger.error('Payment intent creation failed', {
            rentalId,
            amount: amount / 100,
            userId: session.user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'STRIPE');

          if (error instanceof ValidationError) {
            throw error;
          }

          throw new Error('Failed to create payment intent. Please try again.');
        }
      }
    )
  )
);