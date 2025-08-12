require('@testing-library/jest-dom');

// @ts-ignore
// Mock global Request and Response for Next.js API route tests
global.Request = class Request {
  constructor(url: any, options: any = {}) {
    (this as any).url = url;
    (this as any).method = options.method || 'GET';
    (this as any).headers = new Map();
    (this as any)._body = options.body;
  }
  
  async json() {
    return JSON.parse((this as any)._body);
  }
  
  async text() {
    return (this as any)._body;
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
} as any;