// src/infrastructure/cache/MultiLevelCache.ts
import { CacheManager } from '../../lib/cache';

export interface CacheConfig {
  ttl?: number;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface CacheLevel {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, config?: CacheConfig): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class MultiLevelCache {
  constructor(
    private l1Cache: CacheLevel, // In-memory cache (e.g., LRU)
    private l2Cache: CacheLevel, // Redis cache
    private l3Cache?: CacheLevel  // Optional CDN/edge cache
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // Try L1 cache first
    let result = await this.l1Cache.get<T>(key);
    if (result !== null) {
      return result;
    }

    // Try L2 cache
    result = await this.l2Cache.get<T>(key);
    if (result !== null) {
      // Warm up L1 cache
      await this.l1Cache.set(key, result);
      return result;
    }

    // Try L3 cache if available
    if (this.l3Cache) {
      result = await this.l3Cache.get<T>(key);
      if (result !== null) {
        // Warm up L1 and L2 caches
        await this.l2Cache.set(key, result);
        await this.l1Cache.set(key, result);
        return result;
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, config?: CacheConfig): Promise<boolean> {
    let success = true;

    // Set in L1 cache
    success = await this.l1Cache.set(key, value, config) && success;

    // Set in L2 cache
    success = await this.l2Cache.set(key, value, config) && success;

    // Set in L3 cache if available
    if (this.l3Cache) {
      success = await this.l3Cache.set(key, value, config) && success;
    }

    return success;
  }

  async delete(key: string): Promise<boolean> {
    let success = true;

    success = await this.l1Cache.delete(key) && success;
    success = await this.l2Cache.delete(key) && success;

    if (this.l3Cache) {
      success = await this.l3Cache.delete(key) && success;
    }

    return success;
  }

  async exists(key: string): Promise<boolean> {
    // Check if exists in any level
    return await this.l1Cache.exists(key) || 
           await this.l2Cache.exists(key) || 
           (this.l3Cache ? await this.l3Cache.exists(key) : false);
  }

  async clear(): Promise<void> {
    await this.l1Cache.clear();
    await this.l2Cache.clear();
    if (this.l3Cache) {
      await this.l3Cache.clear();
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    // This would involve maintaining tag-to-key mappings
    // Implementation would depend on the specific cache implementation
    return 0; // Placeholder
  }
}