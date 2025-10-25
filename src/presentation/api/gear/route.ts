import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../infrastructure/config/dependency-injection';
import { CreateGearCommand } from '../../../application/commands/gear/CreateGearCommand';
import { GetGearQuery } from '../../../application/queries/gear/GetGearQuery';
import { logger, CorrelationLogger } from '../../infrastructure/logging/CorrelationLogger';
import { Span } from '../../infrastructure/tracing/DistributedTracer';

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || CorrelationLogger.generateCorrelationId();
  
  return CorrelationLogger.withCorrelationId(correlationId, async () => {
    // Start distributed tracing span
    const tracer = container.getTracer();
    const span = tracer.startSpan('POST /api/gear', 'api-service');
    
    try {
      logger.info('Creating gear request received', { 
        method: 'POST', 
        url: request.url 
      }, 'API-Gear');
      
      span.setTag('http.method', 'POST');
      span.setTag('http.url', request.url);
      span.setTag('correlation.id', correlationId);

      // Get dependencies from container
      const commandBus = container.getCommandBus();
      
      // Parse request body
      const body = await request.json();
      
      logger.debug('Request body parsed', { 
        bodyLength: JSON.stringify(body).length 
      }, 'API-Gear');
      
      span.setTag('request.size', JSON.stringify(body).length);
      
      // Create and execute command
      const command = new CreateGearCommand(body);
      const result = await commandBus.execute(command);
      
      logger.info('Gear created successfully', { 
        gearId: result.id,
        userId: body.userId
      }, 'API-Gear');
      
      span.setTag('result.gear.id', result.id);
      span.setTag('result.user.id', body.userId);
      
      return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
      logger.error('Error creating gear', { 
        error: error.message,
        stack: error.stack
      }, 'API-Gear');
      
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      
      return NextResponse.json(
        { error: error.message || 'Internal server error', correlationId },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || CorrelationLogger.generateCorrelationId();
  
  return CorrelationLogger.withCorrelationId(correlationId, async () => {
    // Start distributed tracing span
    const tracer = container.getTracer();
    const span = tracer.startSpan('GET /api/gear', 'api-service');
    
    try {
      logger.info('Fetching gears request received', { 
        method: 'GET', 
        url: request.url 
      }, 'API-Gear');
      
      span.setTag('http.method', 'GET');
      span.setTag('http.url', request.url);
      span.setTag('correlation.id', correlationId);

      // Get dependencies from container
      const queryBus = container.getQueryBus();
      
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const userId = searchParams.get('userId');
      const category = searchParams.get('category');
      const search = searchParams.get('search');
      const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      
      logger.debug('Query parameters parsed', { 
        id, userId, category, search, page, limit 
      }, 'API-Gear');
      
      span.setTag('query.id', id);
      span.setTag('query.user_id', userId);
      span.setTag('query.category', category);
      span.setTag('query.search', search);
      span.setTag('query.page', page);
      span.setTag('query.limit', limit);
      
      // Create and execute query
      const query = new GetGearQuery({
        id,
        userId,
        category,
        search,
        page,
        limit
      });
      
      const result = await queryBus.execute(query);
      
      logger.info('Gears fetched successfully', { 
        resultCount: result.data.length,
        total: result.total
      }, 'API-Gear');
      
      span.setTag('result.count', result.data.length);
      span.setTag('result.total', result.total);
      
      return NextResponse.json(result);
    } catch (error: any) {
      logger.error('Error fetching gears', { 
        error: error.message,
        stack: error.stack
      }, 'API-Gear');
      
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      
      return NextResponse.json(
        { error: error.message || 'Internal server error', correlationId },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}