/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import type { User, Rental, Gear } from '@prisma/client';
import { Session } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/supabase');
jest.mock('@/lib/cache');
jest.mock('@/lib/logger');
jest.mock('@/lib/monitoring');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('API /rentals', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    averageRating: 0,
    totalReviews: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeCustomerId: null,
    lastLogin: null,
    isOnline: false,
    bio: null,
    location: null,
    website: null,
    avatarUrl: null,
  };

  const mockSession: Partial<Session> = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rentals', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession as Session },
        error: null
      });
    });

    it('should return user rentals', async () => {
      const mockRentals: (Rental & { gear: Gear & { user: User }, renter: User, payments: unknown[] })[] = [
        {
          id: 'rental-1',
          gearId: 'gear-1',
          renterId: 'user-1',
          ownerId: 'user-2',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-05'),
          status: 'PENDING',
          message: null,
          paymentIntentId: null,
          clientSecret: null,
          paymentStatus: null,
          totalAmount: 250,
          createdAt: new Date(),
          updatedAt: new Date(),
          gear: {
            id: 'gear-1',
            title: 'Test Camera',
            images: ['image1.jpg'],
            dailyRate: 50,
            user: {
              id: 'user-2',
              full_name: 'Owner User',
              email: 'owner@example.com',
              averageRating: 0,
              totalReviews: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              stripeCustomerId: null,
              lastLogin: null,
              isOnline: false,
              bio: null,
              location: null,
              website: null,
              avatarUrl: null,
            },
            description: '',
            weeklyRate: null,
            monthlyRate: null,
            city: '',
            state: '',
            category: null,
            brand: null,
            model: null,
            condition: null,
            userId: 'user-2',
          },
          renter: mockUser,
          payments: []
        }
      ];

      mockPrisma.rental.findMany.mockResolvedValue(mockRentals);

      const request = new NextRequest('http://localhost:3000/api/rentals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('rental-1');
      expect(data[0].gear.title).toBe('Test Camera');
    });

    it('should filter rentals by status', async () => {
      mockPrisma.rental.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/rentals?status=approved');
      await GET(request);

      expect(mockPrisma.rental.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              expect.objectContaining({
                OR: [
                  { renterId: 'user-1' },
                  { ownerId: 'user-1' }
                ]
              }),
              { status: 'APPROVED' }
            ]
          })
        })
      );
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/rentals');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/rentals', () => {
    const validRentalData = {
      gearId: 'gear-1',
      startDate: '2024-12-01T00:00:00.000Z',
      endDate: '2024-12-05T00:00:00.000Z',
      message: 'I would like to rent this camera for a wedding shoot.'
    };

    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession as Session },
        error: null
      });

      // Mock user upsert
      mockPrisma.user.upsert.mockResolvedValue(mockUser);
    });

    it('should create rental request with valid data', async () => {
      const mockGear: Gear = {
        id: 'gear-1',
        title: 'Test Camera',
        userId: 'user-2', // Different owner
        dailyRate: 50,
        description: '',
        weeklyRate: null,
        monthlyRate: null,
        images: [],
        city: '',
        state: '',
        category: null,
        brand: null,
        model: null,
        condition: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreatedRental: Rental & { gear: Gear, renter: User } = {
        id: 'rental-1',
        gearId: 'gear-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        startDate: new Date(validRentalData.startDate),
        endDate: new Date(validRentalData.endDate),
        status: 'PENDING',
        message: validRentalData.message,
        paymentIntentId: null,
        clientSecret: null,
        paymentStatus: null,
        totalAmount: 250,
        createdAt: new Date(),
        updatedAt: new Date(),
        gear: mockGear,
        renter: mockUser
      };

      mockPrisma.gear.findUnique.mockResolvedValue(mockGear);
      mockPrisma.rental.findFirst.mockResolvedValue(null); // No conflicting rentals
      mockPrisma.rental.create.mockResolvedValue(mockCreatedRental);

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRentalData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('rental-1');
      expect(data.status).toBe('pending');
    });

    it('should prevent users from renting their own gear', async () => {
      const mockGear: Gear = {
        id: 'gear-1',
        title: 'Test Camera',
        userId: 'user-1', // Same as authenticated user
        dailyRate: 50,
        description: '',
        weeklyRate: null,
        monthlyRate: null,
        images: [],
        city: '',
        state: '',
        category: null,
        brand: null,
        model: null,
        condition: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.gear.findUnique.mockResolvedValue(mockGear);

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRentalData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should prevent booking unavailable gear', async () => {
      const mockGear: Gear = {
        id: 'gear-1',
        title: 'Test Camera',
        userId: 'user-2',
        dailyRate: 50,
        description: '',
        weeklyRate: null,
        monthlyRate: null,
        images: [],
        city: '',
        state: '',
        category: null,
        brand: null,
        model: null,
        condition: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const conflictingRental: Rental = {
        id: 'existing-rental',
        startDate: new Date('2024-12-02'),
        endDate: new Date('2024-12-04'),
        status: 'APPROVED',
        gearId: 'gear-1',
        renterId: 'user-3',
        ownerId: 'user-2',
        message: null,
        paymentIntentId: null,
        clientSecret: null,
        paymentStatus: null,
        totalAmount: 250,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.gear.findUnique.mockResolvedValue(mockGear);
      mockPrisma.rental.findFirst.mockResolvedValue(conflictingRental);

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRentalData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockPrisma.rental.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gearId: 'gear-1',
            status: { in: ['pending', 'approved'] },
            OR: expect.any(Array)
          })
        })
      );
    });

    it('should validate date ranges', async () => {
      const invalidData = {
        ...validRentalData,
        startDate: '2024-12-05T00:00:00.000Z',
        endDate: '2024-12-01T00:00:00.000Z' // End before start
      };

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate past dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invalidData = {
        ...validRentalData,
        startDate: pastDate.toISOString(),
        endDate: new Date().toISOString()
      };

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate rental duration limits', async () => {
      const farFutureDate = new Date();
      farFutureDate.setDate(farFutureDate.getDate() + 400); // More than 1 year

      const invalidData = {
        ...validRentalData,
        endDate: farFutureDate.toISOString()
      };

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle non-existent gear', async () => {
      mockPrisma.gear.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRentalData)
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRentalData)
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(1001); // Exceeds 1000 character limit
      const invalidData = {
        ...validRentalData,
        message: longMessage
      };

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors', async () => {
      const mockGear: Gear = {
        id: 'gear-1',
        title: 'Test Camera',
        userId: 'user-2',
        dailyRate: 50,
        description: '',
        weeklyRate: null,
        monthlyRate: null,
        images: [],
        city: '',
        state: '',
        category: null,
        brand: null,
        model: null,
        condition: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.gear.findUnique.mockResolvedValue(mockGear);
      mockPrisma.rental.findFirst.mockResolvedValue(null);
      mockPrisma.rental.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRentalData)
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});