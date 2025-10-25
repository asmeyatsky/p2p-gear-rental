// src/infrastructure/security/AuthenticationService.ts
import { supabase } from '../../lib/supabase';
import { logger } from '../logging/CorrelationLogger';

export interface AuthToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  token?: string;
}

export class AuthenticationService {
  async authenticate(request: Request): Promise<AuthResult> {
    try {
      // Get the session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        logger.warn('Authentication failed', {
          error: error?.message,
          url: request.url
        }, 'AUTH');
        
        return {
          success: false,
          error: 'Unauthorized'
        };
      }

      // Validate session
      if (!this.validateSession(session)) {
        logger.warn('Invalid session', {
          sessionId: session.id,
          url: request.url
        }, 'AUTH');
        
        return {
          success: false,
          error: 'Invalid session'
        };
      }

      // Get user details from session
      const user = session.user;

      logger.info('Authentication successful', {
        userId: user.id,
        email: user.email,
        url: request.url
      }, 'AUTH');

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email
        }
      };
    } catch (error) {
      logger.error('Authentication error', {
        error: error instanceof Error ? error.message : String(error),
        url: request.url
      }, 'AUTH');

      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  private validateSession(session: any): boolean {
    if (!session || !session.expires_at) {
      return false;
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    const exp = Math.floor(new Date(session.expires_at).getTime() / 1000);
    
    return exp > now;
  }

  async refreshSession(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error('Session refresh failed', {
          error: error.message
        }, 'AUTH');
        
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.session) {
        return {
          success: false,
          error: 'No session found after refresh'
        };
      }

      logger.info('Session refreshed successfully', {
        sessionId: data.session.id
      }, 'AUTH');

      return {
        success: true,
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
          fullName: data.session.user.user_metadata?.full_name || data.session.user.email
        }
      };
    } catch (error) {
      logger.error('Session refresh error', {
        error: error instanceof Error ? error.message : String(error)
      }, 'AUTH');

      return {
        success: false,
        error: 'Session refresh failed'
      };
    }
  }

  async logout(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Logout failed', {
          userId,
          error: error.message
        }, 'AUTH');
        
        return false;
      }

      logger.info('User logged out successfully', {
        userId
      }, 'AUTH');

      return true;
    } catch (error) {
      logger.error('Logout error', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      }, 'AUTH');

      return false;
    }
  }

  async validateToken(token: string): Promise<AuthToken | null> {
    // In a real implementation, this would validate a JWT token
    // For now, we'll return null as Supabase handles JWT validation internally
    return null;
  }
}