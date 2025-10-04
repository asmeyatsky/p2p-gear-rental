export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Not authorized to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export function handleApiError(error: unknown): NextResponse {
  // Log the error for monitoring
  console.error('API Error:', error);

  if (error && typeof error === 'object' && 'name' in error && (error.name === 'ApiError' || error.name === 'AuthenticationError' || error.name === 'ForbiddenError' || error.name === 'NotFoundError' || error.name === 'BadRequestError' || error.name === 'ConflictError' || error.name === 'RateLimitError' || error.name === 'ValidationError')) {
    // Cast to ApiError to access properties
    const apiError = error as ApiError;
    return NextResponse.json(
      {
        error: apiError.message,
        code: apiError.code,
        timestamp: new Date().toISOString(),
      },
      { status: apiError.statusCode }
    );
  }
  
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;
    
    return NextResponse.json(
      { 
        error: message,
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

  // Fallback for unknown error types
  return NextResponse.json(
    { 
      error: 'Internal server error',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

// Helper to validate required environment variables
// Helper to validate required environment variables
export function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse> | NextResponse;

export function withErrorHandler(handler: ApiHandler) {
  return async (req: NextRequest, ...args: unknown[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
