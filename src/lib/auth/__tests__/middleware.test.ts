/**
 * @jest-environment node
 */

// Mock dependencies BEFORE importing the modules
const mockGetSession = jest.fn();
const mockUpsert = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: mockUpsert,
      findUnique: mockFindUnique,
    },
    gear: {
      findUnique: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  requireAuth,
  requireRole,
  requireAdmin,
  requireVerifiedEmail,
  requireOwnership,
  checkUserStatus,
  sanitizeInput,
} from '../middleware';
import { prisma } from '@/lib/prisma';
import { AuthenticationError, AuthorizationError } from '@/lib/api-error-handler';

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return auth context for valid session', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01T00:00:00.000Z',
          user_metadata: {
            full_name: 'Test User',
            role: 'user'
          }
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUpsert.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User'
      });

      const authContext = await requireAuth();

      expect(authContext).toEqual({
        userId: 'user-1',
        userEmail: 'test@example.com',
        userRole: 'user',
        isVerified: true
      });

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        update: {
          email: 'test@example.com',
          full_name: 'Test User',
          updatedAt: expect.any(Date)
        },
        create: {
          id: 'user-1',
          email: 'test@example.com',
          full_name: 'Test User'
        }
      });
    });

    it('should throw AuthenticationError for missing session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(requireAuth()).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for expired session', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com'
        },
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      await expect(requireAuth()).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for Supabase errors', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' }
      });

      await expect(requireAuth()).rejects.toThrow(AuthenticationError);
    });

    it('should handle database errors during user upsert', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01T00:00:00.000Z'
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUpsert.mockRejectedValue(new Error('Database error'));

      await expect(requireAuth()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('requireRole', () => {
    it('should allow access for users with correct role', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          email_confirmed_at: '2024-01-01T00:00:00.000Z',
          user_metadata: {
            role: 'admin'
          }
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUpsert.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com'
      });

      const authContext = await requireRole(['admin', 'moderator']);

      expect(authContext.userRole).toBe('admin');
    });

    it('should throw AuthorizationError for insufficient role', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          email_confirmed_at: '2024-01-01T00:00:00.000Z',
          user_metadata: {
            role: 'user'
          }
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUpsert.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com'
      });

      await expect(requireRole(['admin'])).rejects.toThrow(AuthorizationError);
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin users', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          email_confirmed_at: '2024-01-01T00:00:00.000Z',
          user_metadata: {
            role: 'admin'
          }
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUpsert.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com'
      });

      const authContext = await requireAdmin();

      expect(authContext.userRole).toBe('admin');
    });
  });

  describe('requireVerifiedEmail', () => {
    it('should allow access for verified users', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'verified@example.com',
          email_confirmed_at: '2024-01-01T00:00:00.000Z'
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUpsert.mockResolvedValue({
        id: 'user-1',
        email: 'verified@example.com'
      });

      const authContext = await requireVerifiedEmail();

      expect(authContext.isVerified).toBe(true);
    });

    it('should throw AuthorizationError for unverified users', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'unverified@example.com',
          email_confirmed_at: null
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockUpsert.mockResolvedValue({
        id: 'user-1',
        email: 'unverified@example.com'
      });

      await expect(requireVerifiedEmail()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('requireOwnership', () => {
    const mockAuthContext = {
      userId: 'user-1',
      userEmail: 'test@example.com',
      userRole: 'user',
      isVerified: true
    };

    it('should allow access for gear owner', async () => {
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue({
        id: 'gear-1',
        userId: 'user-1'
      });

      const authContext = await requireOwnership('gear', 'gear-1', mockAuthContext);

      expect(authContext.userId).toBe('user-1');
    });

    it('should allow access for rental participant', async () => {
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue({
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2'
      });

      const authContext = await requireOwnership('rental', 'rental-1', mockAuthContext);

      expect(authContext.userId).toBe('user-1');
    });

    it('should throw AuthorizationError for non-owners', async () => {
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue({
        id: 'gear-1',
        userId: 'user-2' // Different user
      });

      await expect(
        requireOwnership('gear', 'gear-1', mockAuthContext)
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError for non-existent resources', async () => {
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        requireOwnership('gear', 'gear-1', mockAuthContext)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('checkUserStatus', () => {
    const mockAuthContext = {
      userId: 'user-1',
      userEmail: 'test@example.com',
      userRole: 'user',
      isVerified: true
    };

    it('should pass for existing users', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date()
      });

      await expect(checkUserStatus(mockAuthContext)).resolves.not.toThrow();
    });

    it('should throw AuthorizationError for non-existent users', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(checkUserStatus(mockAuthContext)).rejects.toThrow(AuthorizationError);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters from strings', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('Hello');
    });

    it('should remove javascript protocols', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);

      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const result = sanitizeInput(input);

      expect(result).not.toContain('onclick=');
    });

    it('should handle arrays recursively', () => {
      const input = ['<script>test</script>', 'safe string'];
      const result = sanitizeInput(input);

      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('safe string');
    });

    it('should handle objects recursively', () => {
      const input = {
        dangerous: '<script>alert("xss")</script>',
        safe: 'normal text',
        nested: {
          moreDangerous: 'javascript:void(0)'
        }
      };

      const result = sanitizeInput(input);

      expect(result.dangerous).not.toContain('<script>');
      expect(result.safe).toBe('normal text');
      expect(result.nested.moreDangerous).not.toContain('javascript:');
    });

    it('should handle non-string primitives', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(true)).toBe(true);
      expect(sanitizeInput(null)).toBe(null);
    });
  });
});