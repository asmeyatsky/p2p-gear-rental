import { NextRequest } from 'next/server';

interface CustomNextRequest extends NextRequest {
  ip?: string;
  user?: { id: string };
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
  userId?: string;
  requestId?: string;
  component?: string;
}

class Logger {
  private readonly minLevel: LogLevel;
  private readonly isDevelopment: boolean;

  constructor() {
    this.minLevel = this.getLogLevel();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'CRITICAL': return LogLevel.CRITICAL;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const component = entry.component ? `[${entry.component}]` : '';
    
    return `${timestamp} ${levelName} ${component} ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, component?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      component,
      stack: level >= LogLevel.ERROR ? new Error().stack : undefined,
    };

    // Console output
    const formattedMessage = this.formatMessage(entry);
    const consoleMethod = this.getConsoleMethod(level);
    
    if (this.isDevelopment) {
      // Pretty format for development
      consoleMethod(formattedMessage, context || '');
    } else {
      // Structured logging for production
      consoleMethod(JSON.stringify(entry));
    }

    // Send to external logging service in production
    this.sendToExternalService(entry);
  }

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // In production, send to external logging service
    // Examples: DataDog, Splunk, ELK Stack, CloudWatch Logs, etc.
    
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Example: Send to DataDog
    if (process.env.DATADOG_API_KEY) {
      fetch('https://http-intake.logs.datadoghq.com/v1/input/' + process.env.DATADOG_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          service: 'p2p-gear-rental',
          environment: process.env.NODE_ENV,
        }),
      }).catch(() => {
        // Fail silently - don't affect application
      });
    }

    // Example: Send to custom logging endpoint
    if (process.env.LOG_ENDPOINT) {
      fetch(process.env.LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_API_TOKEN}`,
        },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Fail silently
      });
    }
  }

  debug(message: string, context?: Record<string, unknown>, component?: string): void {
    this.log(LogLevel.DEBUG, message, context, component);
  }

  info(message: string, context?: Record<string, unknown>, component?: string): void {
    this.log(LogLevel.INFO, message, context, component);
  }

  warn(message: string, context?: Record<string, unknown>, component?: string): void {
    this.log(LogLevel.WARN, message, context, component);
  }

  error(message: string, context?: Record<string, unknown>, component?: string): void {
    this.log(LogLevel.ERROR, message, context, component);
  }

  critical(message: string, context?: Record<string, unknown>, component?: string): void {
    this.log(LogLevel.CRITICAL, message, context, component);
  }

  // Convenience methods for common scenarios
  apiRequest(method: string, path: string, statusCode: number, responseTime: number, context?: Record<string, unknown>): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `${method} ${path} - ${statusCode} (${responseTime}ms)`, context, 'API');
  }

  dbQuery(query: string, duration: number, error?: Error): void {
    if (error) {
      this.error(`Database query failed: ${query}`, { duration, error: error.message }, 'DATABASE');
    } else if (duration > 1000) {
      this.warn(`Slow database query: ${query}`, { duration }, 'DATABASE');
    } else {
      this.debug(`Database query executed: ${query}`, { duration }, 'DATABASE');
    }
  }

  userAction(action: string, userId: string, context?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, { userId, ...context }, 'USER');
  }

  securityEvent(event: string, context?: Record<string, unknown>): void {
    this.critical(`Security event: ${event}`, context, 'SECURITY');
  }

  cacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, context?: Record<string, unknown>): void {
    this.debug(`Cache ${operation}: ${key}`, context, 'CACHE');
  }
}

// Singleton instance
export const logger = new Logger();

// Utility functions for specific logging scenarios
export function logApiError(error: Error, req?: NextRequest, context?: Record<string, unknown>): void {
  const requestInfo = req ? {
    method: req.method,
    url: req.url,
    headers: req.headers,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
  } : {};

  logger.error(`API Error: ${error.message}`, {
    ...requestInfo,
    stack: error.stack,
    ...context,
  }, 'API');
}

export function logUserActivity(userId: string, action: string, details?: Record<string, unknown>): void {
  logger.userAction(action, userId, details);
}

export function logSecurityIncident(incident: string, details?: Record<string, unknown>): void {
  logger.securityEvent(incident, details);
}

export function logPerformanceMetric(metric: string, value: number, unit: string = 'ms', context?: Record<string, unknown>): void {
  if (value > 5000) {
    logger.warn(`Performance: ${metric} = ${value}${unit}`, context, 'PERFORMANCE');
  } else {
    logger.info(`Performance: ${metric} = ${value}${unit}`, context, 'PERFORMANCE');
  }
}

// Request logging middleware helper
export function createRequestLogger(component: string = 'API') {
  return (req: CustomNextRequest, method: string, path: string, statusCode: number, responseTime: number, error?: Error) => {
    const context: Record<string, unknown> = {
      userAgent: req.headers?.get('user-agent'),
      ip: req.headers?.get('x-forwarded-for') || req.headers?.get('x-real-ip') || 'unknown',
      userId: 'unknown',
      requestId: req.headers?.get('x-request-id') || 'unknown',
    };
  };
}

// Structured error logging for async operations
export async function withLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  component?: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    logger.debug(`Starting operation: ${operation}`, undefined, component);
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.info(`Operation completed: ${operation}`, { duration }, component);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Operation failed: ${operation}`, {
      duration,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    }, component);
    throw error;
  }
}