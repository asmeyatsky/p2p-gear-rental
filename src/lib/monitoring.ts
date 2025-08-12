import { NextRequest, NextResponse } from 'next/server';

export interface ApiMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  userId?: string;
  error?: string;
  requestSize?: number;
  responseSize?: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  slowQueries: number;
  cacheHitRate?: number;
}

class MonitoringService {
  private metrics: ApiMetrics[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics in memory

  logRequest(metrics: ApiMetrics) {
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logLevel = metrics.statusCode >= 500 ? 'error' : 
                      metrics.statusCode >= 400 ? 'warn' : 'info';
      
      console[logLevel](`[API] ${metrics.method} ${metrics.path} - ${metrics.statusCode} (${metrics.responseTime}ms)`, {
        timestamp: metrics.timestamp.toISOString(),
        ip: metrics.ip,
        userAgent: metrics.userAgent,
        error: metrics.error,
      });
    }

    // In production, you would send to external monitoring service
    // Examples: DataDog, New Relic, Sentry, CloudWatch, etc.
    this.sendToExternalService(metrics);
  }

  private sendToExternalService(metrics: ApiMetrics) {
    // Example implementation for different monitoring services
    
    // Sentry for error tracking
    if (metrics.statusCode >= 400 && typeof window === 'undefined') {
      // Only run on server side
      try {
        // console.error('[Sentry]', metrics.error || `HTTP ${metrics.statusCode}`, metrics);
      } catch (err) {
        // Fail silently
      }
    }

    // Custom analytics endpoint
    if (process.env.ANALYTICS_ENDPOINT) {
      fetch(process.env.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      }).catch(() => {
        // Fail silently - don't affect user experience
      });
    }
  }

  getMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetrics {
    let filteredMetrics = this.metrics;
    
    if (timeRange) {
      filteredMetrics = this.metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    const requestCount = filteredMetrics.length;
    const errorCount = filteredMetrics.filter(m => m.statusCode >= 400).length;
    const totalResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const slowQueries = filteredMetrics.filter(m => m.responseTime > 1000).length;

    return {
      requestCount,
      errorCount,
      errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
      averageResponseTime: requestCount > 0 ? totalResponseTime / requestCount : 0,
      slowQueries,
    };
  }

  getRecentErrors(limit = 10): ApiMetrics[] {
    return this.metrics
      .filter(m => m.statusCode >= 400)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getSlowQueries(limit = 10): ApiMetrics[] {
    return this.metrics
      .filter(m => m.responseTime > 1000)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }

  getPopularEndpoints(limit = 10): Array<{ path: string; method: string; count: number; avgResponseTime: number }> {
    const endpointMap = new Map<string, { count: number; totalTime: number }>();
    
    this.metrics.forEach(m => {
      const key = `${m.method} ${m.path}`;
      const existing = endpointMap.get(key) || { count: 0, totalTime: 0 };
      endpointMap.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + m.responseTime,
      });
    });

    return Array.from(endpointMap.entries())
      .map(([endpoint, stats]) => {
        const [method, path] = endpoint.split(' ', 2);
        return {
          method,
          path,
          count: stats.count,
          avgResponseTime: stats.totalTime / stats.count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Health check endpoint data
  getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; metrics: PerformanceMetrics } {
    const recentMetrics = this.getMetrics({
      start: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      end: new Date(),
    });

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (recentMetrics.errorRate > 20 || recentMetrics.averageResponseTime > 2000) {
      status = 'unhealthy';
    } else if (recentMetrics.errorRate > 10 || recentMetrics.averageResponseTime > 1000) {
      status = 'degraded';
    }

    return { status, metrics: recentMetrics };
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Middleware for automatic API monitoring
export function withMonitoring<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const timestamp = new Date();
    
    // Extract client info
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const requestSize = req.headers.get('content-length') ? 
                       parseInt(req.headers.get('content-length')!) : 0;

    let response: NextResponse;
    let error: string | undefined;

    try {
      response = await handler(req, ...args);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const responseTime = Date.now() - startTime;
    const responseSize = response.headers.get('content-length') ? 
                        parseInt(response.headers.get('content-length')!) : 0;

    // Log metrics
    monitoring.logRequest({
      method: req.method,
      path: new URL(req.url).pathname,
      statusCode: response.status,
      responseTime,
      timestamp,
      ip,
      userAgent,
      error,
      requestSize,
      responseSize,
    });

    return response;
  };
}

// Performance timing utilities
export class PerformanceTimer {
  private startTime: number;
  private markers: Map<string, number> = new Map();

  constructor() {
    this.startTime = Date.now();
  }

  mark(name: string): void {
    this.markers.set(name, Date.now() - this.startTime);
  }

  measure(name: string, startMark?: string): number {
    const endTime = Date.now() - this.startTime;
    const startTime = startMark ? (this.markers.get(startMark) || 0) : 0;
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration}ms`);
    }
    
    return duration;
  }

  getTotal(): number {
    return Date.now() - this.startTime;
  }

  getAllMarkers(): Record<string, number> {
    return Object.fromEntries(this.markers);
  }
}

// Database query performance tracking
export function trackDatabaseQuery<T>(
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer();
  
  return queryFn()
    .then(result => {
      const duration = timer.getTotal();
      
      if (duration > 1000) {
        console.warn(`[DB] Slow query detected: ${operation} took ${duration}ms`);
      }
      
      // Log to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // In production, send to APM service
        // Example: newrelic.recordCustomEvent('DatabaseQuery', { operation, duration });
      }
      
      return result;
    })
    .catch(error => {
      const duration = timer.getTotal();
      console.error(`[DB] Query failed: ${operation} after ${duration}ms`, error);
      
      // Log error to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Example: newrelic.recordCustomEvent('DatabaseError', { operation, duration, error: error.message });
      }
      
      throw error;
    });
}

// Alert system for critical issues
export class AlertSystem {
  private static readonly CRITICAL_ERROR_THRESHOLD = 10; // 10 errors in 1 minute
  private static readonly HIGH_RESPONSE_TIME_THRESHOLD = 5000; // 5 seconds
  
  static checkAndSendAlerts(): void {
    const recentMetrics = monitoring.getMetrics({
      start: new Date(Date.now() - 60 * 1000), // Last minute
      end: new Date(),
    });

    // Check error rate
    if (recentMetrics.errorCount >= this.CRITICAL_ERROR_THRESHOLD) {
      this.sendAlert('high_error_rate', {
        errorCount: recentMetrics.errorCount,
        errorRate: recentMetrics.errorRate,
      });
    }

    // Check response time
    if (recentMetrics.averageResponseTime >= this.HIGH_RESPONSE_TIME_THRESHOLD) {
      this.sendAlert('high_response_time', {
        averageResponseTime: recentMetrics.averageResponseTime,
      });
    }
  }

  private static sendAlert(type: string, data: any): void {
    const alert = {
      type,
      timestamp: new Date(),
      data,
      environment: process.env.NODE_ENV,
    };

    console.error('[ALERT]', alert);

    // Send to external alerting service
    if (process.env.WEBHOOK_URL) {
      fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      }).catch(() => {
        // Fail silently
      });
    }
  }
}

// Run periodic alert checks
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    AlertSystem.checkAndSendAlerts();
  }, 60 * 1000); // Check every minute
}