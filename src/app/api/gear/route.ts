import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { gearQuerySchema, createGearSchema } from '@/lib/validations/gear';
import { CacheManager } from '@/lib/cache';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { searchEngine, SearchOptions } from '@/lib/search-engine';
import { queryOptimizer } from '@/lib/database/query-optimizer';
import { executeWithRetry } from '@/lib/database';

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
          condition,
          minPrice = 0, 
          maxPrice = 10000, 
          city, 
          state,
          location,
          radius,
          page,
          limit,
          sortBy,
          startDate,
          endDate
        } = validatedQuery;

        // Build search options for the enhanced search engine
        const searchOptions: SearchOptions = {
          query: search,
          category,
          condition,
          minPrice,
          maxPrice,
          city,
          state,
          location,
          radius,
          page,
          limit,
          sortBy: sortBy as SearchOptions['sortBy'],
        };

        // Add availability filter if provided
        if (startDate && endDate) {
          searchOptions.availability = {
            startDate,
            endDate,
          };
        }

        // Generate cache key based on all search parameters
        const cacheKey = CacheManager.keys.gear.list(
          JSON.stringify(searchOptions)
        );

        // Try to get from cache first
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          logger.debug('Cache hit for gear search', { cacheKey }, 'CACHE');
          return NextResponse.json(cached);
        }

        logger.debug('Cache miss for gear search', { cacheKey }, 'CACHE');

        // Use optimized query with fallback to search engine for complex searches
        let searchResult;
        
        if (search && search.trim()) {
          // For text searches, use the enhanced search engine with fuzzy matching
          searchResult = await searchEngine.search(searchOptions);
        } else {
          // For filtering and browsing, use the optimized query engine
          const params = {
            page,
            limit,
            category,
            location: location || (city && state ? `${city}, ${state}` : undefined),
            minPrice: minPrice > 0 ? minPrice : undefined,
            maxPrice: maxPrice < 10000 ? maxPrice : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            sortBy
          };
          
          searchResult = await executeWithRetry(() => 
            queryOptimizer.getGearListings(params, { 
              useCache: true,
              cacheTTL: CacheManager.TTL.MEDIUM
            })
          );
        }

        // Cache the result for 5 minutes (if not already cached by optimizer)
        if (!cached) {
          await CacheManager.set(cacheKey, searchResult, CacheManager.TTL.MEDIUM);
        }

        logger.info('Enhanced gear search completed', { 
          resultsCount: searchResult.data.length, 
          totalCount: searchResult.pagination.total,
          exactMatches: searchResult.searchMeta?.exactMatches || 0,
          fuzzyMatches: searchResult.searchMeta?.fuzzyMatches || 0,
          searchTime: searchResult.searchMeta?.searchTime || 0,
          page,
          hasQuery: !!search,
          hasFilters: !!category || !!condition || city || state || minPrice > 0 || maxPrice < 10000
        }, 'API');

        return NextResponse.json(searchResult);
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

      // Ensure the user exists in our database or create them - with retry logic
      const user = await executeWithRetry(() =>
        trackDatabaseQuery('user.upsert', () =>
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
        )
      );

      // Create the gear with validated data - with retry logic
      const newGear = await executeWithRetry(() =>
        trackDatabaseQuery('gear.create', () =>
          prisma.gear.create({
            data: {
              ...validatedData,
              images: validatedData.images ? JSON.stringify(validatedData.images) : '[]',
              userId: user.id, // Associate the gear with the user
            },
            include: {
              user: {
                select: { id: true, email: true, full_name: true }
              }
            }
          })
        )
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

      // Transform images from JSON string back to array for API response
      const transformedGear = {
        ...newGear,
        images: newGear.images ? JSON.parse(newGear.images as string) : [],
      };

      return NextResponse.json(transformedGear, { status: 201 });
      }
    )
  )
);
