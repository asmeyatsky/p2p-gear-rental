'use client';

import StarRating from './StarRating';

interface UserRatingSummaryProps {
  averageRating: number | null;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function UserRatingSummary({
  averageRating,
  totalReviews,
  size = 'md',
  showLabel = true,
  className = '',
}: UserRatingSummaryProps) {
  const rating = averageRating || 0;

  if (totalReviews === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StarRating value={0} readonly size={size} />
        <span className="text-sm text-gray-500">No reviews yet</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StarRating value={rating} readonly size={size} />
      <div className="flex items-center gap-1 text-sm">
        <span className="font-medium text-gray-900">
          {rating.toFixed(1)}
        </span>
        <span className="text-gray-500">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          Rating
        </span>
      )}
    </div>
  );
}