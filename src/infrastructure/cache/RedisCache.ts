// src/infrastructure/cache/RedisCache.ts
import { CacheLevel, CacheConfig } from './MultiLevelCache';
import { redis } from '../../lib/cache'; // Using the existing Redis instance

export class RedisCache implements CacheLevel {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, config?: CacheConfig): Promise<boolean> {
    if (!redis) return false;

    try {
      const ttl = config?.ttl || 300; // Default 5 minutes
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!redis) return;

    try {
      // Note: This is dangerous in production - use with caution
      // In production, you'd want to use a pattern to clear only app-specific keys
      await redis.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  // Redis-specific methods
  async invalidatePattern(pattern: string): Promise<number> {
    if (!redis) return 0;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Redis invalidate pattern error for ${pattern}:`, error);
      return 0;
    }
  }
}