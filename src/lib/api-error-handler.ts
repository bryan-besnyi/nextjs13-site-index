import { NextResponse } from 'next/server';
import { ApiError } from '@/types';

export class ApiErrorHandler {
  static handle(error: unknown): NextResponse {
    console.error('API Error:', error);

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      switch (prismaError.code) {
        case 'P2002':
          return NextResponse.json(
            { error: 'Duplicate entry found', code: 'DUPLICATE_ENTRY' },
            { status: 409 }
          );
        case 'P2025':
          return NextResponse.json(
            { error: 'Record not found', code: 'NOT_FOUND' },
            { status: 404 }
          );
        case 'P2003':
          return NextResponse.json(
            { error: 'Invalid reference', code: 'INVALID_REFERENCE' },
            { status: 400 }
          );
        default:
          if (prismaError.code?.startsWith('P')) {
            return NextResponse.json(
              { error: 'Database error', code: prismaError.code },
              { status: 500 }
            );
          }
      }
    }

    // Handle known error types
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
          { status: 429 }
        );
      }

      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      if (error.message.includes('forbidden') || error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // Generic error response
      return NextResponse.json(
        { 
          error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }

    // Unknown error type
    return NextResponse.json(
      { error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }

  static withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await handler(...args);
      } catch (error) {
        return ApiErrorHandler.handle(error);
      }
    }) as T;
  }
}