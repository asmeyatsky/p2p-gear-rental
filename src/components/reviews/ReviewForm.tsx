'use client';

import { useState } from 'react';
import { useFormApi } from '@/hooks/useApi';
import { toast } from '@/lib/toast';
import StarRating from './StarRating';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { createReviewSchema, type CreateReviewInput } from '@/lib/validations/review';

interface ReviewFormProps {
  rentalId: string;
  gearTitle: string;
  ownerName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  rentalId,
  gearTitle,
  ownerName,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { submitForm, loading } = useFormApi(
    async (data: CreateReviewInput) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      return response.json();
    },
    {
      successMessage: 'Review submitted successfully!',
      onSuccess: () => {
        setRating(0);
        setComment('');
        onSuccess?.();
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      const reviewData = createReviewSchema.parse({
        rating,
        comment: comment.trim() || undefined,
        rentalId,
      });

      await submitForm(reviewData);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">
        Review your rental experience
      </h3>
      
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{gearTitle}</span>
          {' from '}
          <span className="font-medium text-gray-900">{ownerName}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <StarRating
            value={rating}
            onChange={setRating}
            size="lg"
            className="mb-1"
          />
          <p className="text-xs text-gray-500">
            Click to rate from 1 to 5 stars
          </p>
        </div>

        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Comment (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Share your experience with this rental..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/1000 characters
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}