import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
  ip?: string;
  userId?: string;
  userAgent?: string;
}

class EnhancedRateLimit {
  private static caches = new Map<string, LRUCache<string, RateLimitEntry>>();
  private static readonly defaultLimit = 100;
  private static readonly defaultWindow = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor(
    private limit: number = EnhancedRateLimit.defaultLimit,
    private windowMs: number = EnhancedRateLimit.defaultWindow
  ) {}

  private getIdentifier(req: NextRequest): string {
    const headers = req.headers;
    
    // Multiple factors for identification
    const forwarded = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const cfConnectingIp = headers.get('cf-connecting-ip');
    const userAgent = headers.get('user-agent');
    const userId = headers.get('x-user-id');
    
    // IP extraction with validation
    let ip = 'unknown';
    if (forwarded) {
      const forwardedIps = forwarded.split(',').map(s => s.trim());
      ip = this.validateIpAddress(forwardedIps[0]) || ip;
    } else if (realIp) {
      ip = this.validateIpAddress(realIp) || ip;
    } else if (cfConnectingIp) {
      ip = this.validateIpAddress(cfConnectingIp) || ip;
    }
    
    // Create composite identifier for better tracking
    const ipHash = this.hashString(ip);
    const uaHash = this.hashString(userAgent || '');
    const userIdHash = userId ? this.hashString(userId) : '';
    
    return `${ipHash}:${uaHash}:${userIdHash}`;
  }

  private validateIpAddress(ip: string): string | null {
    // Basic IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:[0-9]{1,3}|5[0-5]{2}|[0-4][0-9]?)$/;
    
    // Basic IPv6 validation  
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
      return ip;
    }
    
    return null;
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  isAllowed(req: NextRequest): { allowed: boolean; resetTime?: number; headers?: Record<string, string> } {
    const identifier = this.getIdentifier(req);
    
    if (!EnhancedRateLimit.caches.has(identifier)) {
      EnhancedRateLimit.caches.set(identifier, new LRUCache<string, RateLimitEntry>({ max: 100 }));
    }
    
    const cache = EnhancedRateLimit.caches.get(identifier)!;
    const now = Date.now();
    const entry = cache.get(identifier) || {
      count: 0,
      resetTime: now + this.windowMs,
      lastAccess: now
    };

    // Reset window if expired
    if (now > entry.resetTime) {
      cache.clear();
      cache.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
        lastAccess: now
      });
      
      return {
        allowed: true,
        headers: {
          'X-RateLimit-Limit': this.limit.toString(),
          'X-RateLimit-Remaining': (this.limit - 1).toString(),
          'X-RateLimit-Reset': new Date(entry.resetTime).toUTCString(),
        }
      };
    }

    // Update access time
    entry.lastAccess = now;
    cache.set(identifier, entry);

    if (entry.count >= this.limit) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        headers: {
          'X-RateLimit-Limit': this.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toUTCString(),
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
        }
      };
    }

    entry.count++;
    cache.set(identifier, entry);

    return {
      allowed: entry.count < this.limit,
      headers: {
        'X-RateLimit-Limit': this.limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, this.limit - entry.count).toString(),
        'X-RateLimit-Reset': new Date(entry.resetTime).toUTCString(),
      }
    };
  }

  // Clear old entries periodically
  static cleanup(): void {
    const now = Date.now();
    for (const [key, cache] of EnhancedRateLimit.caches.entries()) {
      const entries = Array.from(cache.entries()) as [string, RateLimitEntry][];
      entries.forEach(([id, entry]) => {
        if (now - entry.lastAccess > this.defaultWindow * 2) {
          cache.delete(id);
        }
      });
    }
  }
}

// Predefined rate limiters
export const strictRateLimit = new EnhancedRateLimit(10, 5 * 60 * 1000); // 10 per 5 minutes
export const authRateLimit = new EnhancedRateLimit(5, 15 * 60 * 1000); // 5 per 15 minutes  
export const searchRateLimit = new EnhancedRateLimit(30, 1 * 60 * 1000); // 30 per minute
export const uploadRateLimit = new EnhancedRateLimit(5, 60 * 60 * 1000); // 5 per hour

// Rate limiting configuration
export const rateLimitConfig = {
  general: {
    limiter: strictRateLimit,
    limit: 100,
    window: '15 minutes',
    description: 'General API requests'
  },
  auth: {
    limiter: authRateLimit,
    limit: 5,
    window: '15 minutes', 
    description: 'Authentication attempts'
  },
  search: {
    limiter: searchRateLimit,
    limit: 30,
    window: '1 minute',
    description: 'Search requests'
  },
  upload: {
    limiter: uploadRateLimit,
    limit: 5,
    window: '1 hour',
    description: 'File uploads'
  }
};

// Cleanup old rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => EnhancedRateLimit.cleanup(), 5 * 60 * 1000);
}