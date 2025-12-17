import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Add comprehensive security headers
  addSecurityHeaders(res, req);

  // Check if Supabase credentials are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let session = null;

  // Only attempt Supabase auth if credentials are properly configured
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            });
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: '',
              ...options,
            });
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            res.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Refresh session if expired - required for Server Components
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch (error) {
      console.warn('Supabase auth check failed:', error);
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/my-rentals',
    '/gear/new',
    '/gear/edit',
    '/profile',
    '/dashboard'
  ];

  // Check if current path requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/auth/login', '/auth/signup'];
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && session) {
    const redirectTo = req.nextUrl.searchParams.get('redirectTo') || '/';
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  return res;
}

/**
 * Add comprehensive security headers to the response
 */
function addSecurityHeaders(response: NextResponse, request: NextRequest): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Security Headers
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  );

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.mapbox.com *.stripe.com js.stripe.com",
    "style-src 'self' 'unsafe-inline' *.mapbox.com fonts.googleapis.com",
    "font-src 'self' data: fonts.gstatic.com",
    "img-src 'self' data: blob: *.supabase.co *.mapbox.com *.stripe.com",
    "connect-src 'self' *.supabase.co wss://*.supabase.co *.mapbox.com *.stripe.com api.mapbox.com",
    "frame-src 'self' js.stripe.com hooks.stripe.com",
    "media-src 'self' blob: *.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  // In development, allow additional sources for HMR
  if (isDevelopment) {
    cspDirectives.push("connect-src 'self' *.supabase.co wss://*.supabase.co *.mapbox.com *.stripe.com api.mapbox.com ws://localhost:* wss://localhost:*");
  } else {
    cspDirectives.push("upgrade-insecure-requests");
  }

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Strict Transport Security (HTTPS only in production)
  if (!isDevelopment && request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security', 
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // API specific headers
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Prevent caching of sensitive API responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // CORS headers
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (isDevelopment) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // Security monitoring - log suspicious requests
  const suspiciousPatterns = [
    '/wp-admin', '/.env', '/config', 'eval(', '<script', 'javascript:', 'onload=', 'onerror='
  ];

  const url = request.nextUrl.pathname + request.nextUrl.search;
  const userAgent = request.headers.get('user-agent') || '';

  if (suspiciousPatterns.some(pattern => 
    url.toLowerCase().includes(pattern.toLowerCase()) ||
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  )) {
    console.warn('[SECURITY] Suspicious request detected', {
      url: request.nextUrl.pathname,
      userAgent: userAgent.substring(0, 200),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};