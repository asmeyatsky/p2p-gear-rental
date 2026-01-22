import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { withErrorHandler, AuthenticationError, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { createDisputeSchema, disputeQuerySchema } from '@/lib/validations/disputes';
import { CacheManager } from '@/lib/cache';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (request: NextRequest) => {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();

        if (!session || !session.user) {
          throw new AuthenticationError();
        }

        const userId = session.user.id;
        
        // Validate query parameters
        const { searchParams } = new URL(request.url);
        const queryData = Object.fromEntries(searchParams.entries());
        const validatedQuery = disputeQuerySchema.parse(queryData);
        
        const {
          status,
          category,
          priority,
          page,
          limit,
          sortBy
        } = validatedQuery;

        logger.info('Dispute list request', { userId, ...validatedQuery }, 'API');

        // Generate cache key
        const cacheKey = `disputes:${userId}:${JSON.stringify(validatedQuery)}`;
        
        // Try cache first
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          return NextResponse.json(cached);
        }

        // Build where clause - user can see disputes they reported or are respondent in
        const where: Record<string, any> = {
          OR: [
            { reporterId: userId },
            { respondentId: userId }
          ]
        };

        // Apply filters
        if (status) {
          where.status = status;
        }

        if (category) {
          where.category = category;
        }

        if (priority) {
          where.priority = priority;
        }

        // Build order by
        let orderBy: Record<string, any> | Record<string, any>[] = { createdAt: 'desc' };
        
        switch (sortBy) {
          case 'oldest':
            orderBy = { createdAt: 'asc' };
            break;
          case 'priority':
            orderBy = [
              { priority: 'desc' },
              { createdAt: 'desc' }
            ];
            break;
          case 'status':
            orderBy = [
              { status: 'asc' },
              { createdAt: 'desc' }
            ];
            break;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute queries in parallel
        const [disputes, total] = await Promise.all([
          trackDatabaseQuery('dispute.findMany', () =>
            prisma.dispute.findMany({
              where,
              skip,
              take: limit,
              orderBy,
              include: {
                rental: {
                  include: {
                    gear: {
                      select: { id: true, title: true, images: true }
                    }
                  }
                },
                reporter: {
                  select: { id: true, full_name: true, email: true }
                },
                respondent: {
                  select: { id: true, full_name: true, email: true }
                },
                responses: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: {
                    user: {
                      select: { id: true, full_name: true }
                    }
                  }
                }
              }
            })
          ),
          trackDatabaseQuery('dispute.count', () =>
            prisma.dispute.count({ where })
          )
        ]);

        // Transform evidence from JSON string back to array for API response
        const transformedDisputes = (disputes as any[]).map((dispute: any) => ({
          ...dispute,
          evidence: dispute.evidence ? JSON.parse(dispute.evidence as string) : [],
        }));

        const totalCount = total as number;
        const responseData = {
          data: transformedDisputes,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
            hasNext: page < Math.ceil(totalCount / limit),
            hasPrev: page > 1
          }
        };

        // Cache for 5 minutes
        await CacheManager.set(cacheKey, responseData, CacheManager.TTL.MEDIUM);

        logger.info('Dispute list retrieved', {
          userId,
          count: transformedDisputes.length,
          total: totalCount,
          page
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

        const userId = session.user.id;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createDisputeSchema.parse(body);

        logger.info('Dispute creation request', { 
          userId, 
          rentalId: validatedData.rentalId,
          category: validatedData.category 
        }, 'API');

        // Verify the rental exists and user is involved
        const rentalResult = await trackDatabaseQuery('rental.findUnique', () =>
          prisma.rental.findUnique({
            where: { id: validatedData.rentalId },
            include: {
              dispute: true,
              gear: {
                select: { id: true, title: true }
              }
            }
          })
        );

        if (!rentalResult) {
          throw new ValidationError('Rental not found');
        }

        const rental = rentalResult as { renterId: string; ownerId: string; dispute: any };

        if (rental.renterId !== userId && rental.ownerId !== userId) {
          throw new ValidationError('You are not authorized to create a dispute for this rental');
        }

        if (rental.dispute) {
          throw new ValidationError('A dispute already exists for this rental');
        }

        // Determine respondent (the other party in the rental)
        const respondentId = rental.renterId === userId ? rental.ownerId : rental.renterId;

        // Create the dispute
        const dispute = await trackDatabaseQuery('dispute.create', () =>
          prisma.dispute.create({
            data: {
              rentalId: validatedData.rentalId,
              reporterId: userId,
              respondentId,
              category: validatedData.category,
              subject: validatedData.subject,
              description: validatedData.description,
              evidence: JSON.stringify(validatedData.evidence || []),
            },
            include: {
              rental: {
                include: {
                  gear: {
                    select: { id: true, title: true, images: true }
                  }
                }
              },
              reporter: {
                select: { id: true, full_name: true, email: true }
              },
              respondent: {
                select: { id: true, full_name: true, email: true }
              }
            }
          })
        );

        const createdDispute = dispute as any;

        // Invalidate related caches
        await Promise.all([
          CacheManager.invalidatePattern(`disputes:${userId}:*`),
          CacheManager.invalidatePattern(`disputes:${respondentId}:*`),
        ]);

        logger.info('Dispute created successfully', {
          disputeId: createdDispute.id,
          reporterId: userId,
          respondentId,
          category: validatedData.category,
          rentalId: validatedData.rentalId
        }, 'API');

        // Transform evidence from JSON string back to array for API response
        const transformedDispute = {
          ...createdDispute,
          evidence: createdDispute.evidence ? JSON.parse(createdDispute.evidence as string) : [],
        };

        return NextResponse.json(transformedDispute, { status: 201 });
      }
    )
  )
);