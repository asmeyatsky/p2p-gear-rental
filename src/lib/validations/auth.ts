import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
});

export const signInSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  
  password: z.string()
    .min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim()
    .optional(),
  
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .trim()
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
  
  location: z.object({
    city: z.string().max(100).trim().optional(),
    state: z.string().length(2).toUpperCase().optional(),
  }).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;