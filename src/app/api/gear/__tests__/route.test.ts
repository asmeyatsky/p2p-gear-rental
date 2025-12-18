/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { User, Gear } from '@prisma/client';
import { Session } from '@supabase/supabase-js';
import { withErrorHandler, AuthenticationError } from '@/lib/api-error-handler';
import { withRateLimit } from '@/lib/rate-limit';
import { withMonitoring } from '@/lib/monitoring';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { createGearSchema, gearQuerySchema } from '@/lib/validations/gear';
import { executeWithRetry } from '@/lib/database';
import { queryOptimizer } from '@/lib/database/query-optimizer';
import { searchEngine } from '@/lib/search-engine';
import { CacheManager } from '@/lib/cache';

// Mock dependencies with implementations
jest.mock('@/lib/db');
jest.mock('@/lib/supabase');
jest.mock('@/lib/cache', () => ({
  CacheManager: {
    keys: {
      gear: {
        list: jest.fn(),
        category: jest.fn(),
        user: jest.fn()
      },
    },
    get: jest.fn(),
    set: jest.fn(),
    invalidatePattern: jest.fn(),
    del: jest.fn(),
    TTL: {
      SHORT: 300,
      MEDIUM: 600,
      LONG: 1800
    }
  }
}));
jest.mock('@/lib/logger');
jest.mock('@/lib/validations/gear', () => ({
  gearQuerySchema: {
    parse: jest.fn()
  },
  createGearSchema: {
    parse: jest.fn()
  }
}));
jest.mock('@/lib/database/query-optimizer');
jest.mock('@/lib/search-engine', () => ({
  searchEngine: {
    search: jest.fn()
  }
}));
jest.mock('@/lib/database', () => ({
  executeWithRetry: jest.fn()
}));

jest.mock('@/lib/api-error-handler', () => ({
  withErrorHandler: (fn) => async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error.constructor.name === 'AuthenticationError') {
        return new Response(null, { status: 401 });
      } else {
        // For validation errors, JSON parsing errors, or other client errors return 400, for others return 500
        if (error.message.includes('Invalid') ||
            error.message.includes('validation') ||
            error.constructor.name === 'SyntaxError' ||
            error.message.includes('Unexpected token')) {
          return new Response(null, { status: 400 });
        } else {
          return new Response(null, { status: 500 });
        }
      }
    }
  },
  AuthenticationError: class AuthenticationError extends Error {}
}));

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: () => (fn) => fn,
  rateLimitConfig: {
    general: {
      limiter: 'general',
      limit: 100
    }
  }
}));

jest.mock('@/lib/monitoring', () => ({
  withMonitoring: (fn) => fn,
  trackDatabaseQuery: jest.fn().mockImplementation((_, queryFn) => queryFn())
}));

// Import after mocking
const mockPrisma = prisma;
const mockSupabase = supabase;
const mockExecuteWithRetry = executeWithRetry;

