/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import type { Rental, Payment, Dispute } from '@prisma/client';

// Store for the mock implementation that tests can modify
let mockConstructEventImpl: jest.Mock = jest.fn();

// Mock all dependencies with factory functions
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      get constructEvent() {
        return mockConstructEventImpl;
      }
    }
  }));
});

jest.mock('@/lib/db', () => ({
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

// Mock cache
jest.mock('@/lib/cache', () => ({
  CacheManager: {
    del: jest.fn().mockResolvedValue(true),
    keys: {
      rental: {
        user: (id: string) => `rental:user:${id}`,
      }
    }
  }
}));

// Mock middlewares - withErrorHandler needs to catch errors and return proper responses
jest.mock('@/lib/api-error-handler', () => {
  class ValidationError extends Error {
    statusCode = 400;
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }

  return {
    withErrorHandler: (fn: Function) => async (req: any) => {
      try {
        return await fn(req);
      } catch (error: any) {
        const status = error.statusCode || 500;
        return new Response(
          JSON.stringify({ error: error.message }),
          { status, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },
    ValidationError
  };
});

jest.mock('@/lib/monitoring', () => ({
  withMonitoring: (fn: Function) => fn,
  trackDatabaseQuery: jest.fn().mockImplementation((_: string, queryFn: Function) => queryFn())
}));

// Import after mocking
import { POST } from '../route';

const mockPrisma = require('@/lib/db').prisma;

describe('API /stripe-webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConstructEventImpl = jest.fn();

    // Mock environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';
  });

  describe('POST /api/stripe-webhook', () => {
    const mockSignature = 'mock_signature';

    it('should handle successful payment intent', async () => {
      const mockEvent = {
        id: 'evt_test123',
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

      mockConstructEventImpl.mockReturnValue(mockEvent);
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
        id: 'evt_test123',
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

      mockConstructEventImpl.mockReturnValue(mockEvent);
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
        id: 'evt_test123',
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

      mockConstructEventImpl.mockReturnValue(mockEvent);
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
      mockConstructEventImpl.mockImplementation(() => {
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
        id: 'evt_test123',
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_test123'
          }
        }
      };

      mockConstructEventImpl.mockReturnValue(mockEvent);

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
        id: 'evt_test123',
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

      mockConstructEventImpl.mockReturnValue(mockEvent);
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
        id: 'evt_test123',
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

      mockConstructEventImpl.mockReturnValue(mockEvent);
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
        id: 'evt_test123',
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

      mockConstructEventImpl.mockReturnValue(mockEvent);
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
        id: 'evt_test123',
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

      mockConstructEventImpl.mockReturnValue(mockEvent);
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
