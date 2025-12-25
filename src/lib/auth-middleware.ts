import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiError, AuthenticationError, AuthorizationError } from '@/lib/api-error-handler';

export async function authenticateRequest(req: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new AuthenticationError('Authentication required');
    }

    return {
      user: session.user,
      session
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw new AuthenticationError('Invalid authentication session');
  }
}

export function requireAuth(handler: (req: NextRequest, context: { user: any; session: any }) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      const auth = await authenticateRequest(req);
      return await handler(req, { user: auth.user, session: auth.session });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return Response.json(
          { error: error.message, code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      } else if (error instanceof AuthorizationError) {
        return Response.json(
          { error: error.message, code: 'INSUFFICIENT_PERMISSIONS' },
          { status: 403 }
        );
      } else {
        throw error;
      }
    }
  };
}

export function optionalAuth(handler: (req: NextRequest, context: { user?: any; session?: any } = {}) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      const auth = await authenticateRequest(req);
      return await handler(req, { user: auth.user, session: auth.session });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return await handler(req, { user: undefined, session: undefined });
      } else {
        throw error;
      }
    }
  };
}

export function requireOwnership(resourceType: string, handler: (req: NextRequest, context: any) => Promise<Response>) {
  return async (req: NextRequest, context: any) => {
    try {
      const { user } = await authenticateRequest(req);
      const resourceId = req.nextUrl.searchParams.get('id');
      
      if (!resourceId) {
        throw new AuthorizationError(`${resourceType} ID is required`);
      }

      // Check ownership based on resource type
      let hasOwnership = false;
      if (resourceType === 'gear') {
        const gear = await prisma.gear.findUnique({
          where: { id: resourceId, userId: user.id }
        });
        hasOwnership = !!gear;
      } else if (resourceType === 'rental') {
        const rental = await prisma.rental.findUnique({
          where: { id: resourceId, renterId: user.id }
        });
        hasOwnership = !!rental;
      }

      if (!hasOwnership) {
        throw new AuthorizationError(`You do not have permission to access this ${resourceType}`);
      }

      return await handler(req, { user, ...context });
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error;
      } else {
        throw new AuthorizationError('Ownership verification failed');
      }
    }
  };
}