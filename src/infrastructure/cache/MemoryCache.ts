// src/infrastructure/cache/MemoryCache.ts
import { LRUCache } from 'lru-cache';
import { CacheLevel, CacheConfig } from './MultiLevelCache';

export class MemoryCache implements CacheLevel {
  private cache: LRUCache<string, any>;

  constructor(options?: LRUCache.Options<string, any>) {
    this.cache = new LRUCache({
      max: 1000, // Default max items
      ttl: 300000, // Default 5 minutes
      ...options,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get(key);
    return value !== undefined ? value as T : null;
  }

  async set<T>(key: string, value: T, config?: CacheConfig): Promise<boolean> {
    const ttl = config?.ttl || this.cache.ttl;
    this.cache.set(key, value, { ttl });
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  // Additional methods for cache management
  size(): number {
    return this.cache.size;
  }

  dump(): LRUCacheDump<string, any> {
    return this.cache.dump();
  }
}