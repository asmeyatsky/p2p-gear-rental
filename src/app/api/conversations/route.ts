import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';

// GET: List conversations for the authenticated user
export const GET = withErrorHandler(
  withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
    async (request: NextRequest) => {
      const { user } = await authenticateRequest(request);

      // Fetch conversations where the authenticated user is renter or owner of the linked rental
      const conversations = await prisma.conversation.findMany({
        where: {
          rental: {
            OR: [
              { renterId: user.id },
              { ownerId: user.id },
            ],
          },
        },
        include: {
          rental: {
            select: {
              id: true,
              renterId: true,
              ownerId: true,
              gear: {
                select: { id: true, title: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({ conversations });
    }
  )
);
