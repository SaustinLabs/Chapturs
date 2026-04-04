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
 * GET /api/works/[id]/rate
 * Get aggregate ratings and the current user's existing rating
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id: workId } = await params

  try {
    const session = await auth()

    const [stats, userRating] = await Promise.all([
      prisma.workRating.aggregate({
        where: { workId },
        _avg: { overall: true, writing: true, plot: true, characters: true, worldBuilding: true, pacing: true },
        _count: { overall: true },
      }),
      session?.user?.id
        ? prisma.workRating.findUnique({ where: { workId_userId: { workId, userId: session.user.id } } })
        : Promise.resolve(null),
    ])

    return createSuccessResponse({
      average: stats._avg.overall ?? 0,
      count: stats._count.overall,
      dimensions: {
        writing: stats._avg.writing,
        plot: stats._avg.plot,
        characters: stats._avg.characters,
        worldBuilding: stats._avg.worldBuilding,
        pacing: stats._avg.pacing,
      },
      userRating,
    }, 'Ratings fetched', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

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
    const { overall, writing, plot, characters, worldBuilding, pacing, review } = body

    if (typeof overall !== 'number' || overall < 1 || overall > 5) {
      throw new ApiError('Overall rating must be between 1 and 5', 400, ApiErrorType.VALIDATION_ERROR)
    }

    const dimVal = (v: unknown) => (typeof v === 'number' && v >= 1 && v <= 5 ? v : null)

    const workRating = await prisma.workRating.upsert({
      where: { workId_userId: { workId, userId: session.user.id } },
      update: {
        overall,
        writing: dimVal(writing),
        plot: dimVal(plot),
        characters: dimVal(characters),
        worldBuilding: dimVal(worldBuilding),
        pacing: dimVal(pacing),
        review: review?.trim() || null,
      },
      create: {
        workId,
        userId: session.user.id,
        overall,
        writing: dimVal(writing),
        plot: dimVal(plot),
        characters: dimVal(characters),
        worldBuilding: dimVal(worldBuilding),
        pacing: dimVal(pacing),
        review: review?.trim() || null,
      },
    })

    const stats = await prisma.workRating.aggregate({
      where: { workId },
      _avg: { overall: true },
      _count: { overall: true },
    })

    return createSuccessResponse({ 
      rating: workRating, 
      average: stats._avg.overall, 
      total: stats._count.overall,
    }, 'Rating submitted', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
