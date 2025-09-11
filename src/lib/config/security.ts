import { z } from 'zod';

/**
 * Secure configuration schema with validation
 */
const securityConfigSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  
  // Pusher
  PUSHER_APP_ID: z.string().min(1).optional(),
  PUSHER_KEY: z.string().min(1).optional(),
  PUSHER_SECRET: z.string().min(1).optional(),
  PUSHER_CLUSTER: z.string().min(1).optional(),
  NEXT_PUBLIC_PUSHER_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1).optional(),
  
  // Mapbox
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().startsWith('pk.').optional(),
  
  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
  JWT_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: z.coerce.number().positive().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().positive().default(900000), // 15 minutes
  
  // File Upload
  MAX_FILE_SIZE: z.coerce.number().positive().default(5242880), // 5MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  
  // Email/Notifications (optional)
  SENDGRID_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

/**
 * Environment validation with secure fallbacks
 */
export class SecurityConfig {
  private static instance: SecurityConfig;
  private config!: z.infer<typeof securityConfigSchema>;
  
  private constructor() {
    this.validateAndLoadConfig();
  }
  
  public static getInstance(): SecurityConfig {
    if (!SecurityConfig.instance) {
      SecurityConfig.instance = new SecurityConfig();
    }
    return SecurityConfig.instance;
  }
  
  private validateAndLoadConfig(): void {
    try {
      // Load environment variables
      const rawConfig = {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        REDIS_URL: process.env.REDIS_URL,
        PUSHER_APP_ID: process.env.PUSHER_APP_ID,
        PUSHER_KEY: process.env.PUSHER_KEY,
        PUSHER_SECRET: process.env.PUSHER_SECRET,
        PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
        NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
        NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,
        JWT_SECRET: process.env.JWT_SECRET,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
        RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS,
        RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
        ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
      };
      
      // Validate configuration
      this.config = securityConfigSchema.parse(rawConfig);
      
      // Additional security checks for production
      if (this.config.NODE_ENV === 'production') {
        this.validateProductionConfig();
      }
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.issues.map(e => e.path.join('.')).join(', ');
        throw new Error(`Invalid or missing environment variables: ${missingVars}`);
      }
      throw error;
    }
  }
  
  private validateProductionConfig(): void {
    const requiredForProduction = [
      'NEXTAUTH_SECRET',
      'JWT_SECRET', 
      'ENCRYPTION_KEY',
      'REDIS_URL'
    ];
    
    const missing = requiredForProduction.filter(key => 
      !this.config[key as keyof typeof this.config]
    );
    
    if (missing.length > 0) {
      throw new Error(`Production deployment missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Validate secret strength
    if (this.config.NEXTAUTH_SECRET && this.config.NEXTAUTH_SECRET.length < 32) {
      throw new Error('NEXTAUTH_SECRET must be at least 32 characters in production');
    }
  }
  
  // Secure getters that don't expose sensitive values in logs
  public get database(): { url: string } {
    return { url: this.config.DATABASE_URL };
  }
  
  public get supabase(): { url: string; anonKey: string } {
    return {
      url: this.config.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
  }
  
  public get stripe(): { secretKey: string; publishableKey: string; webhookSecret: string } {
    return {
      secretKey: this.config.STRIPE_SECRET_KEY,
      publishableKey: this.config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: this.config.STRIPE_WEBHOOK_SECRET
    };
  }
  
  public get redis(): { url?: string } {
    return { url: this.config.REDIS_URL };
  }
  
  public get pusher(): {
    appId?: string;
    key?: string;
    secret?: string;
    cluster?: string;
    publicKey?: string;
    publicCluster?: string;
  } {
    return {
      appId: this.config.PUSHER_APP_ID,
      key: this.config.PUSHER_KEY,
      secret: this.config.PUSHER_SECRET,
      cluster: this.config.PUSHER_CLUSTER,
      publicKey: this.config.NEXT_PUBLIC_PUSHER_KEY,
      publicCluster: this.config.NEXT_PUBLIC_PUSHER_CLUSTER
    };
  }
  
  public get security(): {
    bcryptSaltRounds: number;
    jwtSecret?: string;
    encryptionKey?: string;
    nextAuthSecret?: string;
  } {
    return {
      bcryptSaltRounds: this.config.BCRYPT_SALT_ROUNDS,
      jwtSecret: this.config.JWT_SECRET,
      encryptionKey: this.config.ENCRYPTION_KEY,
      nextAuthSecret: this.config.NEXTAUTH_SECRET
    };
  }
  
  public get rateLimiting(): {
    requests: number;
    windowMs: number;
  } {
    return {
      requests: this.config.RATE_LIMIT_REQUESTS,
      windowMs: this.config.RATE_LIMIT_WINDOW
    };
  }
  
  public get fileUpload(): {
    maxSize: number;
    allowedTypes: string[];
  } {
    return {
      maxSize: this.config.MAX_FILE_SIZE,
      allowedTypes: this.config.ALLOWED_FILE_TYPES.split(',')
    };
  }
  
  public get environment(): string {
    return this.config.NODE_ENV;
  }
  
  public get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }
  
  public get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }
  
  // Safe method to check if a service is configured
  public isConfigured(service: 'redis' | 'pusher' | 'mapbox' | 'email'): boolean {
    switch (service) {
      case 'redis':
        return !!this.config.REDIS_URL;
      case 'pusher':
        return !!(this.config.PUSHER_APP_ID && this.config.PUSHER_KEY && this.config.PUSHER_SECRET);
      case 'mapbox':
        return !!this.config.NEXT_PUBLIC_MAPBOX_TOKEN;
      case 'email':
        return !!(this.config.SENDGRID_API_KEY || (this.config.SMTP_HOST && this.config.SMTP_USER));
      default:
        return false;
    }
  }
}

// Export singleton instance
export const securityConfig = SecurityConfig.getInstance();

/**
 * Redact sensitive information from objects for logging
 */
export function redactSensitive(obj: any): any {
  const sensitiveKeys = [
    'password', 'secret', 'key', 'token', 'auth', 'credential',
    'DATABASE_URL', 'STRIPE_SECRET_KEY', 'PUSHER_SECRET', 'JWT_SECRET',
    'NEXTAUTH_SECRET', 'ENCRYPTION_KEY'
  ];
  
  if (typeof obj === 'string') {
    return sensitiveKeys.some(key => 
      obj.toLowerCase().includes(key.toLowerCase())
    ) ? '[REDACTED]' : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactSensitive);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = sensitiveKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      );
      redacted[key] = isSensitive ? '[REDACTED]' : redactSensitive(value);
    }
    return redacted;
  }
  
  return obj;
}