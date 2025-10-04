/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { Rental, Payment, Dispute } from '@/lib/prisma';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/logger');
jest.mock('stripe');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockStripe = jest.mocked(Stripe);

// Mock Stripe instance
const mockStripeInstance = {
  webhooks: {
    constructEvent: jest.fn(),
  },
} as Partial<Stripe>;

describe('API /stripe-webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe.mockImplementation(() => mockStripeInstance as unknown as Stripe);
    
    // Mock environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';
  });

  describe('POST /api/stripe-webhook', () => {
    const mockSignature = 'mock_signature';
    
    it('should handle successful payment intent', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 25000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              rentalId: 'rental-1',
              renterId: 'user-1',
              ownerId: 'user-2'
            }
          }
        }
      };

      const mockRental: Partial<Rental> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'approved',
        totalAmount: 250.00
      };

      const mockUpdatedRental: Partial<Rental & { payments: Partial<Payment>[] }> = {
        ...mockRental,
        status: 'confirmed',
        payments: [
          {
            id: 'payment-1',
            amount: 250.00,
            status: 'completed',
            stripePaymentIntentId: 'pi_test123'
          }
        ]
      };

      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as Stripe.Event);
      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as Rental);
      mockPrisma.rental.update.mockResolvedValue(mockUpdatedRental as Rental);
      mockPrisma.payment.create.mockResolvedValue({ id: 'payment-1' } as Payment);

      const rawBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'Content-Type': 'application/json'
        },
        body: rawBody
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          rentalId: 'rental-1',
          amount: 250.00,
          currency: 'usd',
          status: 'completed',
          stripePaymentIntentId: 'pi_test123',
          processingFee: expect.any(Number),
          platformFee: expect.any(Number)
        }
      });
      expect(mockPrisma.rental.update).toHaveBeenCalledWith({
        where: { id: 'rental-1' },
        data: { 
          status: 'confirmed',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle failed payment intent', async () => {
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test123',
            amount: 25000,
            currency: 'usd',
            status: 'requires_payment_method',
            last_payment_error: {
              message: 'Your card was declined.'
            },
            metadata: {
              rentalId: 'rental-1'
            }
          }
        }
      };

      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as Stripe.Event);
      mockPrisma.payment.create.mockResolvedValue({ id: 'payment-1', status: 'failed' } as Payment);

      const rawBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'Content-Type': 'application/json'
        },
        body: rawBody
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          rentalId: 'rental-1',
          amount: 250.00,
          currency: 'usd',
          status: 'failed',
          stripePaymentIntentId: 'pi_test123',
          failureReason: 'Your card was declined.'
        }
      });
    });

    it('should handle refund events', async () => {
      const mockEvent = {
        type: 'charge.dispute.created',
        data: {
          object: {
            id: 'dp_test123',
            amount: 25000,
            currency: 'usd',
            reason: 'fraudulent',
            charge: 'ch_test123',
            metadata: {
              rentalId: 'rental-1'
            }
          }
        }
      };

      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as Stripe.Event);
      mockPrisma.dispute.create.mockResolvedValue({ id: 'dispute-1' } as Dispute);

      const rawBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'Content-Type': 'application/json'
        },
        body: rawBody
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.dispute.create).toHaveBeenCalled();
    });

    it('should reject requests without valid signature', async () => {
      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid_signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle unhandled event types gracefully', async () => {
      const mockEvent = {
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_test123'
          }
        }
      };

      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as Stripe.Event);

      const rawBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'Content-Type': 'application/json'
        },
        body: rawBody
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle missing rental metadata', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 25000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {} // Missing rentalId
          }
        }
      };

      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as Stripe.Event);

      const rawBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'Content-Type': 'application/json'
        },
        body: rawBody
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 25000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              rentalId: 'rental-1'
            }
          }
        }
      };

      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as Stripe.Event);
      mockPrisma.rental.findUnique.mockRejectedValue(new Error('Database error'));

      const rawBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'Content-Type': 'application/json'
        },
        body: rawBody
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle non-existent rental', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 25000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              rentalId: 'non-existent-rental'
            }
          }
        }
      };

      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as Stripe.Event);
      mockPrisma.rental.findUnique.mockResolvedValue(null);

      const rawBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'Content-Type': 'application/json'
        },
        body: rawBody
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should calculate platform and processing fees correctly', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 25000, // $250.00
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              rentalId: 'rental-1'
            }
          }
        }
      };

      const mockRental: Partial<Rental> = {
        id: 'rental-1',
        totalAmount: 250.00
      };

      (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as Stripe.Event);
      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as Rental);
      mockPrisma.rental.update.mockResolvedValue(mockRental as Rental);
      mockPrisma.payment.create.mockResolvedValue({} as Payment);

      const rawBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/stripe-webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'Content-Type': 'application/json'
        },
        body: rawBody
      });

      await POST(request);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 250.00,
          processingFee: 7.55, // 2.9% + $0.30
          platformFee: 12.50   // 5% platform fee
        })
      });
    });
  });
});