import { z } from 'zod';

export const createGearSchema = z.object({
  title: z.string().min(3, 'Title is required and must be at least 3 characters long'),
  description: z.string().min(10, 'Description is required and must be at least 10 characters long'),
  dailyRate: z.coerce.number().min(0.01, 'Daily rate must be a positive number'),
  weeklyRate: z.coerce.number().min(0).optional().nullable(),
  monthlyRate: z.coerce.number().min(0).optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be a 2-letter code'),
  zipCode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).optional().nullable(),
  replacementValue: z.coerce.number().min(0).optional().nullable(),
  insuranceRequired: z.boolean().default(false),
  insuranceRate: z.coerce.number().min(0).max(1).optional().nullable(), // Stored as decimal (e.g., 0.10 for 10%)
  securityDeposit: z.coerce.number().min(0).optional().nullable(),
  isAvailable: z.boolean().default(true),
  images: z.array(z.string().url('Invalid image URL')).optional().nullable(), // Expecting URLs in bulk upload
});

export type CreateGearInput = z.infer<typeof createGearSchema>;
