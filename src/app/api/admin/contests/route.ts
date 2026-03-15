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
 * GET /api/admin/contests
 * List all contests with entry counts (Admin only)
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      throw new ApiError('Unauthorized: Admin access required', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const contests = await prisma.contest.findMany({
      include: {
        _count: {
          select: { entries: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return createSuccessResponse({ contests }, 'Contests retrieved', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

/**
 * POST /api/admin/contests
 * Create a new contest (Admin only)
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      throw new ApiError('Unauthorized: Admin access required', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const body = await request.json()
    const {
      title,
      description,
      rules,
      startDate,
      endDate,
      submissionDeadline,
      prizePool,
      prizeSplit,
      theme,
      genres,
      minWordCount,
      maxWordCount,
      judges,
      adRevenueShare
    } = body

    if (!title || !startDate || !endDate || !submissionDeadline || !prizeSplit) {
      throw new ApiError('Missing required fields', 400, ApiErrorType.VALIDATION_ERROR)
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        rules,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        submissionDeadline: new Date(submissionDeadline),
        prizePool: Number(prizePool) || 0,
        prizeSplit: typeof prizeSplit === 'string' ? prizeSplit : JSON.stringify(prizeSplit),
        theme,
        genres: typeof genres === 'string' ? genres : JSON.stringify(genres || []),
        minWordCount: Number(minWordCount) || null,
        maxWordCount: Number(maxWordCount) || null,
        judges: typeof judges === 'string' ? judges : JSON.stringify(judges || []),
        createdBy: session.user.id,
        adRevenueShare: Number(adRevenueShare) || 0
      }
    })

    return createSuccessResponse({ contest }, 'Contest created', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
