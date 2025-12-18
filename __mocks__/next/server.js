// Mock Headers class
class MockHeaders {
  constructor(init = {}) {
    this._headers = new Map();
    if (init) {
      if (init instanceof Map) {
        for (const [key, value] of init) {
          this._headers.set(key.toLowerCase(), value);
        }
      } else if (typeof init === 'object') {
        for (const [key, value] of Object.entries(init)) {
          this._headers.set(key.toLowerCase(), value);
        }
      }
    }
  }

  get(name) {
    return this._headers.get(name.toLowerCase());
  }

  set(name, value) {
    this._headers.set(name.toLowerCase(), value);
  }

  has(name) {
    return this._headers.has(name.toLowerCase());
  }

  delete(name) {
    return this._headers.delete(name.toLowerCase());
  }

  entries() {
    return this._headers.entries();
  }

  keys() {
    return this._headers.keys();
  }

  values() {
    return this._headers.values();
  }
}

class NextResponse {
  constructor(body = null, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new MockHeaders(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  static json(body, init = {}) {
    const response = new NextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers
      }
    });
    response._jsonBody = body;
    return response;
  }

  static next(init = {}) {
    return new NextResponse(null, { ...init, status: init.status || 200 });
  }

  static redirect(url, init = {}) {
    return new NextResponse(null, {
      ...init,
      status: init.status || 307,
      headers: {
        location: url,
        ...init.headers
      }
    });
  }

  async json() {
    if (this._jsonBody !== undefined) {
      return this._jsonBody;
    }
    try {
      return JSON.parse(this.body || '{}');
    } catch {
      return {};
    }
  }

  async text() {
    return this.body || '';
  }

  clone() {
    return new NextResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: Object.fromEntries(this.headers.entries())
    });
  }
}

class NextRequest {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new MockHeaders(init.headers);
    this.body = init.body;
    
    // Parse URL for nextUrl
    try {
      const parsedUrl = new URL(url);
      this.nextUrl = {
        pathname: parsedUrl.pathname,
        search: parsedUrl.search,
        searchParams: parsedUrl.searchParams,
        href: parsedUrl.href,
        origin: parsedUrl.origin
      };
    } catch {
      this.nextUrl = {
        pathname: '/',
        search: '',
        searchParams: new URLSearchParams(),
        href: url,
        origin: 'http://localhost:3000'
      };
    }
  }

  async json() {
    if (!this.body) return {};
    try {
      return JSON.parse(this.body);
    } catch {
      return {};
    }
  }

  async text() {
    return this.body || '';
  }

  async formData() {
    // Mock FormData implementation
    return new FormData();
  }

  clone() {
    return new NextRequest(this.url, {
      method: this.method,
      headers: Object.fromEntries(this.headers.entries()),
      body: this.body
    });
  }
}

// Export for both CommonJS and ES modules
module.exports = { NextRequest, NextResponse };
module.exports.NextRequest = NextRequest;
module.exports.NextResponse = NextResponse;