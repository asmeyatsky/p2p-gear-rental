import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

// Enhanced Prisma configuration with connection pooling and performance optimization

interface ConnectionPoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
  retryAttempts: number;
  retryDelay: number;
}

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private prismaClients: Map<string, PrismaClient> = new Map();
  private connectionCount = 0;
  private readonly config: ConnectionPoolConfig;

  private constructor() {
    this.config = {
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
      idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '600000'), // 10 minutes
      maxLifetime: parseInt(process.env.DATABASE_MAX_LIFETIME || '3600000'), // 1 hour
      retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000')
    };
  }

  static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  // Create optimized Prisma client with connection pooling
  createOptimizedClient(name = 'default'): PrismaClient {
    if (this.prismaClients.has(name)) {
      return this.prismaClients.get(name)!;
    }

    if (this.connectionCount >= this.config.maxConnections) {
      throw new Error(`Maximum number of database connections (${this.config.maxConnections}) reached`);
    }

    const client = new PrismaClient({
      datasources: {
        db: {
          url: this.buildConnectionString()
        }
      },
      log: this.getLogLevel(),
      errorFormat: 'pretty'
    });

    // Add connection event handlers
    this.setupConnectionHandlers(client, name);

    // Add query performance monitoring
    this.setupQueryMonitoring(client);

    this.prismaClients.set(name, client);
    this.connectionCount++;

    logger.info(`Created new database connection: ${name}`, {
      totalConnections: this.connectionCount,
      maxConnections: this.config.maxConnections
    });

    return client;
  }

  // Build optimized connection string with pooling parameters
  private buildConnectionString(): string {
    const baseUrl = process.env.DATABASE_URL || '';
    
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const url = new URL(baseUrl);
    
    // Add connection pool parameters
    url.searchParams.set('connection_limit', this.config.maxConnections.toString());
    url.searchParams.set('pool_timeout', (this.config.connectionTimeout / 1000).toString());
    url.searchParams.set('connect_timeout', '10');
    url.searchParams.set('socket_timeout', '60');
    
    // PostgreSQL specific optimizations
    if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
      url.searchParams.set('pgbouncer', 'true');
      url.searchParams.set('prepared_statements', 'false'); // Better for connection poolers
      url.searchParams.set('statement_cache_size', '0');
    }

    return url.toString();
  }

  // Setup connection event handlers
  private setupConnectionHandlers(client: PrismaClient, name: string) {
    // Handle connection events
    

    // Setup connection health check
    this.scheduleHealthCheck(client, name);
  }

  // Setup query performance monitoring
  private setupQueryMonitoring(client: PrismaClient) {
    if (process.env.NODE_ENV !== 'production') {
      client.$use(async (params, next) => {
        const start = Date.now();
        const result = await next(params);
        const duration = Date.now() - start;

        // Log slow queries
        if (duration > 1000) {
          logger.warn('Slow database query detected', {
            model: params.model,
            action: params.action,
            duration,
            args: this.sanitizeQueryArgs(params.args)
          });
        }

        // Log all queries in development
        if (process.env.NODE_ENV === 'development' && duration > 100) {
          logger.debug('Database query', {
            model: params.model,
            action: params.action,
            duration
          });
        }

        return result;
      });
    }
  }

  // Sanitize query arguments for logging (remove sensitive data)
  private sanitizeQueryArgs(args: any): any {
    if (!args || typeof args !== 'object') return args;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'email'];
    const sanitized = { ...args };

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      const result = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          (result as any)[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          (result as any)[key] = sanitizeObject(value);
        } else {
          (result as any)[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeObject(sanitized);
  }

  // Get appropriate log level based on environment
  private getLogLevel(): any[] {
    switch (process.env.NODE_ENV) {
      case 'development':
        return ['query', 'info', 'warn', 'error'];
      case 'test':
        return ['warn', 'error'];
      default:
        return ['warn', 'error'];
    }
  }

  // Schedule periodic health checks
  private scheduleHealthCheck(client: PrismaClient, name: string) {
    const healthCheckInterval = setInterval(async () => {
      try {
        await client.$queryRaw`SELECT 1`;
      } catch (error) {
        logger.error(`Health check failed for connection ${name}`, { error: error instanceof Error ? error.message : String(error) });
        
        // Attempt to reconnect
        try {
          await this.reconnectClient(name);
        } catch (reconnectError) {
          logger.error(`Failed to reconnect database client ${name}`, { error: reconnectError instanceof Error ? reconnectError.message : String(reconnectError) });
        }
      }
    }, 30000); // Check every 30 seconds

    // Store interval reference for cleanup
    (client as any).__healthCheckInterval = healthCheckInterval;
  }

  // Reconnect a failed client
  private async reconnectClient(name: string): Promise<void> {
    const existingClient = this.prismaClients.get(name);
    if (existingClient) {
      try {
        await existingClient.$disconnect();
      } catch (error) {
        logger.warn(`Error disconnecting client ${name}:`, { error: error instanceof Error ? error.message : String(error) });
      }
      
      // Clear health check interval
      if ((existingClient as any).__healthCheckInterval) {
        clearInterval((existingClient as any).__healthCheckInterval);
      }
    }

    this.prismaClients.delete(name);
    this.connectionCount--;

    // Create new client
    await this.delay(this.config.retryDelay);
    const newClient = this.createOptimizedClient(name);
    
    // Test the connection
    await newClient.$connect();
    
    logger.info(`Successfully reconnected database client: ${name}`);
  }

  // Get client by name
  getClient(name = 'default'): PrismaClient {
    const client = this.prismaClients.get(name);
    if (!client) {
      throw new Error(`Database client '${name}' not found. Create it first with createOptimizedClient()`);
    }
    return client;
  }

  // Execute query with retry logic
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors
        if (this.isNonRetriableError(error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.warn(`Database operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, {
            error: error instanceof Error ? error.message : error
          });
          
          await this.delay(delay);
        }
      }
    }

    logger.error(`Database operation failed after ${maxRetries} attempts`, { error: lastError instanceof Error ? lastError.message : String(lastError) });
    throw lastError!;
  }

  // Check if error should not be retried
  private isNonRetriableError(error: any): boolean {
    if (!error) return false;
    
    const nonRetriablePatterns = [
      'Unique constraint',
      'Foreign key constraint',
      'Check constraint',
      'Invalid input',
      'Record not found',
      'Malformed'
    ];

    const errorMessage = error.message || error.toString();
    return nonRetriablePatterns.some(pattern => 
      errorMessage.includes(pattern)
    );
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get connection pool stats
  getConnectionStats() {
    return {
      activeConnections: this.connectionCount,
      maxConnections: this.config.maxConnections,
      availableConnections: this.config.maxConnections - this.connectionCount,
      connectionNames: Array.from(this.prismaClients.keys()),
      config: this.config
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    logger.info('Shutting down database connection pool...');
    
    const disconnectPromises = Array.from(this.prismaClients.entries()).map(
      async ([name, client]) => {
        try {
          // Clear health check interval
          if ((client as any).__healthCheckInterval) {
            clearInterval((client as any).__healthCheckInterval);
          }
          
          await client.$disconnect();
          logger.info(`Disconnected database client: ${name}`);
        } catch (error) {
          logger.warn(`Error disconnecting client ${name}:`, { error: error instanceof Error ? error.message : String(error) });
        }
      }
    );

    await Promise.all(disconnectPromises);
    
    this.prismaClients.clear();
    this.connectionCount = 0;
    
    logger.info('Database connection pool shutdown complete');
  }

  // Health check for monitoring
  async healthCheck(): Promise<{ healthy: boolean; connections: any; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      const client = this.getClient('default');
      await client.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        healthy: true,
        connections: this.getConnectionStats(),
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        connections: this.getConnectionStats(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Create singleton instance
export const connectionPool = DatabaseConnectionPool.getInstance();

// Create default optimized client
export const optimizedPrisma = connectionPool.createOptimizedClient('default');

// Export utility functions
export const executeWithRetry = connectionPool.executeWithRetry.bind(connectionPool);
export const getConnectionStats = connectionPool.getConnectionStats.bind(connectionPool);