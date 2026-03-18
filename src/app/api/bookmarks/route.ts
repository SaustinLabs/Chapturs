export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import DatabaseService from '@/lib/database/PrismaService'
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
import { toggleBookmarkSchema, workIdParamSchema, validateSearchParams } from '@/lib/api/schemas'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`bookmark_${clientId}`, 30, 60000) // 30 requests per minute

    // Authentication
    const session = await auth()
    requireAuth(session)

    // Validation
    const validatedData = await validateRequest(request, toggleBookmarkSchema)
    const { workId } = validatedData

    // Check if work exists (prevent bookmarking non-existent works)
    const work = await DatabaseService.getWork(workId)
    if (!work) {
      throw new ApiError(
        'Work not found',
        404,
        ApiErrorType.NOT_FOUND_ERROR,
        { workId }
      )
    }

    // Toggle bookmark
    const isBookmarked = await DatabaseService.toggleBookmark(workId, session.user.id)
    
    const response = createSuccessResponse({
      bookmarked: isBookmarked,
      workId,
      workTitle: work.title
    }, isBookmarked ? 'Bookmarked successfully' : 'Bookmark removed successfully', requestId)
    
    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`bookmark_check_${clientId}`, 100, 60000) // 100 requests per minute for GET

    // Authentication
    const session = await auth()
    requireAuth(session)

    // Validation
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    
    if (!workId) {
      throw new ApiError(
        'Work ID is required',
        400,
        ApiErrorType.VALIDATION_ERROR
      )
    }

    // Check if work exists
    const work = await DatabaseService.getWork(workId)
    if (!work) {
      throw new ApiError(
        'Work not found',
        404,
        ApiErrorType.NOT_FOUND_ERROR,
        { workId }
      )
    }

    // Check bookmark status
    const isBookmarked = await DatabaseService.checkUserBookmark(session.user.id, workId)
    
    const response = createSuccessResponse({
      bookmarked: isBookmarked,
      workId,
      workTitle: work.title
    }, undefined, requestId)
    
    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

// Handle preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}
