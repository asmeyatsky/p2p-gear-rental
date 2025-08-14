import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from './route'; // Assuming GET and POST are exported from route.ts
import { PUT as approvePUT } from './[id]/approve/route';
import { PUT as rejectPUT } from './[id]/reject/route';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

// Mock Supabase, Prisma, and Stripe
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    rental: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    gear: {
      findUnique: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
  },
}));

const mockPaymentIntents = {
  create: jest.fn(),
};

const mockWebhooks = {
  constructEvent: jest.fn(),
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: mockPaymentIntents,
    webhooks: mockWebhooks,
  }));
});

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
    },
  },
};

const mockOwnerSession = {
  user: {
    id: 'owner-user-id',
    email: 'owner@example.com',
    user_metadata: {
      full_name: 'Owner User',
    },
  },
};

const mockGear = {
  id: 'gear-123',
  title: 'Test Gear',
  description: 'A test gear item',
  dailyRate: 10.0,
  city: 'Test City',
  state: 'TS',
  images: ['/image1.jpg'],
  category: 'cameras',
  userId: 'owner-user-id',
};

const mockRental = {
  id: 'rental-123',
  gearId: mockGear.id,
  renterId: mockSession.user.id,
  ownerId: mockGear.userId,
  startDate: '2025-08-15',
  endDate: '2025-08-17',
  status: 'pending',
  message: 'I would like to rent this.',
  paymentIntentId: 'pi_test_123',
  clientSecret: 'cs_test_123',
  paymentStatus: 'requires_payment_method',
};

const mockApprovedRental = {
  ...mockRental,
  status: 'approved',
  message: 'Approved!',
};

const mockRejectedRental = {
  ...mockRental,
  status: 'rejected',
  message: 'Rejected!',
};

