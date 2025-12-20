/**
 * @jest-environment node
 */

// Set environment variables before importing modules
process.env.STRIPE_SECRET_KEY = 'sk_test_12345';

// Define mock functions first
const mockPaymentIntentsCreate = jest.fn();
const mockPaymentIntentsUpdate = jest.fn();

// Mock Stripe at the top level before other imports
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      update: mockPaymentIntentsUpdate,
    },
  }));
});

// Mock next/server with inline class definitions
jest.mock('next/server', () => {
  class MockHeaders {
    private _headers: Map<string, string>;
    constructor(init: Record<string, string> = {}) {
      this._headers = new Map();
      for (const [key, value] of Object.entries(init || {})) {
        this._headers.set(key.toLowerCase(), value);
      }
    }
    get(name: string) { return this._headers.get(name.toLowerCase()) || null; }
    set(name: string, value: string) { this._headers.set(name.toLowerCase(), value); }
    has(name: string) { return this._headers.has(name.toLowerCase()); }
    entries() { return this._headers.entries(); }
  }

  class MockNextResponse {
    body: string | null;
    status: number;
    headers: MockHeaders;
    ok: boolean;
    _jsonBody?: unknown;

    constructor(body: string | null = null, init: { status?: number; headers?: Record<string, string> } = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = new MockHeaders(init.headers || {});
      this.ok = this.status >= 200 && this.status < 300;
    }

    static json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
      const response = new MockNextResponse(JSON.stringify(body), {
        ...init,
        headers: { 'content-type': 'application/json', ...init.headers }
      });
      response._jsonBody = body;
      return response;
    }

    async json() {
      if (this._jsonBody !== undefined) return this._jsonBody;
      try { return JSON.parse(this.body || '{}'); } catch { return {}; }
    }
  }

  return {
    NextRequest: jest.requireActual('next/server').NextRequest,
    NextResponse: MockNextResponse
  };
});

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';
import { User, Rental, Gear } from '@prisma/client';
import { Session } from '@supabase/supabase-js';

// Mock dependencies first
jest.mock('@/lib/prisma');
jest.mock('@/lib/supabase');
jest.mock('@/lib/logger');
jest.mock('@/lib/rate-limit');
jest.mock('@/lib/monitoring');

// Import after mocks are set up
import { POST } from '../route';

const mockPrisma = jest.mocked(prisma);
const mockSupabase = jest.mocked(supabase);

describe('API /create-payment-intent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock functions
    mockPaymentIntentsCreate.mockClear();
    mockPaymentIntentsUpdate.mockClear();
  });

  describe('POST /api/create-payment-intent', () => {
    const validPaymentData = {
      rentalId: 'rental-1',
      amount: 25000, // $250.00 (5 days * $50/day)
      gearTitle: 'Test Gear Title'
    };

    const mockUser: Partial<User> = {
      id: 'user-1',
      email: 'renter@example.com',
      full_name: 'Test Renter',
      averageRating: 0,
      totalReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeAccountId: null,
      stripeAccountStatus: null,
      bio: null,
      city: null,
      state: null,
      completedRentals: 0,
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
      // Mock authenticated user
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null
      });

      // Mock user upsert
      (mockPrisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should create payment intent for valid rental', async () => {
      // Calculate expected amount: 5 days * $50/day * 100 (for cents) = 25000 cents = $250.00
      const mockRental: Partial<Rental & { gear: Partial<Gear> }> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'APPROVED',
        totalPrice: 250.00,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-06'), // 5 days (Dec 1-5 inclusive)
        gear: {
          id: 'gear-1',
          title: 'Test Camera',
          dailyRate: 50, // $50 per day
          userId: 'user-2' // gear owner ID
        }
      };

      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 25000,
        currency: 'usd',
        status: 'requires_payment_method'
      };

      (mockPrisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental as Rental);
      mockPaymentIntentsCreate.mockResolvedValue(mockPaymentIntent);
      (mockPrisma.rental.update as jest.Mock).mockResolvedValue({
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

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
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
          startDate: mockRental.startDate.toString(),
          endDate: mockRental.endDate.toString(),
        }
      });
    });

    it('should prevent payment for non-approved rentals', async () => {
      const mockRental: Partial<Rental & { gear: Partial<Gear> }> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'PENDING', // Not approved
        totalPrice: 250.00,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-06'), // 5 days
        gear: {
          id: 'gear-1',
          dailyRate: 50, // $50 per day
          userId: 'user-2'
        }
      };

      (mockPrisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental as Rental);

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should prevent payment by non-renter', async () => {
      const mockRental: Partial<Rental> = {
        id: 'rental-1',
        renterId: 'user-2', // Different user
        ownerId: 'user-3',
        status: 'APPROVED',
        totalPrice: 250.00
      };

      (mockPrisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental as Rental);

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should handle non-existent rental', async () => {
      (mockPrisma.rental.findUnique as jest.Mock).mockResolvedValue(null);

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
        totalPrice: 300.00, // Different amount
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-06'), // 5 days
        gear: {
          id: 'gear-1',
          dailyRate: 60, // Different rate: 5 days * $60 = $300
          userId: 'user-2'
        }
      };

      (mockPrisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental as Rental);

      // Use an amount that doesn't match the calculated amount (5 * 60 * 100 = 30000)
      const wrongAmountData = {
        ...validPaymentData,
        amount: 25000 // This doesn't match 30000
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
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
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
        rentalId: '', // Empty rentalId
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
        amount: -100 // Negative amount
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

      (mockPrisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental as Rental);
      mockPaymentIntentsCreate.mockRejectedValue(
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
      (mockPrisma.rental.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPaymentData)
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should prevent duplicate payment intents for same rental', async () => {
      // Rental already has payment completed
      const mockRental: Partial<Rental & { gear: Partial<Gear> }> = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'APPROVED',
        totalPrice: 250.00,
        paymentIntentId: 'pi_existing123',
        paymentStatus: 'succeeded', // Payment already completed
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-06'), // 5 days
        gear: {
          id: 'gear-1',
          dailyRate: 50, // $50 per day
          userId: 'user-2'
        }
      };

      (mockPrisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental as Rental);

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
