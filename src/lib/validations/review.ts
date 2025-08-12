import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  
  comment: z.string()
    .max(1000, 'Comment must be less than 1000 characters')
    .trim()
    .optional(),
  
  rentalId: z.string()
    .min(1, 'Rental ID is required'),
});

export const updateReviewSchema = createReviewSchema.partial().omit({ rentalId: true });

export const reviewQuerySchema = z.object({
  userId: z.string().optional(), // Get reviews for a specific user
  rating: z.coerce.number().min(1).max(5).optional(), // Filter by rating
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sortBy: z.enum(['newest', 'oldest', 'rating-high', 'rating-low']).default('newest'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;