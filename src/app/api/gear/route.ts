import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, ValidationError, AuthenticationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { gearQuerySchema, createGearSchema } from '@/lib/validations/gear';
import { CacheManager } from '@/lib/cache';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.search.limiter, rateLimitConfig.search.limit)(
      async (request: NextRequest) => {
      // Validate query parameters
      const { searchParams } = new URL(request.url);
      const queryData = Object.fromEntries(searchParams.entries());
      
      logger.debug('Gear search request', { queryParams: queryData }, 'API');
      
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

      // Generate cache key based on all search parameters
      const cacheKey = CacheManager.keys.gear.list(
        JSON.stringify({ search, category, minPrice, maxPrice, city, state, page, limit, sortBy })
      );

      // Try to get from cache first
      const cached = await CacheManager.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for gear search', { cacheKey }, 'CACHE');
        return NextResponse.json(cached);
      }

      logger.debug('Cache miss for gear search', { cacheKey }, 'CACHE');

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

      // Execute queries in parallel with tracking
      const [gear, total] = await Promise.all([
        trackDatabaseQuery('gear.findMany', () =>
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
          })
        ),
        trackDatabaseQuery('gear.count', () =>
          prisma.gear.count({ where })
        )
      ]);

      // Prepare response data
      const responseData = {
        data: gear,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

      // Cache the result for 5 minutes
      await CacheManager.set(cacheKey, responseData, CacheManager.TTL.MEDIUM);

      logger.info('Gear search completed', { 
        resultsCount: gear.length, 
        totalCount: total,
        page,
        hasFilters: !!search || !!category || city || state || minPrice > 0 || maxPrice < 10000
      }, 'API');

      return NextResponse.json(responseData);
      }
    )
  )
);

export const POST = withErrorHandler(
  withMonitoring(
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

      logger.info('Gear creation request', { 
        userId: session.user.id,
        category: validatedData.category,
        dailyRate: validatedData.dailyRate
      }, 'API');

      // Ensure the user exists in our database or create them
      const user = await trackDatabaseQuery('user.upsert', () =>
        prisma.user.upsert({
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
        })
      );

      // Create the gear with validated data
      const newGear = await trackDatabaseQuery('gear.create', () =>
        prisma.gear.create({
          data: {
            ...validatedData,
            userId: user.id, // Associate the gear with the user
          },
          include: {
            user: {
              select: { id: true, email: true, full_name: true }
            }
          }
        })
      );

      // Invalidate relevant caches
      await Promise.all([
        // Clear all gear list caches (since pagination and filters might change)
        CacheManager.invalidatePattern('gear:list:*'),
        // Clear category cache if gear has a category
        validatedData.category ? CacheManager.del(CacheManager.keys.gear.category(validatedData.category)) : Promise.resolve(),
        // Clear user's gear cache
        CacheManager.del(CacheManager.keys.gear.user(user.id)),
      ]);

      logger.info('Gear created successfully', { 
        gearId: newGear.id,
        userId: user.id,
        category: validatedData.category,
        title: validatedData.title
      }, 'API');

      return NextResponse.json(newGear, { status: 201 });
      }
    )
  )
);
