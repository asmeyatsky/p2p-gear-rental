require('@testing-library/jest-dom');

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