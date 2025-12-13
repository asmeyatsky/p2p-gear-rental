/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { User, Rental, Gear, Review } from '@prisma/client';
import { Session } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/supabase');
jest.mock('@/lib/logger');
jest.mock('@/lib/cache');

const mockPrisma = jest.mocked(prisma);
const mockSupabase = jest.mocked(supabase);

describe('API /dashboard/stats', () => {
  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
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
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession as Session },
      error: null
    });

    // Mock user upsert
    (mockPrisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return comprehensive dashboard stats for user', async () => {
      // Mock gear stats
      (mockPrisma.gear.count as jest.Mock).mockResolvedValueOnce(5);
      (mockPrisma.gear.findMany as jest.Mock).mockResolvedValueOnce([
        { id: '1', dailyRate: 50 },
        { id: '2', dailyRate: 75 },
        { id: '3', dailyRate: 100 }
      ] as Partial<Gear>[]);

      // Mock rental stats as owner
      (mockPrisma.rental.count as jest.Mock)
        .mockResolvedValueOnce(12) // totalRentalsAsOwner
        .mockResolvedValueOnce(8)  // totalRentalsAsRenter
        .mockResolvedValueOnce(3)  // activeRentals
        .mockResolvedValueOnce(2); // pendingRequests

      // Mock monthly earnings (last 12 months)
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toISOString().slice(0, 7),
        earnings: 200 + Math.random() * 100
      }));

      // Mock the monthly earnings query
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValueOnce(monthlyData);

      // Mock recent activity
      const recentRentals: Partial<Rental & { gear: Partial<Gear>, renter: Partial<User> }>[] = [
        {
          id: 'rental-1',
          status: 'CONFIRMED',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-05'),
          totalPrice: 200,
          gear: { title: 'Canon EOS R5' },
          renter: { full_name: 'John Doe' }
        },
        {
          id: 'rental-2',
          status: 'COMPLETED',
          startDate: new Date('2024-11-20'),
          endDate: new Date('2024-11-25'),
          totalPrice: 300,
          gear: { title: 'Sony FX3' },
          renter: { full_name: 'Jane Smith' }
        }
      ];

      (mockPrisma.rental.findMany as jest.Mock).mockResolvedValueOnce(recentRentals as Rental[]);

      // Mock reviews stats
      (mockPrisma.review.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { rating: 4.8 },
        _count: { id: 24 }
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        gear: {
          total: 5,
          averageDailyRate: expect.any(Number)
        },
        rentals: {
          totalAsOwner: 12,
          totalAsRenter: 8,
          active: 3,
          pending: 2
        },
        reviews: {
          averageRating: 4.8,
          totalReviews: 24
        },
        recentActivity: expect.any(Array)
      });

      expect(data.recentActivity).toHaveLength(2);
      expect(data.recentActivity[0]).toMatchObject({
        id: 'rental-1',
        status: 'CONFIRMED',
        gear: { title: 'Canon EOS R5' },
        renter: { full_name: 'John Doe' }
      });
    });

    it('should handle user with no gear', async () => {
      (mockPrisma.gear.count as jest.Mock).mockResolvedValueOnce(0);
      (mockPrisma.gear.findMany as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.rental.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.rental.findMany as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.review.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gear.total).toBe(0);
      expect(data.gear.averageDailyRate).toBe(0);
      expect(data.reviews.averageRating).toBe(0);
      expect(data.reviews.totalReviews).toBe(0);
    });

    it('should calculate average daily rate correctly', async () => {
      (mockPrisma.gear.count as jest.Mock).mockResolvedValueOnce(3);
      (mockPrisma.gear.findMany as jest.Mock).mockResolvedValueOnce([
        { id: '1', dailyRate: 50 },
        { id: '2', dailyRate: 100 },
        { id: '3', dailyRate: 150 }
      ] as Partial<Gear>[]);
      (mockPrisma.gear.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { dailyRate: 100 }
      });

      // Mock other required calls with defaults
      (mockPrisma.rental.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.rental.findMany as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.review.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.gear.averageDailyRate).toBe(100);
    });

    it('should require authentication', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.gear.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should format monthly earnings correctly', async () => {
      // Mock basic stats
      (mockPrisma.gear.count as jest.Mock).mockResolvedValueOnce(0);
      (mockPrisma.gear.findMany as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.rental.count as jest.Mock).mockResolvedValue(0);

      // Mock monthly data with specific format
      const mockMonthlyData = [
        { month: '2024-01', earnings: 100.50 },
        { month: '2024-02', earnings: 250.75 },
        { month: '2024-03', earnings: 175.25 }
      ];

      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValueOnce(mockMonthlyData);
      (mockPrisma.rental.findMany as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.review.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.earnings.monthly).toEqual(mockMonthlyData);
      expect(data.earnings.monthly).toHaveLength(3);
      expect(data.earnings.monthly[0]).toMatchObject({
        month: '2024-01',
        earnings: 100.50
      });
    });

    it('should limit recent activity to 10 items', async () => {
      // Mock basic stats
      (mockPrisma.gear.count as jest.Mock).mockResolvedValueOnce(0);
      (mockPrisma.gear.findMany as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.rental.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.review.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      });

      // Create 15 recent rentals
      const manyRentals: Partial<Rental>[] = Array.from({ length: 15 }, (_, i) => ({
        id: `rental-${i}`,
        status: 'COMPLETED',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: 100,
        gear: { title: `Camera ${i}` },
        renter: { full_name: `User ${i}` }
      }));

      (mockPrisma.rental.findMany as jest.Mock).mockResolvedValueOnce(manyRentals as Rental[]);

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      // Verify the query was called with limit of 10
      expect(mockPrisma.rental.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10
        })
      );
    });

    it('should include both owner and renter rental counts', async () => {
      // Mock basic stats
      (mockPrisma.gear.count as jest.Mock).mockResolvedValueOnce(0);
      (mockPrisma.gear.findMany as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.rental.findMany as jest.Mock).mockResolvedValueOnce([]);
      (mockPrisma.review.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      });

      // Mock rental counts in specific order
      (mockPrisma.rental.count as jest.Mock)
        .mockResolvedValueOnce(25) // totalRentalsAsOwner
        .mockResolvedValueOnce(15) // totalRentalsAsRenter
        .mockResolvedValueOnce(5)  // activeRentals
        .mockResolvedValueOnce(3); // pendingRequests

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.rentals).toMatchObject({
        totalAsOwner: 25,
        totalAsRenter: 15,
        active: 5,
        pending: 3
      });

      // Verify the correct queries were made
      expect(mockPrisma.rental.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: 'user-1' }
        })
      );
      expect(mockPrisma.rental.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { renterId: 'user-1' }
        })
      );
    });
  });
});
