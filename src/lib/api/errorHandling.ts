// Centralized API Error Handling and Validation Utilities
// Updated with better error handling
import { NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

// Standard API Error Response Interface
export interface ApiErrorResponse {
  error: string
  message?: string
  details?: unknown
  code?: string
  timestamp: string
  requestId?: string
}

// Standard API Success Response Interface  
export interface ApiSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  timestamp: string
  requestId?: string
}

// Error Types
export enum ApiErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR', 
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Custom API Error Class
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly errorType: ApiErrorType
  public readonly details?: unknown
  public readonly code?: string

  constructor(
    message: string,
    statusCode: number = 500,
    errorType: ApiErrorType = ApiErrorType.INTERNAL_ERROR,
    details?: unknown,
    code?: string
  ) {
    super(message)
    this.statusCode = statusCode
    this.errorType = errorType
    this.details = details
    this.code = code
    this.name = 'ApiError'
  }
}

// Error Response Builder
export function createErrorResponse(
  error: unknown,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  const timestamp = new Date().toISOString()

  // Log all errors for debugging
  console.error('API Error caught:', {
    errorType: error?.constructor?.name,
    error,
    hasErrors: error && typeof error === 'object' && 'errors' in error,
    hasIssues: error && typeof error === 'object' && 'issues' in error,
    requestId,
    timestamp
  })

  // Handle known ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json({
      error: error.errorType,
      message: error.message,
      details: error.details,
      code: error.code,
      timestamp,
      requestId
    }, { status: error.statusCode })
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: ApiErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      details: error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })),
      timestamp,
      requestId
    }, { status: 400 })
  }

  // Handle errors with errors array (but not ZodError)
  if (error && typeof error === 'object' && 'errors' in error && Array.isArray((error as any).errors)) {
    return NextResponse.json({
      error: ApiErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      details: (error as any).errors.map((err: any) => ({
        field: err.path?.join('.') || 'unknown',
        message: err.message || String(err),
        code: err.code
      })),
      timestamp,
      requestId
    }, { status: 400 })
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : 'Unknown error occurred'
  
  // Log unexpected errors (don't expose internal details)
  console.error('Unexpected API Error:', {
    error,
    message,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp,
    requestId
  })

  return NextResponse.json({
    error: ApiErrorType.INTERNAL_ERROR,
    message: 'Internal server error',
    timestamp,
    requestId
  }, { status: 500 })
}

// Success Response Builder
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId
  })
}

// Validation Helper
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw error
    }
    throw new ApiError(
      'Invalid request body format',
      400,
      ApiErrorType.VALIDATION_ERROR
    )
  }
}

// Authentication Helper
export function requireAuth(session: any): asserts session is { user: { id: string } } {
  if (!session?.user?.id) {
    throw new ApiError(
      'Authentication required',
      401,
      ApiErrorType.AUTHENTICATION_ERROR
    )
  }
}

// Authorization Helper
export function requireOwnership(resourceUserId: string, sessionUserId: string): void {
  if (resourceUserId !== sessionUserId) {
    throw new ApiError(
      'Access denied - insufficient permissions',
      403,
      ApiErrorType.AUTHORIZATION_ERROR
    )
  }
}

// Request ID Generator
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// CORS Headers Helper
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Rate Limiting — Redis sliding window in production, in-memory fallback for local dev
import { getRedis } from '@/lib/redis'

const _inMemoryCounts = new Map<string, { count: number; resetTime: number }>()

export async function checkRateLimitAsync(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<void> {
  const redis = getRedis()

  if (redis) {
    // Sliding window using Redis INCR + EXPIRE
    const key = `rl:${identifier}`
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000))
    }
    if (count > limit) {
      throw new ApiError(
        'Rate limit exceeded',
        429,
        ApiErrorType.RATE_LIMIT_ERROR,
        { limit, windowMs }
      )
    }
    return
  }

  // Fallback: in-memory (single-process only — acceptable for low traffic / local dev)
  const now = Date.now()
  const entry = _inMemoryCounts.get(identifier)
  if (!entry || now > entry.resetTime) {
    _inMemoryCounts.set(identifier, { count: 1, resetTime: now + windowMs })
    return
  }
  if (entry.count >= limit) {
    throw new ApiError(
      'Rate limit exceeded',
      429,
      ApiErrorType.RATE_LIMIT_ERROR,
      { limit, windowMs, resetTime: entry.resetTime }
    )
  }
  entry.count++
}

/** @deprecated Use checkRateLimitAsync — this sync version uses in-memory only */
export function checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): void {
  const now = Date.now()
  const entry = _inMemoryCounts.get(identifier)
  if (!entry || now > entry.resetTime) {
    _inMemoryCounts.set(identifier, { count: 1, resetTime: now + windowMs })
    return
  }
  if (entry.count >= limit) {
    throw new ApiError(
      'Rate limit exceeded',
      429,
      ApiErrorType.RATE_LIMIT_ERROR,
      { limit, windowMs, resetTime: entry.resetTime }
    )
  }
  entry.count++
}