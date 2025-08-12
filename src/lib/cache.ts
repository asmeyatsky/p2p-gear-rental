import Redis from 'ioredis';

// Create Redis client with configuration
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl && process.env.NODE_ENV === 'production') {
    console.warn('Redis URL not configured in production');
    return null;
  }

  try {
    const redis = new Redis(redisUrl || 'redis://localhost:6379', {
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      // Connection pool settings
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Retry settings
      enableOfflineQueue: false,
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    return redis;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
};

export const redis = createRedisClient();

// Cache utility functions
export class CacheManager {
  private static isEnabled(): boolean {
    return redis !== null && redis.status === 'ready';
  }

  static async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null;

    try {
      const cached = await redis!.get(key);
      if (!cached) return null;
      
      return JSON.parse(cached) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(
    key: string, 
    value: any, 
    ttlSeconds: number = 300
  ): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      await redis!.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      await redis!.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  static async delete(key: string): Promise<boolean> {
    return this.del(key);
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isEnabled()) return 0;

    try {
      const keys = await redis!.keys(pattern);
      if (keys.length === 0) return 0;
      
      await redis!.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  static async exists(key: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const result = await redis!.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  // Increment with expiration (useful for rate limiting)
  static async increment(
    key: string, 
    ttlSeconds: number = 60
  ): Promise<number> {
    if (!this.isEnabled()) return 1;

    try {
      const pipeline = redis!.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, ttlSeconds);
      const results = await pipeline.exec();
      
      return results?.[0]?.[1] as number || 1;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 1;
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const result = await redis!.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  // Generate cache keys
  static keys = {
    gear: {
      list: (params: string) => `gear:list:${params}`,
      item: (id: string) => `gear:item:${id}`,
      search: (query: string) => `gear:search:${query}`,
      category: (category: string) => `gear:category:${category}`,
      user: (userId: string) => `gear:user:${userId}`,
      detail: (id: string) => `gear:detail:${id}`,
    },
    rental: {
      list: (userId: string) => `rentals:user:${userId}`,
      item: (id: string) => `rental:item:${id}`,
      user: (userId: string) => `rentals:user:${userId}`,
    },
    user: {
      profile: (id: string) => `user:profile:${id}`,
      stats: (id: string) => `user:stats:${id}`,
    },
    health: 'app:health',
  } as const;

  // TTL configurations (in seconds)
  static TTL = {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes
    LONG: 1800,       // 30 minutes
    VERY_LONG: 3600,  // 1 hour
    DAY: 86400,       // 24 hours
  } as const;
}

// Convenience functions
export const getCached = CacheManager.get;
export const setCache = CacheManager.set;
export const deleteCache = CacheManager.del;
export const invalidateCache = CacheManager.invalidatePattern;