/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/supabase');
jest.mock('@/lib/cache');
jest.mock('@/lib/logger');
jest.mock('@/lib/monitoring');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('API /rentals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rentals', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'test@example.com'
            }
          }
        },
        error: null
      } as any);
    });

    it('should return user rentals', async () => {
      const mockRentals = [
        {
          id: 'rental-1',
          gearId: 'gear-1',
          renterId: 'user-1',
          ownerId: 'user-2',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-05'),
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          gear: {
            id: 'gear-1',
            title: 'Test Camera',
            images: ['image1.jpg'],
            dailyRate: 50,
            user: {
              id: 'user-2',
              full_name: 'Owner User'
            }
          },
          renter: {
            id: 'user-1',
            full_name: 'Renter User',
            email: 'renter@example.com'
          },
          payments: []
        }
      ];

      mockPrisma.rental.findMany.mockResolvedValue(mockRentals as any);

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
              { status: 'approved' }
            ]
          })
        })
      );
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      } as any);

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
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'renter@example.com',
              user_metadata: { full_name: 'Test Renter' }
            }
          }
        },
        error: null
      } as any);

      // Mock user upsert
      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'renter@example.com',
        full_name: 'Test Renter'
      } as any);
    });

    it('should create rental request with valid data', async () => {
      const mockGear = {
        id: 'gear-1',
        title: 'Test Camera',
        userId: 'user-2', // Different owner
        dailyRate: 50
      };

      const mockCreatedRental = {
        id: 'rental-1',
        ...validRentalData,
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        gear: mockGear,
        renter: {
          id: 'user-1',
          full_name: 'Test Renter',
          email: 'renter@example.com'
        }
      };

      mockPrisma.gear.findUnique.mockResolvedValue(mockGear as any);
      mockPrisma.rental.findFirst.mockResolvedValue(null); // No conflicting rentals
      mockPrisma.rental.create.mockResolvedValue(mockCreatedRental as any);

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
      const mockGear = {
        id: 'gear-1',
        title: 'Test Camera',
        userId: 'user-1', // Same as authenticated user
        dailyRate: 50
      };

      mockPrisma.gear.findUnique.mockResolvedValue(mockGear as any);

      const request = new NextRequest('http://localhost:3000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRentalData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should prevent booking unavailable gear', async () => {
      const mockGear = {
        id: 'gear-1',
        title: 'Test Camera',
        userId: 'user-2',
        dailyRate: 50
      };

      const conflictingRental = {
        id: 'existing-rental',
        startDate: new Date('2024-12-02'),
        endDate: new Date('2024-12-04'),
        status: 'approved'
      };

      mockPrisma.gear.findUnique.mockResolvedValue(mockGear as any);
      mockPrisma.rental.findFirst.mockResolvedValue(conflictingRental as any);

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
      } as any);

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
      const mockGear = {
        id: 'gear-1',
        title: 'Test Camera',
        userId: 'user-2',
        dailyRate: 50
      };

      mockPrisma.gear.findUnique.mockResolvedValue(mockGear as any);
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