/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { User, Rental, Gear, Payment, Review } from '@prisma/client';
import { Session } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/supabase');
jest.mock('@/lib/logger');
jest.mock('@/lib/cache');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('API /dashboard/stats', () => {
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
    
    // Mock authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession as Session },
      error: null
    });

    // Mock user upsert
    mockPrisma.user.upsert.mockResolvedValue(mockUser);
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return comprehensive dashboard stats for user', async () => {
      // Mock gear stats
      mockPrisma.gear.count.mockResolvedValueOnce(5); // totalGear
      mockPrisma.gear.findMany.mockResolvedValueOnce([
        { id: '1', dailyRate: 50 },
        { id: '2', dailyRate: 75 },
        { id: '3', dailyRate: 100 }
      ] as Partial<Gear>[]); // for average daily rate calculation

      // Mock rental stats as owner
      mockPrisma.rental.count
        .mockResolvedValueOnce(12) // totalRentalsAsOwner
        .mockResolvedValueOnce(8)  // totalRentalsAsRenter
        .mockResolvedValueOnce(3)  // activeRentals
        .mockResolvedValueOnce(2); // pendingRequests

      // Mock earnings
      mockPrisma.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: 2500.00 }
      } as { _sum: { amount: number | null } });

      // Mock monthly earnings (last 12 months)
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toISOString().slice(0, 7),
        earnings: 200 + Math.random() * 100
      }));
      
      // Mock the monthly earnings query
      mockPrisma.$queryRaw.mockResolvedValueOnce(monthlyData);

      // Mock recent activity
      const recentRentals: Partial<Rental & { gear: Partial<Gear>, renter: Partial<User> }>[] = [
        {
          id: 'rental-1',
          status: 'confirmed',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-05'),
          totalAmount: 200,
          gear: { title: 'Canon EOS R5' },
          renter: { full_name: 'John Doe' }
        },
        {
          id: 'rental-2',
          status: 'completed',
          startDate: new Date('2024-11-20'),
          endDate: new Date('2024-11-25'),
          totalAmount: 300,
          gear: { title: 'Sony FX3' },
          renter: { full_name: 'Jane Smith' }
        }
      ];

      mockPrisma.rental.findMany.mockResolvedValueOnce(recentRentals as Rental[]);

      // Mock reviews stats
      mockPrisma.review.aggregate.mockResolvedValueOnce({
        _avg: { rating: 4.8 },
        _count: { id: 24 }
      } as { _avg: { rating: number | null }, _count: { id: number } });

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
        earnings: {
          total: 2500.00,
          monthly: expect.any(Array)
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
        status: 'confirmed',
        gear: { title: 'Canon EOS R5' },
        renter: { full_name: 'John Doe' }
      });
    });

    it('should handle user with no gear', async () => {
      mockPrisma.gear.count.mockResolvedValueOnce(0);
      mockPrisma.gear.findMany.mockResolvedValueOnce([]);
      mockPrisma.rental.count
        .mockResolvedValue(0);
      mockPrisma.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: null }
      } as { _sum: { amount: number | null } });
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      mockPrisma.rental.findMany.mockResolvedValueOnce([]);
      mockPrisma.review.aggregate.mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      } as { _avg: { rating: number | null }, _count: { id: number } });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gear.total).toBe(0);
      expect(data.gear.averageDailyRate).toBe(0);
      expect(data.earnings.total).toBe(0);
      expect(data.reviews.averageRating).toBe(0);
      expect(data.reviews.totalReviews).toBe(0);
    });

    it('should calculate average daily rate correctly', async () => {
      mockPrisma.gear.count.mockResolvedValueOnce(3);
      mockPrisma.gear.findMany.mockResolvedValueOnce([
        { id: '1', dailyRate: 50 },
        { id: '2', dailyRate: 100 },
        { id: '3', dailyRate: 150 }
      ] as Partial<Gear>[]);
      mockPrisma.gear.aggregate.mockResolvedValueOnce({
        _avg: { dailyRate: 100 }
      } as { _avg: { dailyRate: number | null } });
      
      // Mock other required calls with defaults
      mockPrisma.rental.count.mockResolvedValue(0);
      mockPrisma.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: null }
      } as { _sum: { amount: number | null } });
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      mockPrisma.rental.findMany.mockResolvedValueOnce([]);
      mockPrisma.review.aggregate.mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      } as { _avg: { rating: number | null }, _count: { id: number } });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.gear.averageDailyRate).toBe(100);
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.gear.count.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should format monthly earnings correctly', async () => {
      // Mock basic stats
      mockPrisma.gear.count.mockResolvedValueOnce(0);
      mockPrisma.gear.findMany.mockResolvedValueOnce([]);
      mockPrisma.rental.count.mockResolvedValue(0);
      mockPrisma.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: 1000 }
      } as { _sum: { amount: number | null } });

      // Mock monthly data with specific format
      const mockMonthlyData = [
        { month: '2024-01', earnings: 100.50 },
        { month: '2024-02', earnings: 250.75 },
        { month: '2024-03', earnings: 175.25 }
      ];
      
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockMonthlyData);
      mockPrisma.rental.findMany.mockResolvedValueOnce([]);
      mockPrisma.review.aggregate.mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      } as { _avg: { rating: number | null }, _count: { id: number } });

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
      mockPrisma.gear.count.mockResolvedValueOnce(0);
      mockPrisma.gear.findMany.mockResolvedValueOnce([]);
      mockPrisma.rental.count.mockResolvedValue(0);
      mockPrisma.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: 0 }
      } as { _sum: { amount: number | null } });
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      mockPrisma.review.aggregate.mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      } as { _avg: { rating: number | null }, _count: { id: number } });

      // Create 15 recent rentals
      const manyRentals: Partial<Rental>[] = Array.from({ length: 15 }, (_, i) => ({
        id: `rental-${i}`,
        status: 'completed',
        startDate: new Date(),
        endDate: new Date(),
        totalAmount: 100,
        gear: { title: `Camera ${i}` },
        renter: { full_name: `User ${i}` }
      }));

      mockPrisma.rental.findMany.mockResolvedValueOnce(manyRentals as Rental[]);

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      // Verify the query was called with limit of 10
      expect(mockPrisma.rental.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        include: {
          gear: { select: { title: true } },
          renter: { select: { full_name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      expect(data.recentActivity).toHaveLength(15); // Mock returns all, but query was made with limit
    });

    it('should include both owner and renter rental counts', async () => {
      // Mock basic stats
      mockPrisma.gear.count.mockResolvedValueOnce(0);
      mockPrisma.gear.findMany.mockResolvedValueOnce([]);
      mockPrisma.payment.aggregate.mockResolvedValueOnce({
        _sum: { amount: 0 }
      } as { _sum: { amount: number | null } });
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      mockPrisma.rental.findMany.mockResolvedValueOnce([]);
      mockPrisma.review.aggregate.mockResolvedValueOnce({
        _avg: { rating: null },
        _count: { id: 0 }
      } as { _avg: { rating: number | null }, _count: { id: number } });

      // Mock rental counts in specific order
      mockPrisma.rental.count
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
      expect(mockPrisma.rental.count).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' }
      });
      expect(mockPrisma.rental.count).toHaveBeenCalledWith({
        where: { renterId: 'user-1' }
      });
      expect(mockPrisma.rental.count).toHaveBeenCalledWith({
        where: {
          OR: [{ ownerId: 'user-1' }, { renterId: 'user-1' }],
          status: { in: ['confirmed', 'approved'] },
          endDate: { gt: expect.any(Date) }
        }
      });
    });
  });
});