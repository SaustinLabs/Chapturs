export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import DatabaseService from '@/lib/database/PrismaService'
import { prisma } from '@/lib/database/PrismaService'
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
import { toggleSubscriptionSchema } from '@/lib/api/schemas'

// use shared prisma instance from PrismaService

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`subscription_${clientId}`, 20, 60000) // 20 per minute

    // Authentication
    const session = await auth()
    requireAuth(session)

    // Validation
    const validatedData = await validateRequest(request, toggleSubscriptionSchema)
    const { authorId } = validatedData

    // Check if author exists
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: { user: true }
    })
    
    if (!author) {
      throw new ApiError(
        'Author not found',
        404,
        ApiErrorType.NOT_FOUND_ERROR,
        { authorId }
      )
    }

    // Prevent self-subscription
    if (author.userId === session.user.id) {
      throw new ApiError(
        'Cannot subscribe to yourself',
        400,
        ApiErrorType.VALIDATION_ERROR
      )
    }

    // Toggle subscription
    const isSubscribed = await DatabaseService.toggleSubscription(authorId, session.user.id)
    
    const response = createSuccessResponse({
      subscribed: isSubscribed,
      authorId,
      authorName: author.user.displayName || author.user.username
    }, isSubscribed ? 'Subscribed successfully' : 'Unsubscribed successfully', requestId)
    
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
    checkRateLimit(`subscription_check_${clientId}`, 100, 60000) // 100 per minute for GET

    // Authentication
    const session = await auth()
    requireAuth(session)

    // Validation
    const { searchParams } = new URL(request.url)
    const authorId = searchParams.get('authorId')
    
    if (!authorId) {
      throw new ApiError(
        'Author ID is required',
        400,
        ApiErrorType.VALIDATION_ERROR
      )
    }

    // Check if author exists
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: { user: true }
    })
    
    if (!author) {
      throw new ApiError(
        'Author not found',
        404,
        ApiErrorType.NOT_FOUND_ERROR,
        { authorId }
      )
    }

    // Check subscription status
    const isSubscribed = await DatabaseService.checkUserSubscription(session.user.id, authorId)
    
    const response = createSuccessResponse({
      subscribed: isSubscribed,
      authorId,
      authorName: author.user.displayName || author.user.username
    }, undefined, requestId)
    
    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
