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
jest.mock('@/lib/logger');
jest.mock('@/lib/cache');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('API /reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reviews', () => {
    it('should return reviews for a user', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          comment: 'Great renter, took excellent care of my equipment!',
          reviewerId: 'user-1',
          revieweeId: 'user-2',
          rentalId: 'rental-1',
          createdAt: new Date(),
          reviewer: {
            id: 'user-1',
            full_name: 'John Doe',
            email: 'john@example.com'
          },
          rental: {
            id: 'rental-1',
            gear: {
              id: 'gear-1',
              title: 'Canon EOS R5'
            }
          }
        },
        {
          id: 'review-2',
          rating: 4,
          comment: 'Good communication, prompt pickup and return.',
          reviewerId: 'user-3',
          revieweeId: 'user-2',
          rentalId: 'rental-2',
          createdAt: new Date(),
          reviewer: {
            id: 'user-3',
            full_name: 'Jane Smith',
            email: 'jane@example.com'
          },
          rental: {
            id: 'rental-2',
            gear: {
              id: 'gear-2',
              title: 'Sony FX3'
            }
          }
        }
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any);

      const request = new NextRequest('http://localhost:3000/api/reviews?userId=user-2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].rating).toBe(5);
      expect(data.data[0].reviewer.full_name).toBe('John Doe');
      expect(data.data[1].rating).toBe(4);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { revieweeId: 'user-2' },
        include: {
          reviewer: {
            select: { id: true, full_name: true }
          },
          reviewee: {
            select: { id: true, full_name: true }
          },
          rental: {
            select: {
              id: true,
              gear: {
                select: { id: true, title: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should return reviews for a gear item', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          comment: 'Amazing camera quality!',
          reviewerId: 'user-1',
          revieweeId: 'user-2',
          rentalId: 'rental-1',
          createdAt: new Date(),
          reviewer: {
            id: 'user-1',
            full_name: 'John Doe'
          }
        }
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any);

      const request = new NextRequest('http://localhost:3000/api/reviews?gearId=gear-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: {
          rental: {
            gearId: 'gear-1'
          }
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return empty array when no reviews found', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/reviews?userId=user-nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
    });

    it('should require userId or gearId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors', async () => {
      mockPrisma.review.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/reviews?userId=user-1');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/reviews', () => {
    const validReviewData = {
      rentalId: 'rental-1',
      rating: 5,
      comment: 'Excellent renter, highly recommended!'
    };

    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'reviewer@example.com',
              user_metadata: { full_name: 'Test Reviewer' }
            }
          }
        },
        error: null
      } as any);

      // Mock user upsert
      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'reviewer@example.com',
        full_name: 'Test Reviewer'
      } as any);
    });

    it('should create review for completed rental', async () => {
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-2',
        ownerId: 'user-1', // Current user is owner
        status: 'completed',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        gear: {
          id: 'gear-1',
          title: 'Canon EOS R5'
        }
      };

      const mockCreatedReview = {
        id: 'review-1',
        ...validReviewData,
        reviewerId: 'user-1',
        revieweeId: 'user-2',
        createdAt: new Date()
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as any);
      mockPrisma.review.findFirst.mockResolvedValue(null); // No existing review
      mockPrisma.review.create.mockResolvedValue(mockCreatedReview as any);

      // Mock updating user average rating
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-2',
        averageRating: 4.8,
        totalReviews: 5
      } as any);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('review-1');
      expect(data.rating).toBe(5);

      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          rentalId: 'rental-1',
          rating: 5,
          comment: 'Excellent renter, highly recommended!',
          reviewerId: 'user-1',
          revieweeId: 'user-2'
        },
        include: {
          reviewer: {
            select: { id: true, full_name: true, email: true }
          },
          reviewee: {
            select: { id: true, full_name: true }
          },
          rental: {
            select: {
              id: true,
              gear: {
                select: { id: true, title: true }
              }
            }
          }
        }
      });
    });

    it('should allow renter to review owner', async () => {
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-1', // Current user is renter
        ownerId: 'user-2',
        status: 'completed',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as any);
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue({
        id: 'review-1',
        reviewerId: 'user-1',
        revieweeId: 'user-2'
      } as any);
      mockPrisma.user.update.mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should prevent review before rental completion', async () => {
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-2',
        ownerId: 'user-1',
        status: 'confirmed', // Not completed yet
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as any);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should prevent duplicate reviews', async () => {
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-2',
        ownerId: 'user-1',
        status: 'completed',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };

      const existingReview = {
        id: 'existing-review',
        reviewerId: 'user-1',
        rentalId: 'rental-1'
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as any);
      mockPrisma.review.findFirst.mockResolvedValue(existingReview as any);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should prevent unauthorized users from reviewing', async () => {
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-2',
        ownerId: 'user-3', // Neither renter nor owner
        status: 'completed',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as any);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should validate rating range', async () => {
      const invalidData = {
        ...validReviewData,
        rating: 6 // Invalid rating (1-5 only)
      };

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate comment length', async () => {
      const invalidData = {
        ...validReviewData,
        comment: 'a'.repeat(1001) // Too long
      };

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle non-existent rental', async () => {
      mockPrisma.rental.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      } as any);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should update reviewee average rating correctly', async () => {
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-2',
        ownerId: 'user-1',
        status: 'completed',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };

      // Mock existing reviews for calculating average
      const existingReviews = [
        { rating: 4 },
        { rating: 5 },
        { rating: 3 }
      ];

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental as any);
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue({
        id: 'review-1',
        rating: 5
      } as any);
      mockPrisma.review.findMany.mockResolvedValue(existingReviews as any);
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-2',
        averageRating: 4.25, // (4+5+3+5)/4 = 4.25
        totalReviews: 4
      } as any);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      await POST(request);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: {
          averageRating: 4.25,
          totalReviews: 4
        }
      });
    });
  });
});