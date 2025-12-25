import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { withErrorHandler, withMonitoring } from '@/lib/middleware';
import { rateLimitConfig } from '@/lib/enhanced-rate-limit';
import { prisma } from '@/lib/prisma';

export const GET = withErrorHandler(
  withMonitoring(
    async (req: NextRequest) => {
      try {
        const { user } = await requireAuth(req);
        
        if (!user) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const category = url.searchParams.get('category');
        const city = url.searchParams.get('city');
        const condition = url.searchParams.get('condition');

        const where: any = { isAvailable: true };
        if (category && category !== 'All') where.category = category;
        if (city) where.city = city;
        if (condition) where.condition = condition;

        const [gear, total] = await Promise.all([
          prisma.gear.findMany({
            where,
            include: {
              user: {
                select: { id: true, email: true, full_name: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
          }),
          prisma.gear.count({ where })
        ]);

        return Response.json({
          gear,
          total,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < total
          }
        });
      } catch (error) {
        return Response.json(
          { error: 'Failed to fetch gear listings' },
          { status: 500 }
        );
      }
    }
  )
);