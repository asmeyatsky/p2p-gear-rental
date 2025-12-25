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

export const gearQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  search: z.string().optional(),
});

export const updateGearSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters long').optional(),
  dailyRate: z.coerce.number().min(0.01, 'Daily rate must be a positive number').optional(),
  weeklyRate: z.coerce.number().min(0).optional().nullable(),
  monthlyRate: z.coerce.number().min(0).optional().nullable(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().length(2, 'State must be a 2-letter code').optional(),
  zipCode: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).optional(),
  replacementValue: z.coerce.number().min(0).optional(),
  insuranceRequired: z.boolean().optional(),
  insuranceRate: z.coerce.number().min(0).max(1).optional(),
  securityDeposit: z.coerce.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});

export type CreateGearInput = z.infer<typeof createGearSchema>;
export type GearQueryInput = z.infer<typeof gearQuerySchema>;
export type UpdateGearInput = z.infer<typeof updateGearSchema>;