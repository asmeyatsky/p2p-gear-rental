import { z } from 'zod';

export const createDisputeSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  category: z.enum([
    'DAMAGE',
    'MISSING_ITEM',
    'PAYMENT_ISSUE',
    'COMMUNICATION',
    'POLICY_VIOLATION',
    'SAFETY_CONCERN',
    'OTHER'
  ]),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters')
    .trim(),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  evidence: z.array(z.string().url('Invalid evidence URL'))
    .max(10, 'Maximum 10 evidence files allowed')
    .optional()
    .default([]),
});

export const addDisputeResponseSchema = z.object({
  disputeId: z.string().min(1, 'Dispute ID is required'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .trim(),
  evidence: z.array(z.string().url('Invalid evidence URL'))
    .max(5, 'Maximum 5 evidence files allowed')
    .optional()
    .default([]),
});

export const updateDisputeStatusSchema = z.object({
  disputeId: z.string().min(1, 'Dispute ID is required'),
  status: z.enum(['OPEN', 'IN_REVIEW', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'ESCALATED']),
  resolution: z.string()
    .min(20, 'Resolution must be at least 20 characters')
    .max(1000, 'Resolution must be less than 1000 characters')
    .trim()
    .optional(),
  adminNotes: z.string()
    .max(1000, 'Admin notes must be less than 1000 characters')
    .trim()
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export const disputeQuerySchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'ESCALATED']).optional(),
  category: z.enum([
    'DAMAGE',
    'MISSING_ITEM', 
    'PAYMENT_ISSUE',
    'COMMUNICATION',
    'POLICY_VIOLATION',
    'SAFETY_CONCERN',
    'OTHER'
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['newest', 'oldest', 'priority', 'status']).default('newest'),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type AddDisputeResponseInput = z.infer<typeof addDisputeResponseSchema>;
export type UpdateDisputeStatusInput = z.infer<typeof updateDisputeStatusSchema>;
export type DisputeQuery = z.infer<typeof disputeQuerySchema>;