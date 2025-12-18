/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Rental, Payment, Dispute } from '@/lib/prisma';

// Mock all dependencies with factory functions
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    }
  }));
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    rental: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    }
  }
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

// Mock middlewares to bypass the complex middleware chain
jest.mock('@/lib/api-error-handler', () => ({
  withErrorHandler: (fn) => fn,
  ValidationError: class ValidationError extends Error {}
}));

jest.mock('@/lib/monitoring', () => ({
  withMonitoring: (fn) => fn,
  trackDatabaseQuery: jest.fn().mockImplementation((_, queryFn) => queryFn())
}));

// Import after mocking
import { POST } from '../route';

const mockPrisma = require('@/lib/prisma').prisma;
const mockStripe = require('stripe');

// Mock Stripe instance that will be returned by the constructor
let mockStripeInstance;

describe('API /stripe-webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
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

      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent),
        }
      }));
      mockPrisma.rental.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.rental.findFirst.mockResolvedValue({ renterId: 'user-1', ownerId: 'user-2' });

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
      expect(mockPrisma.rental.updateMany).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_test123' },
        data: {
          paymentStatus: 'succeeded',
          status: 'CONFIRMED'
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

      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent),
        }
      }));
      mockPrisma.rental.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.rental.findFirst.mockResolvedValue({ renterId: 'user-1', ownerId: 'user-2' });

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
      expect(mockPrisma.rental.updateMany).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_test123' },
        data: {
          paymentStatus: 'failed',
          status: 'CANCELLED'
        }
      });
    });

    it('should handle refund events', async () => {
      const mockEvent = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_test123',
            amount: 25000,
            currency: 'usd',
            status: 'canceled',
            metadata: {
              rentalId: 'rental-1'
            }
          }
        }
      };

      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent),
        }
      }));
      mockPrisma.rental.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.rental.findFirst.mockResolvedValue({ renterId: 'user-1', ownerId: 'user-2' });

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
      expect(mockPrisma.rental.updateMany).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_test123' },
        data: {
          paymentStatus: 'canceled',
          status: 'CANCELLED'
        }
      });
    });

    it('should reject requests without valid signature', async () => {
      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error('Invalid signature');
          }),
        }
      }));

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

      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent),
        }
      }));
      mockPrisma.rental.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.rental.findFirst.mockResolvedValue({ renterId: 'user-1', ownerId: 'user-2' });

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

      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent),
        }
      }));
      mockPrisma.rental.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.rental.findFirst.mockResolvedValue({ renterId: 'user-1', ownerId: 'user-2' });

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

      // Route processes the event even without rental metadata
      expect(response.status).toBe(200);
      expect(mockPrisma.rental.updateMany).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_test123' },
        data: {
          paymentStatus: 'succeeded',
          status: 'CONFIRMED'
        }
      });
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

      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent),
        }
      }));
      mockPrisma.rental.updateMany.mockRejectedValue(new Error('Database error'));

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

      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent),
        }
      }));
      mockPrisma.rental.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.rental.findFirst.mockResolvedValue({ renterId: 'user-1', ownerId: 'user-2' });

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

      // The route still returns 200 even if no rentals match the payment intent ID
      expect(response.status).toBe(200);
    });

    it('should handle payment intent with proper event processing', async () => {
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

      mockStripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent),
        }
      }));
      mockPrisma.rental.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.rental.findFirst.mockResolvedValue({ renterId: 'user-1', ownerId: 'user-2' });

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

      expect(mockPrisma.rental.updateMany).toHaveBeenCalledWith({
        where: { paymentIntentId: 'pi_test123' },
        data: {
          paymentStatus: 'succeeded',
          status: 'CONFIRMED'
        }
      });
    });
  });
});