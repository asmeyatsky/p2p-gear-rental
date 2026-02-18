/**
 * @jest-environment node
 */

// Set environment variables before importing modules
process.env.STRIPE_SECRET_KEY = 'sk_test_12345';

// Mock Stripe - define mocks inside factory to avoid hoisting issues
jest.mock('stripe', () => {
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const MockStripe = jest.fn(() => ({
    paymentIntents: { create: mockCreate, update: mockUpdate },
  }));
  MockStripe._mocks = { create: mockCreate, update: mockUpdate };
  return MockStripe;
});

// Override next/server mock to provide constructable NextResponse
jest.mock('next/server', () => {
  class MockHeaders {
    constructor(init) {
      this._headers = new Map();
      if (init) {
        for (const [key, value] of Object.entries(init)) {
          this._headers.set(key.toLowerCase(), value);
        }
      }
    }
    get(name) { return this._headers.get(name.toLowerCase()) || null; }
    set(name, value) { this._headers.set(name.toLowerCase(), value); }
    has(name) { return this._headers.has(name.toLowerCase()); }
    entries() { return this._headers.entries(); }
  }

  class MockNextResponse {
    constructor(body, init) {
      this.body = body || null;
      this.status = (init && init.status) || 200;
      this.headers = new MockHeaders((init && init.headers) || {});
      this.ok = this.status >= 200 && this.status < 300;
    }
    static json(body, init) {
      const response = new MockNextResponse(JSON.stringify(body), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init && init.headers) }
      });
      response._jsonBody = body;
      return response;
    }
    async json() {
      if (this._jsonBody !== undefined) return this._jsonBody;
      try { return JSON.parse(this.body || '{}'); } catch (e) { return {}; }
    }
  }

  return {
    NextRequest: jest.requireActual('next/server').NextRequest,
    NextResponse: MockNextResponse,
  };
});

// Mock session controller
const mockGetSession = jest.fn();

// Mock api-error-handler with full class hierarchy (route uses instanceof checks)
jest.mock('@/lib/api-error-handler', () => {
  class ApiError extends Error {
    constructor(message, statusCode, code) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.name = 'ApiError';
    }
  }
  class ValidationError extends ApiError {
    constructor(message) { super(message, 400, 'VALIDATION_ERROR'); this.name = 'ValidationError'; }
  }
  class AuthenticationError extends ApiError {
    constructor(message) { super(message, 401, 'AUTHENTICATION_ERROR'); this.name = 'AuthenticationError'; }
  }
  class AuthorizationError extends ApiError {
    constructor(message) { super(message, 403, 'AUTHORIZATION_ERROR'); this.name = 'AuthorizationError'; }
  }
  class NotFoundError extends ApiError {
    constructor(message) { super(message, 404, 'NOT_FOUND'); this.name = 'NotFoundError'; }
  }
  class RateLimitError extends ApiError {
    constructor(message) { super(message, 429, 'RATE_LIMIT_ERROR'); this.name = 'RateLimitError'; }
  }
  return {
    ApiError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    withErrorHandler: (fn) => fn,
  };
});

jest.mock('@/lib/auth-middleware', () => {
  const { AuthenticationError } = require('@/lib/api-error-handler');
  return {
    authenticateRequest: jest.fn(async () => {
      const { data, error } = await mockGetSession();
      if (error || !data.session) {
        throw new AuthenticationError('Authentication required');
      }
      return { user: data.session.user, session: data.session };
    }),
  };
});

