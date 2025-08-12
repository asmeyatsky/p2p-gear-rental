import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-11-20.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret as string);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook Error: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntentSucceeded.amount} was successful!`);
      // Update your database to reflect successful payment
      await prisma.rental.updateMany({
        where: { paymentIntentId: paymentIntentSucceeded.id },
        data: { paymentStatus: 'succeeded' },
      });
      break;
    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntentFailed.amount} failed!`);
      // Update your database to reflect failed payment
      await prisma.rental.updateMany({
        where: { paymentIntentId: paymentIntentFailed.id },
        data: { paymentStatus: 'failed' },
      });
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
