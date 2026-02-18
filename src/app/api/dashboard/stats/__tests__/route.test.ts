/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { User, Rental, Gear, Review } from '@prisma/client';
import { Session } from '@supabase/supabase-js';

// Mock session controller
const mockGetSession = jest.fn();

// Mock all dependencies before importing anything that uses them
jest.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: jest.fn(async () => {
    const { data, error } = await mockGetSession();
    if (error || !data.session) {
      const err = new Error('Authentication required');
      (err as any).statusCode = 401;
      (err as any).name = 'AuthenticationError';
      throw err;
    }
    return { user: data.session.user, session: data.session };
  }),
}));

jest.mock('@/lib/database/query-optimizer', () => ({
  queryOptimizer: {
    getUserDashboardStats: jest.fn()
  }
}));

jest.mock('@/lib/database', () => ({
  executeWithRetry: jest.fn()
}));

jest.mock('@/lib/cache', () => ({
  CacheManager: {
    keys: {
      user: {
        dashboard: jest.fn()
      }
    },
    get: jest.fn(),
    set: jest.fn(),
    TTL: {
      SHORT: 300,
      MEDIUM: 600,
      LONG: 1800
    }
  }
}));

jest.mock('@/lib/api-error-handler', () => ({
  withErrorHandler: (fn: any) => async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (error.name === 'AuthenticationError' || error.statusCode === 401) {
        return new Response(null, { status: 401 });
      } else {
        return new Response(null, { status: 500 });
      }
    }
  },
  AuthenticationError: class AuthenticationError extends Error {}
}));

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: () => (fn: any) => fn,
  rateLimitConfig: {
    general: {
      limiter: 'general',
      limit: 100
    }
  }
}));

jest.mock('@/lib/monitoring', () => ({
  withMonitoring: (fn: any) => fn
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Import after all mocks
import { GET } from '../route';

const mockExecuteWithRetry = require('@/lib/database').executeWithRetry;

describe('API /dashboard/stats', () => {
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

    mockGetSession.mockResolvedValue({
      data: { session: mockSession as Session },
      error: null
    });

    require('@/lib/cache').CacheManager.get.mockResolvedValue(null);
    require('@/lib/cache').CacheManager.keys.user.dashboard.mockReturnValue('dashboard-stats:user-1');
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return comprehensive dashboard stats for user', async () => {
      const mockStats = {
        gear: {
          total: 5,
          averageDailyRate: 75
        },
        rentals: {
          totalAsOwner: 12,
          totalAsRenter: 8,
          active: 3,
          pending: 2
        },
        earnings: {
          total: 0
        },
        reviews: {
          averageRating: 4.8,
          totalReviews: 24
        },
        recentActivity: [
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
        ]
      };

      (mockExecuteWithRetry as jest.Mock).mockResolvedValue(mockStats);

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
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
      const mockStats = {
        gear: {
          total: 0,
          averageDailyRate: 0
        },
        rentals: {
          totalAsOwner: 0,
          totalAsRenter: 0,
          active: 0,
          pending: 0
        },
        earnings: {
          total: 0
        },
        reviews: {
          averageRating: 0,
          totalReviews: 0
        },
        recentActivity: []
      };

      (mockExecuteWithRetry as jest.Mock).mockResolvedValue(mockStats);

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gear.total).toBe(0);
      expect(data.gear.averageDailyRate).toBe(0);
      expect(data.reviews.averageRating).toBe(0);
      expect(data.reviews.totalReviews).toBe(0);
    });

    it('should calculate average daily rate correctly', async () => {
      const mockStats = {
        gear: {
          total: 3,
          averageDailyRate: 100
        },
        rentals: {
          totalAsOwner: 0,
          totalAsRenter: 0,
          active: 0,
          pending: 0
        },
        earnings: {
          total: 0
        },
        reviews: {
          averageRating: 0,
          totalReviews: 0
        },
        recentActivity: []
      };

      (mockExecuteWithRetry as jest.Mock).mockResolvedValue(mockStats);

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gear.averageDailyRate).toBe(100);
    });

    it('should require authentication', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      mockExecuteWithRetry.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should format monthly earnings correctly', async () => {
      const mockMonthlyData = [
        { month: '2024-01', earnings: 100.50 },
        { month: '2024-02', earnings: 250.75 },
        { month: '2024-03', earnings: 175.25 }
      ];

      const mockStats = {
        gear: {
          total: 0,
          averageDailyRate: 0
        },
        rentals: {
          totalAsOwner: 0,
          totalAsRenter: 0,
          active: 0,
          pending: 0
        },
        earnings: {
          total: 0,
          monthly: mockMonthlyData
        },
        reviews: {
          averageRating: 0,
          totalReviews: 0
        },
        recentActivity: []
      };

      (mockExecuteWithRetry as jest.Mock).mockResolvedValue(mockStats);

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.earnings.monthly).toEqual(mockMonthlyData);
      expect(data.earnings.monthly).toHaveLength(3);
      expect(data.earnings.monthly[0]).toMatchObject({
        month: '2024-01',
        earnings: 100.50
      });
    });

    it('should limit recent activity to 10 items', async () => {
      const mockStats = {
        gear: {
          total: 0,
          averageDailyRate: 0
        },
        rentals: {
          totalAsOwner: 0,
          totalAsRenter: 0,
          active: 0,
          pending: 0
        },
        earnings: {
          total: 0
        },
        reviews: {
          averageRating: 0,
          totalReviews: 0
        },
        recentActivity: Array.from({ length: 10 }, (_, i) => ({
          id: `rental-${i}`,
          status: 'COMPLETED',
          startDate: new Date(),
          endDate: new Date(),
          totalPrice: 100,
          gear: { title: `Camera ${i}` },
          renter: { full_name: `User ${i}` }
        }))
      };

      (mockExecuteWithRetry as jest.Mock).mockResolvedValue(mockStats);

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.recentActivity).toHaveLength(10);
    });

    it('should include both owner and renter rental counts', async () => {
      const mockStats = {
        gear: {
          total: 0,
          averageDailyRate: 0
        },
        rentals: {
          totalAsOwner: 25,
          totalAsRenter: 15,
          active: 5,
          pending: 3
        },
        earnings: {
          total: 0
        },
        reviews: {
          averageRating: 0,
          totalReviews: 0
        },
        recentActivity: []
      };

      (mockExecuteWithRetry as jest.Mock).mockResolvedValue(mockStats);

      const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.rentals).toMatchObject({
        totalAsOwner: 25,
        totalAsRenter: 15,
        active: 5,
        pending: 3
      });
    });
  });
});
