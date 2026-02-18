/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { User, Gear } from '@prisma/client';
import { Session } from '@supabase/supabase-js';

// Mock session for authentication
const mockGetSession = jest.fn();

// Mock dependencies — route imports from @/lib/db, not @/lib/prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    gear: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockPrisma = require('@/lib/db').prisma;

// Correctly mock the auth-middleware to check the session
jest.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: jest.fn(async () => {
    const { data, error } = await mockGetSession();
    if (error || !data.session) {
      throw new Error('AuthenticationError');
    }
    return { user: data.session.user, session: data.session };
  }),
}));

jest.mock('@/lib/validations/gear', () => ({
  gearQuerySchema: {
    parse: jest.fn((obj: any) => obj),
  },
  createGearSchema: {
    safeParse: jest.fn(),
  },
}));

import { createGearSchema } from '@/lib/validations/gear';

// Mock middlewares to just pass through the handler
jest.mock('@/lib/api-error-handler', () => ({
  withErrorHandler: (fn: any) => async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (error.message === 'AuthenticationError') {
        return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
      }
      return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
    }
  },
}));
jest.mock('@/lib/monitoring', () => ({
  withMonitoring: (fn: any) => fn,
}));
jest.mock('@/lib/rate-limit');
jest.mock('@/lib/logger');

// Import routes after all mocks
import { GET, POST } from '../route';

describe('API /gear', () => {
  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
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
    // Default to authenticated user for all tests
    mockGetSession.mockResolvedValue({
      data: { session: mockSession as Session },
      error: null,
    });
  });

  describe('GET /api/gear', () => {
    it('should return gear list with pagination', async () => {
      const mockGear: Partial<Gear>[] = [{ id: 'gear-1', title: 'Test Camera', userId: 'user-1' }];
      mockPrisma.gear.findMany.mockResolvedValue(mockGear);
      mockPrisma.gear.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/gear?limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Test Camera');
      expect(data.total).toBe(1);
    });

    it('should handle search filters correctly', async () => {
      mockPrisma.gear.findMany.mockResolvedValue([]);
      mockPrisma.gear.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/gear?category=cameras&city=SF');
      await GET(request);

      expect(mockPrisma.gear.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          isAvailable: true,
          category: 'cameras',
          city: { equals: 'SF', mode: 'insensitive' }
        })
      }));
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.gear.findMany.mockRejectedValue(new Error('Database connection error'));

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
      city: 'San Francisco',
      state: 'CA',
      images: ['https://example.com/image.jpg'],
      category: 'cameras',
      brand: 'Canon',
      model: 'EOS R5',
      condition: 'like-new'
    };

    it('should create gear with valid data', async () => {
      const mockCreatedGear = { id: 'gear-1', ...validGearData, userId: 'user-1' };
      (createGearSchema.safeParse as jest.Mock).mockReturnValue({ success: true, data: validGearData });
      mockPrisma.gear.create.mockResolvedValue(mockCreatedGear);

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
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGearData)
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidData = { title: '' };
      (createGearSchema.safeParse as jest.Mock).mockReturnValue({ success: false, error: { issues: [] } });

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle database errors during creation', async () => {
      (createGearSchema.safeParse as jest.Mock).mockReturnValue({ success: true, data: validGearData });
      mockPrisma.gear.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGearData)
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
