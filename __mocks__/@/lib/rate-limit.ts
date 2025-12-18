// __mocks__/@/lib/rate-limit.ts
// Pass-through mock for rate-limit module

class MockRateLimiter {
  check = jest.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    resetTime: new Date(),
  });
}

export const strictRateLimit = new MockRateLimiter();
export const authRateLimit = new MockRateLimiter();
export const searchRateLimit = new MockRateLimiter();

export function getClientIdentifier() {
  return 'test-client';
}

// Pass-through implementation - calls the handler directly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withRateLimit(_limiter: any, _limit: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handler: (req: any, context?: any) => Promise<any>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (req: any, context?: any) => {
      return handler(req, context);
    };
  };
}

export const rateLimitConfig = {
  general: {
    limiter: new MockRateLimiter(),
    limit: 100,
  },
  auth: {
    limiter: new MockRateLimiter(),
    limit: 10,
  },
  search: {
    limiter: new MockRateLimiter(),
    limit: 50,
  },
  strict: {
    limiter: new MockRateLimiter(),
    limit: 5,
  },
  payment: {
    limiter: new MockRateLimiter(),
    limit: 10,
  },
};
