'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || value;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={cn(
              sizeClasses[size],
              'transition-colors duration-150',
              readonly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-110 transform transition-transform',
              star <= displayRating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={sizeClasses[size]}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {value > 0 ? `${value.toFixed(1)}` : 'No rating'}
        </span>
      )}
    </div>
  );
}