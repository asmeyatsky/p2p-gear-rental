import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError, NotFoundError, ForbiddenError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { createGearSchema } from '@/lib/validations/gear';

export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        
        logger.debug('Fetching gear details', { gearId: id }, 'API');

        // Check cache first
        const cacheKey = CacheManager.keys.gear.detail(id);
        const cached = await CacheManager.get(cacheKey);
        
        if (cached) {
          logger.debug('Cache hit for gear details', { gearId: id, cacheKey }, 'CACHE');
          return NextResponse.json(cached);
        }

        logger.debug('Cache miss for gear details', { gearId: id, cacheKey }, 'CACHE');

        // Fetch from database
        const gear = await trackDatabaseQuery('gear.findUnique', () =>
          prisma.gear.findUnique({
            where: { id },
            include: {
              user: {
                select: { id: true, email: true, full_name: true }
              }
            }
          })
        );

        if (!gear) {
          throw new NotFoundError('Gear not found');
        }

        // Cache the result
        await CacheManager.set(cacheKey, gear, CacheManager.TTL.MEDIUM);

        logger.info('Gear details fetched successfully', { 
          gearId: id,
          title: gear.title,
          ownerId: gear.userId
        }, 'API');

        return NextResponse.json(gear);
      }
    )
  )
);

export const PUT = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();

        if (!session || !session.user) {
          throw new AuthenticationError();
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createGearSchema.parse(body);

        logger.info('Gear update request', { 
          gearId: id,
          userId: session.user.id 
        }, 'API');

        // Check if gear exists and get ownership
        const existingGear = await trackDatabaseQuery('gear.findUnique', () =>
          prisma.gear.findUnique({
            where: { id },
          })
        );

        if (!existingGear) {
          throw new NotFoundError('Gear not found');
        }

        if (existingGear.userId !== session.user.id) {
          throw new ForbiddenError('You do not own this gear');
        }

        // Update gear with validated data
        const updatedGear = await trackDatabaseQuery('gear.update', () =>
          prisma.gear.update({
            where: { id },
            data: validatedData,
            include: {
              user: {
                select: { id: true, email: true, full_name: true }
              }
            }
          })
        );

        // Invalidate relevant caches
        await Promise.all([
          CacheManager.del(CacheManager.keys.gear.detail(id)),
          CacheManager.del(CacheManager.keys.gear.user(session.user.id)),
          CacheManager.invalidatePattern('gear:list:*'),
        ]);

        logger.info('Gear updated successfully', { 
          gearId: id,
          userId: session.user.id,
          title: validatedData.title
        }, 'API');

        return NextResponse.json(updatedGear);
      }
    )
  )
);

export const DELETE = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();

        if (!session || !session.user) {
          throw new AuthenticationError();
        }

        logger.info('Gear deletion request', { 
          gearId: id,
          userId: session.user.id 
        }, 'API');

        // Check if gear exists and get ownership
        const existingGear = await trackDatabaseQuery('gear.findUnique', () =>
          prisma.gear.findUnique({
            where: { id },
          })
        );

        if (!existingGear) {
          throw new NotFoundError('Gear not found');
        }

        if (existingGear.userId !== session.user.id) {
          throw new ForbiddenError('You do not own this gear');
        }

        // Delete gear
        await trackDatabaseQuery('gear.delete', () =>
          prisma.gear.delete({
            where: { id },
          })
        );

        // Invalidate relevant caches
        await Promise.all([
          CacheManager.del(CacheManager.keys.gear.detail(id)),
          CacheManager.del(CacheManager.keys.gear.user(session.user.id)),
          CacheManager.invalidatePattern('gear:list:*'),
        ]);

        logger.info('Gear deleted successfully', { 
          gearId: id,
          userId: session.user.id,
          title: existingGear.title
        }, 'API');

        return NextResponse.json({ message: 'Gear deleted successfully' }, { status: 200 });
      }
    )
  )
);
