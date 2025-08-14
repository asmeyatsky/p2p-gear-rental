import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/api-error-handler';

// For API routes, we'll still use the legacy client for now to avoid breaking changes
// TODO: Migrate to cookies-based authentication for API routes

export interface AuthenticatedRequest extends NextRequest {
  user: User;
  session: Session;
}

/**
 * Get the current authenticated user from the request
 * Throws AuthenticationError if user is not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{ user: User; session: Session }> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new AuthenticationError(`Authentication error: ${error.message}`);
  }
  
  if (!session || !session.user) {
    throw new AuthenticationError();
  }
  
  return { user: session.user, session };
}

/**
 * Check if the user is authenticated, returns null if not
 * Use this for optional authentication
 */
export async function getCurrentUser(): Promise<{ user: User; session: Session } | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session || !session.user) {
      return null;
    }
    
    return { user: session.user, session };
  } catch (error) {
    return null;
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: User, session: Session, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const { user, session } = await getAuthenticatedUser(request);
    return handler(request, user, session, ...args);
  };
}

/**
 * Check if user has permission to access a resource
 */
export function checkResourcePermission(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Extract user information from JWT token for server-side rendering
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Validate and refresh session if needed
 */
export async function validateSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Sign out user and clear session
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}