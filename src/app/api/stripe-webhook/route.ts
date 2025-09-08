import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, ValidationError } from '@/lib/api-error-handler';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const POST = withErrorHandler(
  withMonitoring(
    async (req: NextRequest) => {
      const buf = await req.text();
      const sig = req.headers.get('stripe-signature') as string;

      if (!webhookSecret) {
        throw new ValidationError('Stripe webhook secret not configured');
      }

      if (!sig) {
        throw new ValidationError('Missing Stripe signature header');
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
        
        logger.info('Stripe webhook received', { 
          eventType: event.type,
          eventId: event.id 
        }, 'STRIPE');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Stripe webhook verification failed', { 
          error: errorMessage,
          signature: sig?.substring(0, 20) + '...'
        }, 'STRIPE');
        throw new ValidationError(`Webhook verification failed: ${errorMessage}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
          
        case 'payment_intent.payment_failed':
          await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
          
        case 'payment_intent.canceled':
          await handlePaymentCancellation(event.data.object as Stripe.PaymentIntent);
          break;
          
        default:
          logger.warn('Unhandled Stripe webhook event', { 
            eventType: event.type,
            eventId: event.id 
          }, 'STRIPE');
      }

      logger.info('Stripe webhook processed successfully', { 
        eventType: event.type,
        eventId: event.id 
      }, 'STRIPE');

      return NextResponse.json({ received: true });
    }
  )
);

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Processing successful payment', { 
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100
  }, 'STRIPE');

  // Update rental status
  const updatedRentals = await trackDatabaseQuery('rental.updateMany', () =>
    prisma.rental.updateMany({
      where: { paymentIntentId: paymentIntent.id },
      data: { 
        paymentStatus: 'succeeded',
        status: 'approved' // Auto-approve on successful payment
      },
    })
  );

  if (updatedRentals.count === 0) {
    logger.warn('No rentals found for successful payment', { 
      paymentIntentId: paymentIntent.id 
    }, 'STRIPE');
    return;
  }

  // Invalidate related caches
  const rental = await prisma.rental.findFirst({
    where: { paymentIntentId: paymentIntent.id },
    select: { renterId: true, ownerId: true }
  });

  if (rental) {
    await Promise.all([
      CacheManager.del(CacheManager.keys.rental.user(rental.renterId)),
      CacheManager.del(CacheManager.keys.rental.user(rental.ownerId)),
    ]);
  }

  logger.info('Payment success processed', { 
    paymentIntentId: paymentIntent.id,
    updatedRentals: updatedRentals.count
  }, 'STRIPE');
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  logger.warn('Processing failed payment', { 
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    lastPaymentError: paymentIntent.last_payment_error?.message
  }, 'STRIPE');

  // Update rental status
  const updatedRentals = await trackDatabaseQuery('rental.updateMany', () =>
    prisma.rental.updateMany({
      where: { paymentIntentId: paymentIntent.id },
      data: { 
        paymentStatus: 'failed',
        status: 'rejected' // Auto-reject on failed payment
      },
    })
  );

  // Invalidate related caches
  const rental = await prisma.rental.findFirst({
    where: { paymentIntentId: paymentIntent.id },
    select: { renterId: true, ownerId: true }
  });

  if (rental) {
    await Promise.all([
      CacheManager.del(CacheManager.keys.rental.user(rental.renterId)),
      CacheManager.del(CacheManager.keys.rental.user(rental.ownerId)),
    ]);
  }

  logger.info('Payment failure processed', { 
    paymentIntentId: paymentIntent.id,
    updatedRentals: updatedRentals.count
  }, 'STRIPE');
}

async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Processing canceled payment', { 
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100
  }, 'STRIPE');

  // Update rental status
  const updatedRentals = await trackDatabaseQuery('rental.updateMany', () =>
    prisma.rental.updateMany({
      where: { paymentIntentId: paymentIntent.id },
      data: { 
        paymentStatus: 'canceled',
        status: 'canceled'
      },
    })
  );

  // Invalidate related caches
  const rental = await prisma.rental.findFirst({
    where: { paymentIntentId: paymentIntent.id },
    select: { renterId: true, ownerId: true }
  });

  if (rental) {
    await Promise.all([
      CacheManager.del(CacheManager.keys.rental.user(rental.renterId)),
      CacheManager.del(CacheManager.keys.rental.user(rental.ownerId)),
    ]);
  }

  logger.info('Payment cancellation processed', { 
    paymentIntentId: paymentIntent.id,
    updatedRentals: updatedRentals.count
  }, 'STRIPE');
}
