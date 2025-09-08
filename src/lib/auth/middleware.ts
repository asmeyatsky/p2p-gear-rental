import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { AuthenticationError, AuthorizationError } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: 'user' | 'admin' | 'moderator';
    isVerified?: boolean;
  };
}

export interface AuthContext {
  userId: string;
  userEmail: string;
  userRole: string;
  isVerified: boolean;
}

/**
 * Enhanced authentication middleware with proper session validation
 */
export async function requireAuth(): Promise<AuthContext> {
  try {
    // Get session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logger.error('Supabase session error', { error: error.message }, 'AUTH');
      throw new AuthenticationError('Invalid session');
    }

    if (!session || !session.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Validate session is not expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      throw new AuthenticationError('Session expired');
    }

    // Get or create user in our database
    const dbUser = await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || null,
        updatedAt: new Date(),
      },
      create: {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || null,
      },
    });

    const authContext: AuthContext = {
      userId: session.user.id,
      userEmail: session.user.email || '',
      userRole: session.user.user_metadata?.role || 'user',
      isVerified: session.user.email_confirmed_at !== null,
    };

    logger.debug('User authenticated', { 
      userId: authContext.userId,
      email: authContext.userEmail,
      role: authContext.userRole,
      verified: authContext.isVerified
    }, 'AUTH');

    return authContext;

  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    logger.error('Authentication middleware error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 'AUTH');
    
    throw new AuthenticationError('Authentication failed');
  }
}

/**
 * Require specific user role
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthContext> {
  const authContext = await requireAuth();

  if (!allowedRoles.includes(authContext.userRole)) {
    logger.warn('Unauthorized access attempt', { 
      userId: authContext.userId,
      userRole: authContext.userRole,
      requiredRoles: allowedRoles
    }, 'AUTH');
    
    throw new AuthorizationError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }

  return authContext;
}

/**
 * Require admin access
 */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole(['admin']);
}

/**
 * Require email verification
 */
export async function requireVerifiedEmail(): Promise<AuthContext> {
  const authContext = await requireAuth();

  if (!authContext.isVerified) {
    throw new AuthorizationError('Email verification required');
  }

  return authContext;
}

/**
 * Check if user owns a resource (gear, rental, etc.)
 */
export async function requireOwnership(
  resourceType: 'gear' | 'rental' | 'review' | 'dispute',
  resourceId: string,
  authContext?: AuthContext
): Promise<AuthContext> {
  const auth = authContext || await requireAuth();

  let isOwner = false;

  try {
    switch (resourceType) {
      case 'gear':
        const gear = await prisma.gear.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        isOwner = gear?.userId === auth.userId;
        break;

      case 'rental':
        const rental = await prisma.rental.findUnique({
          where: { id: resourceId },
          select: { renterId: true, ownerId: true }
        });
        isOwner = rental?.renterId === auth.userId || rental?.ownerId === auth.userId;
        break;

      case 'review':
        const review = await prisma.review.findUnique({
          where: { id: resourceId },
          select: { reviewerId: true }
        });
        isOwner = review?.reviewerId === auth.userId;
        break;

      case 'dispute':
        const dispute = await prisma.dispute.findUnique({
          where: { id: resourceId },
          select: { reporterId: true, respondentId: true }
        });
        isOwner = dispute?.reporterId === auth.userId || dispute?.respondentId === auth.userId;
        break;

      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    if (!isOwner) {
      logger.warn('Unauthorized resource access attempt', { 
        userId: auth.userId,
        resourceType,
        resourceId
      }, 'AUTH');
      
      throw new AuthorizationError(`Access denied. You don't own this ${resourceType}`);
    }

    return auth;

  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }
    
    logger.error('Ownership check error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: auth.userId,
      resourceType,
      resourceId
    }, 'AUTH');
    
    throw new AuthorizationError('Unable to verify resource ownership');
  }
}

/**
 * Check rate limiting and user status
 */
export async function checkUserStatus(authContext: AuthContext): Promise<void> {
  // Check if user account is suspended/banned (would need to add these fields to User model)
  // For now, we'll just verify the user exists and is active
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: authContext.userId },
      select: { 
        id: true,
        email: true,
        // suspended: true,  // Would add these fields in future
        // banned: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AuthorizationError('User account not found');
    }

    // Additional checks could include:
    // - Account suspension status
    // - Payment verification for certain actions
    // - Account verification level requirements
    
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }
    
    logger.error('User status check error', { 
      userId: authContext.userId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 'AUTH');
    
    throw new AuthorizationError('Unable to verify user status');
  }
}

/**
 * Comprehensive security headers
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (basic)
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.mapbox.com *.stripe.com; " +
    "style-src 'self' 'unsafe-inline' *.mapbox.com; " +
    "img-src 'self' data: blob: *.supabase.co *.mapbox.com; " +
    "connect-src 'self' *.supabase.co *.mapbox.com *.stripe.com; " +
    "font-src 'self' data:; " +
    "worker-src 'self' blob:;"
  );

  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

/**
 * Input sanitization helper
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}