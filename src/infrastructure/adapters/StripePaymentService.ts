import Stripe from 'stripe';
import { IPaymentService } from '../../domain/ports/external-services';

export class StripePaymentService implements IPaymentService {
  private stripe: Stripe;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Missing Stripe secret key');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-07-30.basil',
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<{ id: string; clientSecret: string }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata || {},
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent.status === 'succeeded';
    } catch (error) {
      console.error('Error confirming payment:', error);
      return false;
    }
  }

  async refundPayment(paymentIntentId: string): Promise<boolean> {
    try {
      await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
      return true;
    } catch (error) {
      console.error('Error processing refund:', error);
      return false;
    }
  }
}