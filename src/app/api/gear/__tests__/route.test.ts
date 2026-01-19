/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { User, Gear } from '@prisma/client';
import { Session } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { createGearSchema } from '@/lib/validations/gear';

// Mock session for authentication
const mockGetSession = jest.fn();

// Mock dependencies
jest.mock('@/lib/prisma'); // Mock prisma client

// Correctly mock the auth-middleware to check the session
jest.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: jest.fn(async () => {
    const { data, error } = await mockGetSession();
    if (error || !data.session) {
      throw new Error('AuthenticationError'); // Throw a simple error
    }
    return { user: data.session.user, session: data.session };
  }),
}));

jest.mock('@/lib/validations/gear', () => ({
  gearQuerySchema: {
    parse: jest.fn((obj) => obj),
  },
  createGearSchema: {
    safeParse: jest.fn(),
  },
}));

// Mock middlewares to just pass through the handler
jest.mock('@/lib/api-error-handler', () => ({
  withErrorHandler: (fn) => async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error.message === 'AuthenticationError') {
        return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
      }
      return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
    }
  },
}));
jest.mock('@/lib/monitoring', () => ({
  withMonitoring: (fn) => fn,
}));

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
      (prisma.gear.findMany as jest.Mock).mockResolvedValue(mockGear);
      (prisma.gear.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/gear?limit=10&offset=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gear).toHaveLength(1);
      expect(data.gear[0].title).toBe('Test Camera');
      expect(data.total).toBe(1);
    });

    it('should handle search filters correctly', async () => {
      (prisma.gear.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.gear.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/gear?category=cameras&city=SF');
      await GET(request);

      expect(prisma.gear.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          isAvailable: true,
          category: 'cameras',
          city: 'SF'
        }
      }));
    });

    it('should handle database errors gracefully', async () => {
      (prisma.gear.findMany as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const request = new NextRequest('http://localhost:3000/api/gear');
      const response = await GET(request);

      // The withErrorHandler mock will catch this and return 500
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
      (prisma.gear.create as jest.Mock).mockResolvedValue(mockCreatedGear);

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
      (prisma.gear.create as jest.Mock).mockRejectedValue(new Error('Database error'));

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
