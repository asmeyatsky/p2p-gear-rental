import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, ValidationError, AuthenticationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { gearQuerySchema, createGearSchema } from '@/lib/validations/gear';

export const GET = withErrorHandler(
  withRateLimit(rateLimitConfig.search.limiter, rateLimitConfig.search.limit)(
    async (request: NextRequest) => {
      // Validate query parameters
      const { searchParams } = new URL(request.url);
      const queryData = Object.fromEntries(searchParams.entries());
      
      const validatedQuery = gearQuerySchema.parse(queryData);
      
      const { 
        search, 
        category, 
        minPrice = 0, 
        maxPrice = 10000, 
        city, 
        state,
        page,
        limit,
        sortBy 
      } = validatedQuery;

      // Build where clause
      const where: any = {
        dailyRate: {
          gte: minPrice,
          lte: maxPrice,
        },
      };

      // Add search filters
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }

      if (state) {
        where.state = { contains: state, mode: 'insensitive' };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build order by clause
      let orderBy: any = { createdAt: 'desc' }; // default
      
      switch (sortBy) {
        case 'price-low':
          orderBy = { dailyRate: 'asc' };
          break;
        case 'price-high':
          orderBy = { dailyRate: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'distance':
          // TODO: Implement distance sorting with geolocation
          orderBy = { createdAt: 'desc' };
          break;
      }

      // Execute queries in parallel
      const [gear, total] = await Promise.all([
        prisma.gear.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            user: {
              select: { id: true, email: true, full_name: true }
            }
          }
        }),
        prisma.gear.count({ where })
      ]);

      // Return paginated response
      return NextResponse.json({
        data: gear,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });
    }
  )
);

export const POST = withErrorHandler(
  withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
    async (request: NextRequest) => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user) {
        throw new AuthenticationError();
      }

      // Parse and validate request body
      const body = await request.json();
      const validatedData = createGearSchema.parse(body);

      // Ensure the user exists in our database or create them
      const user = await prisma.user.upsert({
        where: { id: session.user.id },
        update: {
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || null,
        },
        create: {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || null,
        },
      });

      // Create the gear with validated data
      const newGear = await prisma.gear.create({
        data: {
          ...validatedData,
          userId: user.id, // Associate the gear with the user
        },
        include: {
          user: {
            select: { id: true, email: true, full_name: true }
          }
        }
      });

      return NextResponse.json(newGear, { status: 201 });
    }
  )
);
