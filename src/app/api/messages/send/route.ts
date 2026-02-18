import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/db';
import { withErrorHandler, AuthorizationError, NotFoundError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const SendMessageBodySchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(10000),
});

export const POST = withErrorHandler(
  withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
    async (request: NextRequest) => {
      const { user } = await authenticateRequest(request);

      const body = await request.json();
      const { conversationId, content } = SendMessageBodySchema.parse(body);

      // Verify the conversation exists and the user is a participant (renter or owner)
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          rental: {
            select: { renterId: true, ownerId: true },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      const { renterId, ownerId } = conversation.rental;
      if (user.id !== renterId && user.id !== ownerId) {
        throw new AuthorizationError('You are not a participant in this conversation');
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      logger.info('Message sent', {
        messageId: message.id,
        conversationId,
      }, 'API');

      return NextResponse.json(message);
    }
  )
);