jest.mock('@/lib/db', () => ({
  prisma: {
    rental: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger');
jest.mock('@/lib/rate-limit', () => ({
  rateLimitConfig: {
    payment: {
      limiter: { check: jest.fn() },
      limit: 10,
    },
  },
  getClientIdentifier: jest.fn(() => 'test-ip'),
}));
jest.mock('@/lib/monitoring', () => ({
  monitoring: { logRequest: jest.fn() },
}));

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { User, Rental, Gear } from '@prisma/client';
import { Session } from '@supabase/supabase-js';

// Import after mocks are set up
import { POST } from '../route';

const mockPrisma = require('@/lib/db').prisma;
const MockedStripe = require('stripe');
const mockPaymentIntents = MockedStripe._mocks;

describe('API /create-payment-intent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/create-payment-intent', () => {
    const validPaymentData = {
      rentalId: 'rental-1',
      amount: 25000, // $250.00 (5 days * $50/day)
      gearTitle: 'Test Gear Title'
    };

    const mockSession: Partial<Session> = {
      user: {
        id: 'user-1',
        email: 'renter@example.com',
        user_metadata: { full_name: 'Test Renter' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }
    };

    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: mockSession as Session },
        error: null
      });
    });

    it('should create payment intent for valid rental', async () => {
      const mockRental: Partial<Rental & { gear: Partial<Gear> }> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'APPROVED',
        totalPrice: 250.00,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-06'),
        gear: {
          id: 'gear-1',
          title: 'Test Camera',
          dailyRate: 50,
          userId: 'user-2'
        }
      };

      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 25000,
        currency: 'usd',
        status: 'requires_payment_method'
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as Rental);
      mockPaymentIntents.create.mockResolvedValue(mockPaymentIntent);
      mockPrisma.rental.update.mockResolvedValue({
        ...mockRental,
        paymentIntentId: 'pi_test123',
        clientSecret: 'pi_test123_secret',
        paymentStatus: 'requires_payment_method'
      });

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.clientSecret).toBe('pi_test123_secret');
      expect(data.paymentIntentId).toBe('pi_test123');

      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount: 25000,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          rentalId: 'rental-1',
          gearTitle: 'Test Gear Title',
          gearOwnerId: 'user-2',
          renterId: 'user-1',
          startDate: mockRental.startDate!.toString(),
          endDate: mockRental.endDate!.toString(),
        }
      });
    });

    it('should allow payment for pending rentals (no status check)', async () => {
      const mockRental: Partial<Rental & { gear: Partial<Gear> }> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'PENDING',
        totalPrice: 250.00,
        paymentStatus: null,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-06'),
        gear: {
          id: 'gear-1',
          title: 'Test Gear',
          dailyRate: 50,
          userId: 'user-2'
        }
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as Rental);
      mockPaymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'cs_test_secret',
        status: 'requires_payment_method',
      });

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPaymentIntents.create).toHaveBeenCalled();
    });

    it('should prevent payment by non-renter', async () => {
      const mockRental: Partial<Rental> = {
        id: 'rental-1',
        renterId: 'user-2',
        ownerId: 'user-3',
        status: 'APPROVED',
        totalPrice: 250.00
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as Rental);

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should handle non-existent rental', async () => {
      mockPrisma.rental.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should validate amount matches rental total', async () => {
      const mockRental: Partial<Rental & { gear: Partial<Gear> }> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'APPROVED',
        totalPrice: 300.00,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-06'),
        gear: {
          id: 'gear-1',
          dailyRate: 60,
          userId: 'user-2'
        }
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as Rental);

      const wrongAmountData = {
        ...validPaymentData,
        amount: 25000 // Doesn't match 5 * 60 * 100 = 30000
      };

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wrongAmountData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        rentalId: '',
        amount: 25000,
        gearTitle: 'Test Gear Title'
      };

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate amount is positive', async () => {
      const invalidData = {
        ...validPaymentData,
        amount: -100
      };

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle Stripe errors', async () => {
      const mockRental: Partial<Rental> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'APPROVED',
        totalPrice: 250.00
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as Rental);
      mockPaymentIntents.create.mockRejectedValue(
        new Error('Your card was declined')
      );

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle database errors', async () => {
      mockPrisma.rental.findUnique.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should prevent duplicate payment intents for same rental', async () => {
      const mockRental: Partial<Rental & { gear: Partial<Gear> }> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'APPROVED',
        totalPrice: 250.00,
        paymentIntentId: 'pi_existing123',
        paymentStatus: 'succeeded',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-06'),
        gear: {
          id: 'gear-1',
          dailyRate: 50,
          userId: 'user-2'
        }
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as Rental);

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
