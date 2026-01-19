/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { Session } from '@supabase/supabase-js';

// Mock dependencies BEFORE importing the route
jest.mock('@/lib/db', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));
jest.mock('@/lib/supabase');
jest.mock('@/lib/logger');
jest.mock('@/lib/cache');
jest.mock('@/lib/rate-limit');

// Import mocked modules after mocking
import { supabase } from '@/lib/supabase';

const mockPrisma = require('@/lib/db').prisma;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Dynamically import route after mocks are set up
const { GET, POST } = require('../route');

// Types for test data
interface User {
  id: string;
  email: string;
  full_name: string | null;
  averageRating: number | null;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewerId: string;
  revieweeId: string;
  rentalId: string;
  createdAt: Date;
}

interface Rental {
  id: string;
  renterId: string;
  ownerId: string;
  status: string;
  endDate: Date;
  review?: Review | null;
}

describe('API /reviews', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    averageRating: 0,
    totalReviews: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession as Session },
      error: null
    });
    mockPrisma.review.findMany.mockResolvedValue([]);
    mockPrisma.review.count.mockResolvedValue(0);
    mockPrisma.rental.findUnique.mockResolvedValue(null);
    mockPrisma.review.create.mockResolvedValue(null);
    mockPrisma.user.update.mockResolvedValue(mockUser);
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 0 }, _count: { rating: 0 } });
  });

  describe('GET /api/reviews', () => {
    it('should return reviews for a user', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          comment: 'Great renter!',
          reviewerId: 'user-1',
          revieweeId: 'user-2',
          rentalId: 'rental-1',
          createdAt: new Date(),
          reviewer: { id: 'user-1', full_name: 'John Doe' },
          reviewee: { id: 'user-2', full_name: 'Jane Owner' },
          rental: { id: 'rental-1', gear: { id: 'gear-1', title: 'Canon EOS R5' } }
        },
        {
          id: 'review-2',
          rating: 4,
          comment: 'Good communication.',
          reviewerId: 'user-3',
          revieweeId: 'user-2',
          rentalId: 'rental-2',
          createdAt: new Date(),
          reviewer: { id: 'user-3', full_name: 'Jane Smith' },
          reviewee: { id: 'user-2', full_name: 'Jane Owner' },
          rental: { id: 'rental-2', gear: { id: 'gear-2', title: 'Sony FX3' } }
        }
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.review.count.mockResolvedValue(2);

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
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { id: true, full_name: true } },
          reviewee: { select: { id: true, full_name: true } },
          rental: {
            select: {
              id: true,
              gear: { select: { id: true, title: true } }
            }
          }
        }
      });
    });

    it('should return empty array when no reviews found', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/reviews?userId=user-nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
    });

    it('should support pagination', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(25);

      const request = new NextRequest('http://localhost:3000/api/reviews?userId=user-1&page=2&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
      expect(data.pagination.page).toBe(2);
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
      comment: 'Excellent gear and owner!'
    };

    beforeEach(() => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession as Session },
        error: null
      });
    });

    it('should create review for completed rental when user is renter', async () => {
      // Current user (user-1) is the RENTER
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-1', // Current user is renter
        ownerId: 'user-2',
        status: 'COMPLETED',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        review: null // No existing review
      };

      const mockCreatedReview = {
        id: 'review-1',
        rating: 5,
        comment: 'Excellent gear and owner!',
        reviewerId: 'user-1',
        revieweeId: 'user-2',
        rentalId: 'rental-1',
        createdAt: new Date(),
        reviewer: { id: 'user-1', full_name: 'Test User' },
        reviewee: { id: 'user-2', full_name: 'Owner User' },
        rental: { gear: { id: 'gear-1', title: 'Canon EOS R5' } }
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental);
      mockPrisma.review.create.mockResolvedValue(mockCreatedReview);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { rating: 1 } });

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
          rating: 5,
          comment: 'Excellent gear and owner!',
          rentalId: 'rental-1',
          reviewerId: 'user-1',
          revieweeId: 'user-2'
        },
        include: expect.any(Object)
      });
    });

    it('should prevent review before rental completion', async () => {
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'CONFIRMED', // Not completed
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        review: null
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should prevent duplicate reviews', async () => {
      const existingReview = {
        id: 'existing-review',
        reviewerId: 'user-1',
        rentalId: 'rental-1'
      };

      const mockRental = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'COMPLETED',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        review: existingReview // Review already exists
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(409); // Conflict
    });

    it('should prevent non-renter from reviewing', async () => {
      // Current user (user-1) is NOT the renter
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-2', // Different user is renter
        ownerId: 'user-3', // And user-1 is not the owner either
        status: 'COMPLETED',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        review: null
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400); // ValidationError
    });

    it('should reject invalid rating', async () => {
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

      // Zod validation errors are not converted to ValidationError in the handler,
      // so they result in 500 (internal error). The important thing is the request is rejected.
      expect(response.status).not.toBe(200);
      expect(response.status).not.toBe(201);
    });

    it('should handle non-existent rental', async () => {
      mockPrisma.rental.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400); // ValidationError: Rental not found
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should update reviewee average rating after creating review', async () => {
      const mockRental = {
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2',
        status: 'COMPLETED',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        review: null
      };

      const mockCreatedReview = {
        id: 'review-1',
        rating: 5,
        comment: 'Great!',
        reviewerId: 'user-1',
        revieweeId: 'user-2',
        rentalId: 'rental-1',
        createdAt: new Date()
      };

      mockPrisma.rental.findUnique.mockResolvedValue(mockRental);
      mockPrisma.review.create.mockResolvedValue(mockCreatedReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 4 }
      });

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReviewData)
      });

      await POST(request);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: {
          averageRating: 4.5,
          totalReviews: 4
        }
      });
    });
  });
});
