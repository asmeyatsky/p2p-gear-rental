// src/infrastructure/tracing/DistributedTracer.ts
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logging/CorrelationLogger';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
  serviceName: string;
  operationName: string;
  tags?: Map<string, any>;
  logs?: Array<{ timestamp: number; fields: Map<string, any> }>;
}

export interface Span {
  context(): TraceContext;
  setTag(key: string, value: any): void;
  addEvent(name: string, attributes?: Map<string, any>): void;
  end(): void;
}

class TracerSpan implements Span {
  private context: TraceContext;
  private ended: boolean = false;

  constructor(context: TraceContext) {
    this.context = context;
  }

  context(): TraceContext {
    return this.context;
  }

  setTag(key: string, value: any): void {
    if (!this.context.tags) {
      this.context.tags = new Map();
    }
    this.context.tags.set(key, value);
  }

  addEvent(name: string, attributes?: Map<string, any>): void {
    if (!this.context.logs) {
      this.context.logs = [];
    }
    
    this.context.logs.push({
      timestamp: Date.now(),
      fields: new Map([['event', name], ...Array.from(attributes || new Map())])
    });
  }

  end(): void {
    if (this.ended) return;
    
    const duration = Date.now() - this.context.startTime;
    
    // Log the completed span
    logger.info(`Span completed: ${this.context.operationName}`, {
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      duration,
      serviceName: this.context.serviceName,
      operationName: this.context.operationName,
      tags: this.context.tags ? Object.fromEntries(this.context.tags) : undefined,
      logs: this.context.logs?.map(log => ({
        timestamp: log.timestamp,
        fields: Object.fromEntries(log.fields)
      }))
    }, 'TRACING');

    this.ended = true;
  }
}

export interface Tracer {
  startSpan(operationName: string, serviceName: string, parentSpan?: Span): Span;
  inject(span: Span, format: string, carrier: any): void;
  extract(format: string, carrier: any): Span | null;
}

export class DistributedTracer implements Tracer {
  startSpan(operationName: string, serviceName: string, parentSpan?: Span): Span {
    const traceId = parentSpan?.context().traceId || uuidv4();
    const spanId = uuidv4();
    const parentSpanId = parentSpan?.context().spanId;

    const context: TraceContext = {
      traceId,
      spanId,
      parentSpanId,
      startTime: Date.now(),
      serviceName,
      operationName,
      tags: new Map(),
      logs: []
    };

    const span = new TracerSpan(context);
    
    // Log span creation
    logger.debug(`Span started: ${operationName}`, {
      traceId,
      spanId,
      parentSpanId,
      serviceName,
      operationName
    }, 'TRACING');

    return span;
  }

  inject(span: Span, format: string, carrier: any): void {
    const context = span.context();
    
    switch (format) {
      case 'http_headers':
        carrier['x-trace-id'] = context.traceId;
        carrier['x-span-id'] = context.spanId;
        if (context.parentSpanId) {
          carrier['x-parent-span-id'] = context.parentSpanId;
        }
        break;
      case 'binary':
        // Implementation for binary format
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  extract(format: string, carrier: any): Span | null {
    let traceId: string | undefined;
    let spanId: string | undefined;
    let parentSpanId: string | undefined;

    switch (format) {
      case 'http_headers':
        traceId = carrier['x-trace-id'];
        spanId = carrier['x-span-id'];
        parentSpanId = carrier['x-parent-span-id'];
        break;
      case 'binary':
        // Implementation for binary format
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    if (!traceId || !spanId) {
      return null;
    }

    const context: TraceContext = {
      traceId,
      spanId,
      parentSpanId,
      startTime: Date.now(),
      serviceName: 'unknown',
      operationName: 'unknown'
    };

    return new TracerSpan(context);
  }
}

export const tracer = new DistributedTracer();