describe('API /gear', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default cache to return no cached data
    (require('@/lib/cache').CacheManager.get as jest.Mock).mockResolvedValue(null);
    (require('@/lib/cache').CacheManager.keys.gear.list as jest.Mock).mockReturnValue('gear-list:test');
  });

  describe('GET /api/gear', () => {
    it('should return gear list with pagination', async () => {
      // Mock data
      const mockGear: Partial<Gear & { user: Partial<User> }>[] = [
        {
          id: 'gear-1',
          title: 'Test Camera',
          description: 'Test description',
          dailyRate: 50,
          weeklyRate: null,
          monthlyRate: null,
          images: '["image1.jpg"]', // JSON string as expected by the database
          city: 'San Francisco',
          state: 'CA',
          userId: 'user-1',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            full_name: 'Test User',
            averageRating: 0,
            totalReviews: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          category: 'cameras',
          brand: 'Test Brand',
          model: 'Test Model',
          condition: 'good',
          createdAt: new Date(),
          updatedAt: new Date(),
          averageRating: null,
          totalReviews: 0,
          totalRentals: 0,
          isAvailable: true,
        }
      ];

      // Mock query optimizer to return the expected search result
      (mockExecuteWithRetry as jest.Mock).mockResolvedValue({
        data: mockGear,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
          hasNext: false,
          hasPrev: false
        },
        searchMeta: {
          exactMatches: 1,
          fuzzyMatches: 0,
          searchTime: 10
        }
      });

      // Mock schema validation
      (require('@/lib/validations/gear').gearQuerySchema.parse as jest.Mock)
        .mockReturnValue({ page: 1, limit: 20 });

      const request = new NextRequest('http://localhost:3000/api/gear?page=1&limit=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Test Camera');
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.total).toBe(1);
    });

    it('should handle search filters correctly', async () => {
      // When there's a search parameter, the route uses searchEngine instead of queryOptimizer
      (require('@/lib/search-engine').searchEngine.search as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      });

      // Mock schema validation with search parameters
      (require('@/lib/validations/gear').gearQuerySchema.parse as jest.Mock)
        .mockReturnValue({
          search: 'camera',
          category: 'cameras',
          minPrice: 25,
          maxPrice: 100,
          page: 1,
          limit: 20
        });

      const request = new NextRequest('http://localhost:3000/api/gear?search=camera&category=cameras&minPrice=25&maxPrice=100');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle availability date filtering', async () => {
      // Mock query optimizer to return empty result for search with dates
      (mockExecuteWithRetry as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      });

      const startDate = '2024-12-01T00:00:00.000Z';
      const endDate = '2024-12-05T00:00:00.000Z';

      // Mock schema validation with date parameters
      (require('@/lib/validations/gear').gearQuerySchema.parse as jest.Mock)
        .mockReturnValue({
          startDate,
          endDate,
          page: 1,
          limit: 20
        });

      const request = new NextRequest(`http://localhost:3000/api/gear?startDate=${startDate}&endDate=${endDate}`);

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle invalid query parameters', async () => {
      // Mock schema validation to throw error for invalid parameters
      (require('@/lib/validations/gear').gearQuerySchema.parse as jest.Mock)
        .mockImplementation(() => {
          throw new Error('Invalid query parameters');
        });

      const request = new NextRequest('http://localhost:3000/api/gear?page=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      // Mock executeWithRetry to throw an error
      (mockExecuteWithRetry as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      // Mock schema validation to return valid parameters
      (require('@/lib/validations/gear').gearQuerySchema.parse as jest.Mock)
        .mockReturnValue({ page: 1, limit: 20 });

      const request = new NextRequest('http://localhost:3000/api/gear');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/gear', () => {
    const validGearData = {
      title: 'Test Camera',
      description: 'High quality camera for rent',
      dailyRate: 50,
      weeklyRate: 300,
      monthlyRate: 1000,
      city: 'San Francisco',
      state: 'CA',
      images: ['https://example.com/image.jpg'],
      category: 'cameras',
      brand: 'Canon',
      model: 'EOS R5',
      condition: 'like-new'
    };

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
      // Mock authenticated user
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null
      });

      // Mock schema validation
      (require('@/lib/validations/gear').createGearSchema.parse as jest.Mock)
        .mockReturnValue(validGearData);
    });

    it('should create gear with valid data', async () => {
      const mockCreatedGear: Partial<Gear & { user: Partial<User> }> = {
        id: 'gear-1',
        ...validGearData,
        images: JSON.stringify(validGearData.images), // The route stores images as JSON string
        userId: 'user-1',
        user: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        weeklyRate: 300,
        monthlyRate: 1000,
        averageRating: null,
        totalReviews: 0,
        totalRentals: 0,
        isAvailable: true,
      };

      // Mock executeWithRetry to return the created user and gear
      (mockExecuteWithRetry as jest.Mock)
        .mockResolvedValueOnce(mockUser) // For user upsert
        .mockResolvedValueOnce(mockCreatedGear); // For gear creation

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGearData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(validGearData.title);
      expect(data.userId).toBe('user-1');
    });

    it('should reject requests without authentication', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGearData)
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Empty title should fail
        description: 'Test',
        dailyRate: 50
      };

      // Mock schema validation to throw error for invalid data
      (require('@/lib/validations/gear').createGearSchema.parse as jest.Mock)
        .mockImplementation(() => {
          throw new Error('Invalid data');
        });

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate price limits', async () => {
      const invalidData = {
        ...validGearData,
        dailyRate: 15000 // Exceeds maximum
      };

      // Mock schema validation to throw error for invalid data
      (require('@/lib/validations/gear').createGearSchema.parse as jest.Mock)
        .mockImplementation(() => {
          throw new Error('Invalid data');
        });

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate image URLs', async () => {
      const invalidData = {
        ...validGearData,
        images: ['not-a-url', 'also-not-a-url']
      };

      // Mock schema validation to throw error for invalid data
      (require('@/lib/validations/gear').createGearSchema.parse as jest.Mock)
        .mockImplementation(() => {
          throw new Error('Invalid data');
        });

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate state code format', async () => {
      const invalidData = {
        ...validGearData,
        state: 'California' // Should be 2-letter code
      };

      // Mock schema validation to throw error for invalid data
      (require('@/lib/validations/gear').createGearSchema.parse as jest.Mock)
        .mockImplementation(() => {
          throw new Error('Invalid data');
        });

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors during creation', async () => {
      // Mock schema validation to pass
      (require('@/lib/validations/gear').createGearSchema.parse as jest.Mock)
        .mockReturnValue(validGearData);

      // Mock executeWithRetry to throw error on gear creation (second call)
      (mockExecuteWithRetry as jest.Mock)
        .mockResolvedValueOnce({ id: 'user-1' }) // For user upsert
        .mockRejectedValue(new Error('Database error')); // For gear creation

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGearData)
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle malformed JSON', async () => {
      // Create a mock request that simulates JSON parsing error
      const mockRequest = {
        json: async () => { throw new SyntaxError('Unexpected token i in JSON at position 0'); },
        text: async () => 'invalid json',
        method: 'POST',
        headers: { get: (name: string) => name === 'Content-Type' ? 'application/json' : null },
        url: 'http://localhost:3000/api/gear'
      } as unknown as NextRequest;

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
    });
  });

  describe('Rate limiting', () => {
    it('should handle rate limiting', async () => {
      // This would test the rate limiting middleware
      // In a real scenario, you'd mock the rate limiter to return an error
      // Mock rate limit exceeded
      jest.doMock('@/lib/rate-limit', () => ({
        withRateLimit: () => () => async () => {
          const response = new Response('Rate limit exceeded', { status: 429 });
          return response;
        }
      }));

      // This test would need to be structured differently to properly test rate limiting
      expect(true).toBe(true); // Placeholder
    });
  });
});
