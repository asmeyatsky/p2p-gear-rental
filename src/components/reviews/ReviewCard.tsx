'use client';

import { formatDate } from '@/lib/utils';
import StarRating from './StarRating';

export interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    full_name: string | null;
  };
  reviewee: {
    id: string;
    full_name: string | null;
  };
  rental: {
    id: string;
    gear: {
      id: string;
      title: string;
    };
  };
}

interface ReviewCardProps {
  review: ReviewData;
  showGear?: boolean;
  showReviewee?: boolean;
  className?: string;
}

export default function ReviewCard({
  review,
  showGear = true,
  showReviewee = true,
  className = '',
}: ReviewCardProps) {
  const reviewerName = review.reviewer.full_name || 'Anonymous User';
  const revieweeName = review.reviewee.full_name || 'Anonymous User';

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-sm text-gray-500">
              {formatDate(review.createdAt)}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{reviewerName}</span>
            {showReviewee && (
              <>
                {' reviewed '}
                <span className="font-medium text-gray-900">{revieweeName}</span>
              </>
            )}
            {showGear && (
              <>
                {' for '}
                <span className="font-medium text-blue-600">
                  {review.rental.gear.title}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {review.comment && (
        <div className="mt-2">
          <p className="text-gray-700 text-sm leading-relaxed">
            {review.comment}
          </p>
        </div>
      )}
    </div>
  );
}