// Set up test environment variables first
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

require('@testing-library/jest-dom');

// Mock global fetch and Headers for Stripe
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    headers: new Map(),
  })
) as jest.Mock;

global.Headers = class MockHeaders extends Headers {};

// @ts-ignore
// Mock global Request for Next.js API route tests
global.Request = class MockRequest {
  private _url: string;
  public method: string;
  public headers: Headers;
  private _body: any;

  constructor(url: any, options: any = {}) {
    this._url = url;
    this.method = options.method || 'GET';
    this.headers = new Headers(options.headers || {});
    this._body = options.body;
  }

  get url() {
    return this._url;
  }
  
  async json() {
    return JSON.parse(this._body || '{}');
  }
  
  async text() {
    return this._body || '';
  }

  get body() {
    return this._body;
  }
} as any;

// @ts-ignore
global.Response = class Response {
  constructor(body: any, options: any = {}) {
    (this as any).body = body;
    (this as any).status = options.status || 200;
    (this as any).headers = new Map();
  }
  
  async json() {
    return JSON.parse((this as any).body);
  }

  static json(body: any, options: any = {}) {
    return new Response(JSON.stringify(body), {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...options.headers,
      },
    });
  }
} as any;

// Mock NextResponse for Next.js API route tests
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, options: any = {}) => {
      const response = new Response(JSON.stringify(body), {
        status: options.status || 200,
        headers: {
          'content-type': 'application/json',
          ...options.headers,
        },
      });
      return response;
    },
    redirect: (url: string, status: number = 302) => {
      const response = new Response(null, { status });
      (response as any).headers.set('location', url);
      return response;
    },
  },
  NextRequest: global.Request,
}));

// Suppress expected API errors during tests
const originalConsoleError = console.error;
console.error = jest.fn((message, ...args) => {
  // Only suppress expected API errors during tests
  if (typeof message === 'string' && (
    message.includes('API Error:') ||
    message.includes('ZodError:') ||
    message.includes('ValidationError') ||
    message.includes('AuthenticationError')
  )) {
    return;
  }
  originalConsoleError(message, ...args);
});

// Mock browser APIs only in jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}