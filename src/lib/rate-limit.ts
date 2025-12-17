import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';
import { RateLimitError } from './api-error-handler';
import { logger } from './logger';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
};

class RateLimiter {
  private cache: LRUCache<string, number[]>;
  private options: Required<Options>;

  constructor(options: Options = {}) {
    this.options = {
      uniqueTokenPerInterval: options.uniqueTokenPerInterval || 500,
      interval: options.interval || 60000, // 1 minute default
      skipFailedRequests: options.skipFailedRequests || false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    };

    this.cache = new LRUCache({
      max: this.options.uniqueTokenPerInterval,
      ttl: this.options.interval,
    });
  }

  async check(token: string, limit: number): Promise<{ success: boolean; limit: number; remaining: number; resetTime: Date }> {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const resetTime = new Date(now + this.options.interval);
      
      let tokenCount = this.cache.get(token) || [];
      
      // Clean old requests outside the current window
      tokenCount = tokenCount.filter(time => now - time < this.options.interval);
      
      const currentUsage = tokenCount.length;
      const remaining = Math.max(0, limit - currentUsage - 1);
      
      if (currentUsage >= limit) {
        reject(new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(this.options.interval / 1000)} seconds.`));
        return;
      }

      // Add current request
      tokenCount.push(now);
      this.cache.set(token, tokenCount);

      resolve({
        success: true,
        limit,
        remaining,
        resetTime,
      });
    });
  }
}

// Pre-configured rate limiters for different use cases
export const strictRateLimit = new RateLimiter({
  uniqueTokenPerInterval: 500,
  interval: 60000, // 1 minute
});

export const authRateLimit = new RateLimiter({
  uniqueTokenPerInterval: 100,
  interval: 900000, // 15 minutes for auth endpoints
});

export const searchRateLimit = new RateLimiter({
  uniqueTokenPerInterval: 1000,
  interval: 60000, // 1 minute for search
});

// Helper to get client identifier from request
export function getClientIdentifier(req: NextRequest): string {
  // Try to get the real IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
  
  // For authenticated requests, we could also use user ID
  // but for now, we'll just use IP
  return ip.trim();
}

// Specific rate limit configurations
export const rateLimitConfig = {
  // General API endpoints
  general: { limiter: strictRateLimit, limit: 100 }, // 100 requests per minute
  
  // Authentication endpoints (more restrictive)
  auth: { limiter: authRateLimit, limit: 5 }, // 5 attempts per 15 minutes
  
  // Search endpoints (more permissive)
  search: { limiter: searchRateLimit, limit: 1000 }, // 1000 requests per minute
  
  // File upload endpoints (very restrictive)
  upload: { limiter: strictRateLimit, limit: 10 }, // 10 uploads per minute
  
  // Payment endpoints (restrictive)
  payment: { limiter: authRateLimit, limit: 10 }, // 10 payment requests per 15 minutes
  
  // Health check endpoints (permissive)
  health: { limiter: strictRateLimit, limit: 50 }, // 50 health checks per minute
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RateLimitHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

export function withRateLimit(limiter: RateLimiter, limit: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handler: RateLimitHandler) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
      const identifier = getClientIdentifier(req);
      try {
        await limiter.check(identifier, limit);
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw error;
        }
        logger.error('Unexpected rate limiting error', { error }, 'API');
        throw new Error('An unexpected error occurred during rate limiting.');
      }
      return handler(req, context);
    };
  };
}
