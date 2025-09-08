import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  rentalId: z.string()
    .min(1, 'Rental ID is required')
    .trim(),
  
  amount: z.number()
    .int('Amount must be a whole number (in cents)')
    .min(50, 'Amount must be at least $0.50')
    .max(500000, 'Amount cannot exceed $5,000'),
  
  gearTitle: z.string()
    .min(1, 'Gear title is required')
    .max(100, 'Gear title must be less than 100 characters')
    .trim(),
});

export const webhookEventSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.string(),
  data: z.object({
    object: z.unknown(),
  }),
  created: z.number(),
  livemode: z.boolean(),
});

export const paymentStatusUpdateSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID is required'),
  status: z.enum(['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'requires_capture', 'canceled']),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type PaymentStatusUpdate = z.infer<typeof paymentStatusUpdateSchema>;