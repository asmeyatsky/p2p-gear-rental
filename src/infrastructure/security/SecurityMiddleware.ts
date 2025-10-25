// src/infrastructure/security/SecurityMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logging/CorrelationLogger';

export interface SecurityOptions {
  enableCsrf?: boolean;
  enableRateLimiting?: boolean;
  enableInputValidation?: boolean;
  enableAuditLogging?: boolean;
  maxRequestBodySize?: number;
}

export class SecurityMiddleware {
  private options: SecurityOptions;

  constructor(options: SecurityOptions = {}) {
    this.options = {
      enableCsrf: true,
      enableRateLimiting: true,
      enableInputValidation: true,
      enableAuditLogging: true,
      maxRequestBodySize: 1024 * 1024, // 1MB default
      ...options
    };
  }

  async handle(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Request size validation
      if (this.options.maxRequestBodySize && request.headers.get('content-length')) {
        const contentLength = parseInt(request.headers.get('content-length') || '0');
        if (contentLength > this.options.maxRequestBodySize) {
          logger.warn('Request too large', {
            contentLength,
            maxAllowed: this.options.maxRequestBodySize,
            url: request.url
          }, 'SECURITY');
          
          return NextResponse.json(
            { error: 'Request too large' },
            { status: 413 }
          );
        }
      }

      // 2. Input validation
      if (this.options.enableInputValidation) {
        const validationError = this.validateInput(request);
        if (validationError) {
          logger.warn('Input validation failed', {
            validationError,
            url: request.url
          }, 'SECURITY');
          
          return NextResponse.json(
            { error: 'Invalid input', details: validationError },
            { status: 400 }
          );
        }
      }

      // 3. Security headers check
      const securityHeaders = this.validateSecurityHeaders(request);
      if (securityHeaders.error) {
        logger.warn('Security headers validation failed', {
          securityHeaders,
          url: request.url
        }, 'SECURITY');
        
        // Don't block the request but log it
        logger.info('Security headers validation issue', {
          issue: securityHeaders.error,
          url: request.url
        }, 'SECURITY');
      }

      // 4. Audit logging
      if (this.options.enableAuditLogging) {
        logger.info('API request audit', {
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          correlationId: request.headers.get('x-correlation-id')
        }, 'AUDIT');
      }

      // Continue with request processing
      return NextResponse.next();
    } catch (error) {
      logger.error('Security middleware error', {
        error: error instanceof Error ? error.message : String(error),
        url: request.url
      }, 'SECURITY');

      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      );
    }
  }

  private validateInput(request: NextRequest): string | null {
    // Check for potential security threats in headers
    const suspiciousHeaders = ['x-forwarded-host', 'x-original-host', 'x-host'];
    
    for (const header of suspiciousHeaders) {
      const value = request.headers.get(header);
      if (value && (value.includes('script') || value.includes('javascript:'))) {
        return `Suspicious header value in ${header}`;
      }
    }

    // For POST/PUT requests, check content type
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (contentType && !contentType.includes('application/json') && 
          !contentType.includes('application/x-www-form-urlencoded') && 
          !contentType.includes('multipart/form-data')) {
        return 'Invalid content type';
      }
    }

    // Check for potential SQL injection patterns in URL
    const url = request.url.toLowerCase();
    const sqlInjectionPatterns = ['union', 'select', 'insert', 'delete', 'drop', 'exec', 'execute'];
    
    for (const pattern of sqlInjectionPatterns) {
      if (url.includes(pattern)) {
        // This could be a false positive, so we'll just log it
        logger.warn('Potential SQL injection pattern detected', {
          pattern,
          url: request.url
        }, 'SECURITY');
      }
    }

    return null;
  }

  private validateSecurityHeaders(request: NextRequest): { error?: string; warnings?: string[] } {
    const result: { error?: string; warnings?: string[] } = { warnings: [] };
    
    // Check for presence of security-related headers that should be set by the server
    const expectedHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security'
    ];

    // Log if important security headers are missing (for awareness, not blocking)
    for (const header of expectedHeaders) {
      if (!request.headers.get(header)) {
        result.warnings?.push(`Missing security header: ${header}`);
      }
    }

    return result;
  }
}