describe('Rentals API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
  });

  describe('POST /api/rentals', () => {
    it('should return 401 if not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      const request = new NextRequest('http://localhost/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if required fields are missing', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });

      const request = new NextRequest('http://localhost/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gearId: 'gear-123' }), // Missing dates
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Missing required fields' });
    });

    it('should return 400 if dates are invalid', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });

      const request = new NextRequest('http://localhost/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gearId: 'gear-123',
          startDate: '2025-08-17',
          endDate: '2025-08-15', // End date before start date
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid dates provided' });
    });

    it('should return 404 if gear not found', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gearId: 'non-existent-gear',
          startDate: '2025-08-15',
          endDate: '2025-08-17',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Gear not found' });
    });

    it('should return 400 if user tries to rent their own gear', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue({ ...mockGear, userId: mockSession.user.id });

      const request = new NextRequest('http://localhost/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gearId: mockGear.id,
          startDate: '2025-08-15',
          endDate: '2025-08-17',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Cannot rent your own gear' });
    });

    it('should create a rental and payment intent on success', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(mockGear);
      (prisma.rental.create as jest.Mock).mockResolvedValue(mockRental);
      mockPaymentIntents.create.mockResolvedValue({
        id: mockRental.paymentIntentId,
        client_secret: mockRental.clientSecret,
        status: mockRental.paymentStatus,
      });

      const request = new NextRequest('http://localhost/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gearId: mockGear.id,
          startDate: mockRental.startDate,
          endDate: mockRental.endDate,
          message: mockRental.message,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody.rental).toEqual(mockRental);
      expect(responseBody.clientSecret).toEqual(mockRental.clientSecret);

      expect(prisma.rental.create).toHaveBeenCalledWith({
        data: {
          gearId: mockGear.id,
          renterId: mockSession.user.id,
          ownerId: mockGear.userId,
          startDate: mockRental.startDate,
          endDate: mockRental.endDate,
          status: 'pending',
          message: mockRental.message,
          paymentIntentId: mockRental.paymentIntentId,
          clientSecret: mockRental.clientSecret,
          paymentStatus: mockRental.paymentStatus,
        },
      });
      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount: Math.round(mockGear.dailyRate * 2 * 100), // 2 days * 10.0 dailyRate * 100 cents
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          gearId: mockGear.id,
          renterId: mockSession.user.id,
          ownerId: mockGear.userId,
          startDate: mockRental.startDate,
          endDate: mockRental.endDate,
        },
      });
    });
  });

  describe('GET /api/rentals', () => {
    it('should return 401 if not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      const request = new NextRequest('http://localhost/api/rentals');
      const response = await GET(request);
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('should return rentals for the authenticated user (renter or owner)', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.rental.findMany as jest.Mock).mockResolvedValue([mockRental]);

      const request = new NextRequest('http://localhost/api/rentals');
      const response = await GET(request);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([mockRental]);
      expect(prisma.rental.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { renterId: mockSession.user.id },
            { ownerId: mockSession.user.id },
          ],
        },
        include: {
          gear: true,
          renter: { select: { id: true, email: true, full_name: true } },
          owner: { select: { id: true, email: true, full_name: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('PUT /api/rentals/[id]/approve', () => {
    it('should return 401 if not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      const request = new NextRequest(`http://localhost/api/rentals/${mockRental.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await approvePUT(request, { params: Promise.resolve({ id: mockRental.id }) });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if rental not found', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockOwnerSession } });
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/rentals/non-existent-id/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await approvePUT(request, { params: Promise.resolve({ id: 'non-existent-id' }) });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Rental request not found' });
    });

    it('should return 403 if user is not the owner', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } }); // Renter session
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);

      const request = new NextRequest(`http://localhost/api/rentals/${mockRental.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await approvePUT(request, { params: Promise.resolve({ id: mockRental.id }) });
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Forbidden: You are not the owner of this rental request' });
    });

    it('should return 400 if rental is not pending', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockOwnerSession } });
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockApprovedRental); // Already approved

      const request = new NextRequest(`http://localhost/api/rentals/${mockRental.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await approvePUT(request, { params: Promise.resolve({ id: mockRental.id }) });
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Rental request is already approved' });
    });

    it('should approve rental and update status', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockOwnerSession } });
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.rental.update as jest.Mock).mockResolvedValue(mockApprovedRental);

      const request = new NextRequest(`http://localhost/api/rentals/${mockRental.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Approved!' }),
      });

      const response = await approvePUT(request, { params: Promise.resolve({ id: mockRental.id }) });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(mockApprovedRental);
      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: mockRental.id },
        data: { status: 'approved', message: 'Approved!' },
      });
    });
  });

  describe('PUT /api/rentals/[id]/reject', () => {
    it('should return 401 if not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      const request = new NextRequest(`http://localhost/api/rentals/${mockRental.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await rejectPUT(request, { params: Promise.resolve({ id: mockRental.id }) });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if rental not found', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockOwnerSession } });
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/rentals/non-existent-id/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await rejectPUT(request, { params: Promise.resolve({ id: 'non-existent-id' }) });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Rental request not found' });
    });

    it('should return 403 if user is not the owner', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } }); // Renter session
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);

      const request = new NextRequest(`http://localhost/api/rentals/${mockRental.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await rejectPUT(request, { params: Promise.resolve({ id: mockRental.id }) });
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Forbidden: You are not the owner of this rental request' });
    });

    it('should return 400 if rental is not pending', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockOwnerSession } });
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockApprovedRental); // Already approved

      const request = new NextRequest(`http://localhost/api/rentals/${mockRental.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await rejectPUT(request, { params: Promise.resolve({ id: mockRental.id }) });
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Rental request is already approved' });
    });

    it('should reject rental and update status', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockOwnerSession } });
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.rental.update as jest.Mock).mockResolvedValue(mockRejectedRental);

      const request = new NextRequest(`http://localhost/api/rentals/${mockRental.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Rejected!' }),
      });

      const response = await rejectPUT(request, { params: Promise.resolve({ id: mockRental.id }) });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(mockRejectedRental);
      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: mockRental.id },
        data: { status: 'rejected', message: 'Rejected!' },
      });
    });
  });
});