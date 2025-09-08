/**
 * @jest-environment node
 */

import {
  requireAuth,
  requireRole,
  requireAdmin,
  requireVerifiedEmail,
  requireOwnership,
  checkUserStatus,
  sanitizeInput,
} from '../middleware';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { AuthenticationError, AuthorizationError } from '@/lib/api-error-handler';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/prisma');
jest.mock('@/lib/logger');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      } as any);

      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User'
      } as any);

      const authContext = await requireAuth();

      expect(authContext).toEqual({
        userId: 'user-1',
        userEmail: 'test@example.com',
        userRole: 'user',
        isVerified: true
      });

      expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
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
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      } as any);

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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      } as any);

      await expect(requireAuth()).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for Supabase errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' }
      } as any);

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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      } as any);

      mockPrisma.user.upsert.mockRejectedValue(new Error('Database error'));

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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      } as any);

      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com'
      } as any);

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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      } as any);

      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com'
      } as any);

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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      } as any);

      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com'
      } as any);

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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      } as any);

      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'verified@example.com'
      } as any);

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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      } as any);

      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        email: 'unverified@example.com'
      } as any);

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
      mockPrisma.gear.findUnique.mockResolvedValue({
        id: 'gear-1',
        userId: 'user-1'
      } as any);

      const authContext = await requireOwnership('gear', 'gear-1', mockAuthContext);

      expect(authContext.userId).toBe('user-1');
    });

    it('should allow access for rental participant', async () => {
      mockPrisma.rental.findUnique.mockResolvedValue({
        id: 'rental-1',
        renterId: 'user-1',
        ownerId: 'user-2'
      } as any);

      const authContext = await requireOwnership('rental', 'rental-1', mockAuthContext);

      expect(authContext.userId).toBe('user-1');
    });

    it('should throw AuthorizationError for non-owners', async () => {
      mockPrisma.gear.findUnique.mockResolvedValue({
        id: 'gear-1',
        userId: 'user-2' // Different user
      } as any);

      await expect(
        requireOwnership('gear', 'gear-1', mockAuthContext)
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError for non-existent resources', async () => {
      mockPrisma.gear.findUnique.mockResolvedValue(null);

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
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date()
      } as any);

      await expect(checkUserStatus(mockAuthContext)).resolves.not.toThrow();
    });

    it('should throw AuthorizationError for non-existent users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

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