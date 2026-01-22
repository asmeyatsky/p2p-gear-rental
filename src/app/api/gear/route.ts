import { NextResponse, NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { withErrorHandler } from '@/lib/api-error-handler';
import { withMonitoring } from '@/lib/monitoring';
import { rateLimitConfig } from '@/lib/enhanced-rate-limit';
import { prisma } from '@/lib/prisma';
import { createGearSchema } from '@/lib/validations/gear';

export const GET = withErrorHandler(
  withMonitoring(
    async (req: NextRequest) => {
      try {
        const { user } = await authenticateRequest(req);
        
        if (!user) {
          return NextResponse.json(
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

        return NextResponse.json({
          gear,
          total,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < total
          }
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to fetch gear listings' },
          { status: 500 }
        );
      }
    }
  )
);

export const POST = withErrorHandler(
  withMonitoring(
    async (req: NextRequest) => {
      const { user } = await authenticateRequest(req);
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const body = await req.json();
      const validation = createGearSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json({ error: 'Invalid data', details: validation.error.issues }, { status: 400 });
      }

      const {
        title,
        description,
        dailyRate,
        weeklyRate,
        monthlyRate,
        city,
        state,
        images,
        category,
        brand,
        model,
        condition
      } = validation.data;

      const newGear = await prisma.gear.create({
        data: {
          title,
          description,
          dailyRate,
          weeklyRate,
          monthlyRate,
          city,
          state,
          images: images ? JSON.stringify(images) : undefined,
          category,
          brand,
          model,
          condition,
          userId: user.id,
        }
      });

      return NextResponse.json(newGear, { status: 201 });
    }
  )
);