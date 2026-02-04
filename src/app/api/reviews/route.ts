import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { withErrorHandler, ValidationError, ConflictError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { createReviewSchema, reviewQuerySchema } from '@/lib/validations/review';
import { CacheManager } from '@/lib/cache';

// GET /api/reviews - List reviews with filtering
export const GET = withErrorHandler(
  withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
    async (request: NextRequest) => {
      const { searchParams } = new URL(request.url);
      const queryData = Object.fromEntries(searchParams.entries());
      
      const validatedQuery = reviewQuerySchema.parse(queryData);
      const { userId, rating, page, limit, sortBy } = validatedQuery;

      // Generate cache key
      const cacheKey = `reviews:list:${JSON.stringify(validatedQuery)}`;
      
      // Try cache first
      const cached = await CacheManager.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      // Build where clause
      const where: Record<string, any> = {};
      if (userId) {
        where.revieweeId = userId; // Reviews received by this user
      }
      if (rating) {
        where.rating = rating;
      }

      // Build order by
      let orderBy: Record<string, any> = { createdAt: 'desc' };
      switch (sortBy) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'rating-high':
          orderBy = { rating: 'desc' };
          break;
        case 'rating-low':
          orderBy = { rating: 'asc' };
          break;
      }

      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take: limit,
          orderBy,
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
          }
        }),
        prisma.review.count({ where })
      ]);

      const responseData = {
        data: reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

      // Cache for 10 minutes
      await CacheManager.set(cacheKey, responseData, CacheManager.TTL.MEDIUM * 2);

      return NextResponse.json(responseData);
    }
  )
);

// POST /api/reviews - Create a new review
export const POST = withErrorHandler(
  withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
    async (request: NextRequest) => {
      const { user } = await authenticateRequest(request);

      const body = await request.json();
      const validatedData = createReviewSchema.parse(body);
      const { rating, comment, rentalId } = validatedData;

      // Verify the rental exists and user is the renter
      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        include: {
          review: true, // Check if review already exists
        }
      });

      if (!rental) {
        throw new ValidationError('Rental not found');
      }

      if (rental.renterId !== user.id) {
        throw new ValidationError('You can only review rentals you were the renter for');
      }

      if (rental.status !== 'COMPLETED') {
        throw new ValidationError('You can only review completed rentals');
      }

      if (rental.review) {
        throw new ConflictError('Review already exists for this rental');
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          rating,
          comment,
          rentalId,
          reviewerId: user.id,
          revieweeId: rental.ownerId, // Review the gear owner
        },
        include: {
          reviewer: {
            select: { id: true, full_name: true }
          },
          reviewee: {
            select: { id: true, full_name: true }
          },
          rental: {
            select: {
              gear: {
                select: { id: true, title: true }
              }
            }
          }
        }
      });

      // Update reviewee's average rating and total reviews
      await updateUserRatingStats(rental.ownerId);

      // Invalidate relevant caches
      await Promise.all([
        CacheManager.invalidatePattern('reviews:list:*'),
        CacheManager.del(`user:stats:${rental.ownerId}`),
      ]);

      return NextResponse.json(review, { status: 201 });
    }
  )
);

// Helper function to update user rating statistics
async function updateUserRatingStats(userId: string): Promise<void> {
  const stats = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: { rating: true }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      averageRating: stats._avg.rating || null,
      totalReviews: stats._count.rating || 0,
    }
  });
}