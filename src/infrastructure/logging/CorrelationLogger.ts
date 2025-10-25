// src/infrastructure/logging/CorrelationLogger.ts
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  correlationId: string;
  userId?: string;
  requestId?: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface ILogger {
  debug(message: string, context?: Record<string, any>, component?: string): void;
  info(message: string, context?: Record<string, any>, component?: string): void;
  warn(message: string, context?: Record<string, any>, component?: string): void;
  error(message: string | Error, context?: Record<string, any>, component?: string): void;
}

// Simple correlation ID storage for environments without AsyncLocalStorage
let currentCorrelationId: string | undefined;

export class CorrelationLogger implements ILogger {
  static getCurrentCorrelationId(): string | undefined {
    return currentCorrelationId;
  }

  static withCorrelationId<T>(correlationId: string, fn: () => T): T {
    const previousId = currentCorrelationId;
    currentCorrelationId = correlationId;
    try {
      return fn();
    } finally {
      currentCorrelationId = previousId;
    }
  }

  static generateCorrelationId(): string {
    return uuidv4();
  }

  private formatLog(context: LogContext): string {
    const timestamp = context.timestamp.toISOString();
    const correlationId = context.correlationId;
    const component = context.component;
    const level = context.level.toUpperCase();
    const message = context.metadata?.message || 'Log message';
    
    // Build metadata string
    const metadata = { ...context.metadata };
    delete metadata.message; // Remove message from metadata since it's already in the main message
    
    const metadataStr = Object.keys(metadata).length > 0 
      ? ` | Metadata: ${JSON.stringify(metadata)}` 
      : '';
    
    return `[${timestamp}] [${level}] [${correlationId}] [${component}] ${message}${metadataStr}`;
  }

  log(context: LogContext): void {
    const formattedLog = this.formatLog(context);
    
    switch (context.level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>, component: string = 'APP'): void {
    const logContext: LogContext = {
      correlationId: CorrelationLogger.getCurrentCorrelationId() || CorrelationLogger.generateCorrelationId(),
      timestamp: new Date(),
      level: 'debug',
      component,
      metadata: { ...context, message }
    };
    
    this.log(logContext);
  }

  info(message: string, context?: Record<string, any>, component: string = 'APP'): void {
    const logContext: LogContext = {
      correlationId: CorrelationLogger.getCurrentCorrelationId() || CorrelationLogger.generateCorrelationId(),
      timestamp: new Date(),
      level: 'info',
      component,
      metadata: { ...context, message }
    };
    
    this.log(logContext);
  }

  warn(message: string, context?: Record<string, any>, component: string = 'APP'): void {
    const logContext: LogContext = {
      correlationId: CorrelationLogger.getCurrentCorrelationId() || CorrelationLogger.generateCorrelationId(),
      timestamp: new Date(),
      level: 'warn',
      component,
      metadata: { ...context, message }
    };
    
    this.log(logContext);
  }

  error(message: string | Error, context?: Record<string, any>, component: string = 'APP'): void {
    const logContext: LogContext = {
      correlationId: CorrelationLogger.getCurrentCorrelationId() || CorrelationLogger.generateCorrelationId(),
      timestamp: new Date(),
      level: 'error',
      component,
      metadata: { 
        ...context, 
        message: typeof message === 'string' ? message : message.message,
        stack: typeof message !== 'string' ? message.stack : undefined
      }
    };
    
    this.log(logContext);
  }

  createScopedLogger(component: string): ILogger {
    return {
      debug: (message: string, context?: Record<string, any>) => this.debug(message, context, component),
      info: (message: string, context?: Record<string, any>) => this.info(message, context, component),
      warn: (message: string, context?: Record<string, any>) => this.warn(message, context, component),
      error: (message: string | Error, context?: Record<string, any>) => this.error(message, context, component)
    };
  }
}

export const logger = new CorrelationLogger();