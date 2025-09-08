import { z } from 'zod';

export const createGearSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  
  dailyRate: z.number()
    .positive('Daily rate must be positive')
    .max(10000, 'Daily rate cannot exceed $10,000'),
  
  weeklyRate: z.number()
    .positive('Weekly rate must be positive')
    .max(50000, 'Weekly rate cannot exceed $50,000')
    .optional(),
  
  monthlyRate: z.number()
    .positive('Monthly rate must be positive')
    .max(200000, 'Monthly rate cannot exceed $200,000')
    .optional(),
  
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters')
    .trim(),
  
  state: z.string()
    .length(2, 'State must be 2 characters (e.g., CA, NY)')
    .toUpperCase(),
  
  images: z.array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
  
  category: z.enum([
    'cameras',
    'lenses', 
    'lighting',
    'audio',
    'drones',
    'accessories',
    'tripods',
    'monitors',
    'other'
  ]).optional(),
  
  brand: z.string()
    .max(50, 'Brand must be less than 50 characters')
    .trim()
    .optional(),
  
  model: z.string()
    .max(50, 'Model must be less than 50 characters')
    .trim()
    .optional(),
  
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor'])
    .optional(),
});

export const updateGearSchema = createGearSchema.partial();

export const gearQuerySchema = z.object({
  search: z.string().max(100).optional(),
  category: z.enum([
    'cameras',
    'lenses', 
    'lighting',
    'audio',
    'drones',
    'accessories',
    'tripods',
    'monitors',
    'other'
  ]).optional(),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(), 
  city: z.string().max(100).optional(),
  state: z.string().length(2).toUpperCase().optional(),
  location: z.string().max(200).optional(), // General location search
  radius: z.coerce.number().min(1).max(100).optional(), // Search radius in miles
  startDate: z.string().datetime().optional(), // ISO 8601 date string
  endDate: z.string().datetime().optional(),   // ISO 8601 date string
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['newest', 'price-low', 'price-high', 'distance', 'rating', 'relevance']).default('newest'),
});

export type CreateGearInput = z.infer<typeof createGearSchema>;
export type UpdateGearInput = z.infer<typeof updateGearSchema>;
export type GearQuery = z.infer<typeof gearQuerySchema>;