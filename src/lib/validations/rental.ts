import { z } from 'zod';

export const createRentalSchema = z.object({
  gearId: z.string().min(1, 'Gear ID is required'),
  
  startDate: z.string()
    .datetime('Invalid start date format')
    .refine(
      (date) => new Date(date) > new Date(),
      'Start date must be in the future'
    ),
  
  endDate: z.string()
    .datetime('Invalid end date format'),
  
  message: z.string()
    .max(500, 'Message must be less than 500 characters')
    .trim()
    .optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return diffInDays <= 90; // Maximum 90 days rental
  },
  {
    message: 'Rental period cannot exceed 90 days',
    path: ['endDate'],
  }
);

export const updateRentalStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
  message: z.string()
    .max(500, 'Message must be less than 500 characters')
    .trim()
    .optional(),
});

export const rentalQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['newest', 'oldest', 'start-date', 'end-date']).default('newest'),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export type UpdateRentalStatusInput = z.infer<typeof updateRentalStatusSchema>;
export type RentalQuery = z.infer<typeof rentalQuerySchema>;