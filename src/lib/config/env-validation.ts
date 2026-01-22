import { z } from 'zod';

const requiredEnvVars = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  STRIPE_SECRET_KEY: z.string().min(10, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(10, 'STRIPE_WEBHOOK_SECRET is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(10, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required'),
});

const optionalEnvVars = z.object({
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).optional(),
  METRICS_API_TOKEN: z.string().optional(),
});

export function validateEnvironment() {
  try {
    // Validate required environment variables
    const required = requiredEnvVars.parse(process.env);
    
    // Validate optional environment variables
    const optional = optionalEnvVars.safeParse(process.env);
    
    if (optional.success) {
      console.log('✅ All environment variables validated successfully');
      return { valid: true, config: { ...required, ...optional.data } };
    } else {
      console.error('❌ Environment variable validation errors:', optional.error.issues);
      throw new Error(`Invalid environment variables: ${optional.error.issues.map(i => i.message).join(', ')}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Critical environment variables missing:', errorMessage);
    throw new Error('Application cannot start without required environment variables');
  }
}

export type EnvironmentConfig = z.infer<typeof requiredEnvVars> & Partial<z.infer<typeof optionalEnvVars>>;