export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'

/**
 * POST /api/works/[id]/rate
 * Submit or update a user's rating for a work
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id: workId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError('Authentication required to rate', 401, ApiErrorType.AUTHENTICATION_ERROR)
    }

    const body = await request.json()
    const { rating, comment } = body

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new ApiError('Rating must be between 1 and 5', 400, ApiErrorType.VALIDATION_ERROR)
    }

    // Upsert rating
    const workRating = await prisma.workRating.upsert({
      where: {
        workId_userId: {
          workId,
          userId: session.user.id
        }
      },
      update: {
        rating,
        comment
      },
      create: {
        workId,
        userId: session.user.id,
        rating,
        comment
      }
    })

    // Recalculate average rating on Work model (optional but good for performance)
    const stats = await prisma.workRating.aggregate({
      where: { workId },
      _avg: { rating: true },
      _count: { rating: true }
    })

    // If we had averageRating on Work schema, we'd update it here.
    // For now we'll just return the new average.

    return createSuccessResponse({ 
      rating: workRating, 
      average: stats._avg.rating, 
      total: stats._count.rating 
    }, 'Rating submitted', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
