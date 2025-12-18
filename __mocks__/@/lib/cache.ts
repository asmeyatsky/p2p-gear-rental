// __mocks__/@/lib/cache.ts
// Mock for cache module - returns null/false to simulate cache miss

export const redis = null;

export class CacheManager {
  static get = jest.fn().mockResolvedValue(null);
  static set = jest.fn().mockResolvedValue(false);
  static del = jest.fn().mockResolvedValue(false);
  static invalidatePattern = jest.fn().mockResolvedValue(0);

  static TTL = {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 1800,
    VERY_LONG: 3600,
    DAY: 86400,
  };

  static keys = {
    gear: {
      item: (id: string) => `gear:item:${id}`,
      list: (params: string) => `gear:list:${params}`,
      detail: (id: string) => `gear:detail:${id}`,
    },
    rental: {
      user: (userId: string) => `rental:user:${userId}`,
      item: (id: string) => `rental:item:${id}`,
    },
    user: {
      profile: (id: string) => `user:profile:${id}`,
    },
    search: {
      results: (query: string) => `search:results:${query}`,
    },
  };
}
