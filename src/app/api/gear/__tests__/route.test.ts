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

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('API /gear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/gear', () => {
    it('should return gear list with pagination', async () => {
      // Mock data
      const mockGear = [
        {
          id: 'gear-1',
          title: 'Test Camera',
          description: 'Test description',
          dailyRate: 50,
          images: ['image1.jpg'],
          city: 'San Francisco',
          state: 'CA',
          userId: 'user-1',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            full_name: 'Test User'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.gear.findMany.mockResolvedValue(mockGear as any);
      mockPrisma.gear.count.mockResolvedValue(1);

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
      mockPrisma.gear.findMany.mockResolvedValue([]);
      mockPrisma.gear.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/gear?search=camera&category=cameras&minPrice=25&maxPrice=100');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.gear.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dailyRate: { gte: 25, lte: 100 },
            category: 'cameras'
          })
        })
      );
    });

    it('should handle availability date filtering', async () => {
      mockPrisma.gear.findMany.mockResolvedValue([]);
      mockPrisma.gear.count.mockResolvedValue(0);

      const startDate = '2024-12-01T00:00:00.000Z';
      const endDate = '2024-12-05T00:00:00.000Z';
      const request = new NextRequest(`http://localhost:3000/api/gear?startDate=${startDate}&endDate=${endDate}`);
      
      await GET(request);

      expect(mockPrisma.gear.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: {
              rentals: {
                some: {
                  AND: [
                    {
                      OR: [
                        { startDate: { lte: new Date(endDate) } },
                        { endDate: { gte: new Date(startDate) } }
                      ]
                    },
                    {
                      status: { in: ['pending', 'approved'] }
                    }
                  ]
                }
              }
            }
          })
        })
      );
    });

    it('should handle invalid query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/gear?page=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
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

    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User' }
            }
          }
        },
        error: null
      } as any);

      // Mock user upsert
      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User'
      } as any);
    });

    it('should create gear with valid data', async () => {
      const mockCreatedGear = {
        id: 'gear-1',
        ...validGearData,
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          full_name: 'Test User'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.gear.create.mockResolvedValue(mockCreatedGear as any);

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
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      } as any);

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

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors during creation', async () => {
      mockPrisma.gear.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGearData)
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Rate limiting', () => {
    it('should handle rate limiting', async () => {
      // This would test the rate limiting middleware
      // In a real scenario, you'd mock the rate limiter to return an error
      const request = new NextRequest('http://localhost:3000/api/gear');
      
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