// Re-export all validation schemas for easy imports
export * from './gear';
export * from './rental';
export * from './auth';
export * from './review';
export * from './payment';

// Common validation utilities
import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type Pagination = z.infer<typeof paginationSchema>;