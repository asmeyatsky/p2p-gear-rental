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
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
        const page = parseInt(url.searchParams.get('page') || '1');
        const offset = (page - 1) * limit;

        const category  = url.searchParams.get('category');
        const city      = url.searchParams.get('city');
        const state     = url.searchParams.get('state');
        const condition = url.searchParams.get('condition');
        const minPrice  = url.searchParams.get('minPrice');
        const maxPrice  = url.searchParams.get('maxPrice');
        const sortBy    = url.searchParams.get('sortBy') || 'newest';

        const where: any = { isAvailable: true };
        if (category && category !== 'All') where.category = category;
        if (city)      where.city = city;
        if (state)     where.state = state;
        if (condition) where.condition = condition;
        if (minPrice || maxPrice) {
          where.dailyRate = {};
          if (minPrice) where.dailyRate.gte = parseFloat(minPrice);
          if (maxPrice) where.dailyRate.lte = parseFloat(maxPrice);
        }

        const orderByMap: Record<string, any> = {
          'newest':     { createdAt: 'desc' },
          'price-low':  { dailyRate: 'asc' },
          'price-high': { dailyRate: 'desc' },
          'rating':     { averageRating: 'desc' },
        };
        const orderBy = orderByMap[sortBy] || { createdAt: 'desc' };

        const [data, total] = await Promise.all([
          prisma.gear.findMany({
            where,
            include: {
              user: {
                select: { id: true, email: true, full_name: true, averageRating: true, totalReviews: true }
              }
            },
            orderBy,
            take: limit,
            skip: offset
          }),
          prisma.gear.count({ where })
        ]);

        return NextResponse.json({
          data,
          total,
          pagination: {
            page,
            limit,
            hasNext: offset + limit < total
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