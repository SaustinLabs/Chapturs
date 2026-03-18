export const runtime = 'edge'

// Test API endpoint to validate error handling system
import { NextRequest, NextResponse } from 'next/server'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  requireAuth,
  validateRequest,
  checkRateLimit,
  addCorsHeaders,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'
import { z } from 'zod'
import { auth } from '../../../../auth'

const testSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  testType: z.enum(['success', 'validation_error', 'auth_error', 'rate_limit', 'server_error'])
})

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Test different error scenarios
    const validatedData = await validateRequest(request, testSchema)
    const { message, testType } = validatedData

    switch (testType) {
      case 'success':
        return addCorsHeaders(createSuccessResponse({ 
          message, 
          testType,
          requestId 
        }, 'Test completed successfully', requestId))

      case 'validation_error':
        // This will trigger validation error
        throw new ApiError(
          'This is a test validation error',
          400,
          ApiErrorType.VALIDATION_ERROR,
          { field: 'testField', providedValue: 'invalid' }
        )

      case 'auth_error':
        const session = await auth()
        requireAuth(session) // This should pass if logged in
        return addCorsHeaders(createSuccessResponse({ 
          message: 'Authentication test passed',
          user: session.user 
        }, 'Auth test successful', requestId))

      case 'rate_limit':
        // Test rate limiting
        checkRateLimit('test_user', 1, 60000) // Only 1 request per minute
        return addCorsHeaders(createSuccessResponse({ 
          message: 'Rate limit test passed' 
        }, 'First request allowed', requestId))

      case 'server_error':
        // Simulate server error
        throw new Error('This is a simulated server error for testing')

      default:
        throw new ApiError(
          'Invalid test type',
          400,
          ApiErrorType.VALIDATION_ERROR
        )
    }
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('testType') || 'info'

    if (testType === 'info') {
      return addCorsHeaders(createSuccessResponse({
        message: 'API Error Handling Test Endpoint',
        availableTests: [
          'success - Test successful response',
          'validation_error - Test validation error handling', 
          'auth_error - Test authentication requirement',
          'rate_limit - Test rate limiting',
          'server_error - Test server error handling'
        ],
        usage: 'POST with { message: "test", testType: "success|validation_error|auth_error|rate_limit|server_error" }'
      }, 'Test endpoint info', requestId))
    }

    throw new ApiError(
      'Use POST method for tests',
      405,
      ApiErrorType.VALIDATION_ERROR
    )

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}