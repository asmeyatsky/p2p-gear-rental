'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import ReviewCard, { type ReviewData } from './ReviewCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ReviewQuery } from '@/lib/validations/review';

interface ReviewsListProps {
  userId?: string;
  rating?: number;
  showGear?: boolean;
  showReviewee?: boolean;
  className?: string;
  limit?: number;
}

interface ReviewsResponse {
  data: ReviewData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ReviewsList({
  userId,
  rating,
  showGear = true,
  showReviewee = true,
  className = '',
  limit = 10,
}: ReviewsListProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-high' | 'rating-low'>('newest');

  const { data, loading, error, execute } = useApi<ReviewsResponse>(
    async (queryParams: ReviewQuery) => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/reviews?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch reviews');
      }
      return response.json();
    },
    {
      showErrorToast: false,
    }
  );

  useEffect(() => {
    execute({
      userId,
      rating,
      page,
      limit,
      sortBy,
    });
  }, [execute, userId, rating, page, limit, sortBy]);

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" text="Loading reviews..." />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load reviews</p>
        <button
          onClick={() => execute({ userId, rating, page, limit, sortBy })}
          className="mt-2 text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const reviews = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className={className}>
      {/* Header with sort options */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Reviews {pagination && `(${pagination.total})`}
        </h3>
        
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="rating-high">Highest rated</option>
          <option value="rating-low">Lowest rated</option>
        </select>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: ReviewData) => (
            <ReviewCard
              key={review.id}
              review={review}
              showGear={showGear}
              showReviewee={showReviewee}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPrev || loading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNext || loading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}