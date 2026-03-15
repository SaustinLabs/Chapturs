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
 * POST /api/contests/[id]/enter
 * Submit a work to a contest
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id: contestId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError('Authentication required to enter contest', 401, ApiErrorType.AUTHENTICATION_ERROR)
    }

    const body = await request.json()
    const { workId } = body

    if (!workId) {
      throw new ApiError('Work ID required', 400, ApiErrorType.VALIDATION_ERROR)
    }

    // 1. Fetch contest and work data for verification
    const [contest, work] = await Promise.all([
      prisma.contest.findUnique({ where: { id: contestId } }),
      prisma.work.findUnique({ 
        where: { id: workId },
        include: { sections: true }
      })
    ])

    if (!contest) throw new ApiError('Contest not found', 404, ApiErrorType.NOT_FOUND_ERROR)
    if (!work) throw new ApiError('Work not found', 404, ApiErrorType.NOT_FOUND_ERROR)

    // 2. Verifications
    // Check ownership
    if (work.authorId !== session.user.id) {
      throw new ApiError('You can only submit your own work', 403, ApiErrorType.AUTHORIZATION_ERROR)
    }

    // Check contest status
    if (contest.status !== 'active') {
      throw new ApiError(`Contest is ${contest.status}, submissions not allowed`, 400, ApiErrorType.VALIDATION_ERROR)
    }

    // Check submission deadline
    if (new Date() > new Date(contest.submissionDeadline)) {
      throw new ApiError('Submission deadline has passed', 400, ApiErrorType.VALIDATION_ERROR)
    }

    // Check word count
    const totalWords = work.sections.reduce((sum: number, s: any) => sum + (s.wordCount || 0), 0)
    if (contest.minWordCount && totalWords < contest.minWordCount) {
      throw new ApiError(`Work is too short (${totalWords} words). Minimum is ${contest.minWordCount}.`, 400, ApiErrorType.VALIDATION_ERROR)
    }
    if (contest.maxWordCount && totalWords > contest.maxWordCount) {
      throw new ApiError(`Work is too long (${totalWords} words). Maximum is ${contest.maxWordCount}.`, 400, ApiErrorType.VALIDATION_ERROR)
    }

    // Check genre/tags requirements if any (simplified)
    // Genres is stored as JSON string or array in DB
    // This part can be more complex, but we'll start with this.

    // 3. Create entry
    const entry = await prisma.contestEntry.create({
      data: {
        contestId,
        workId,
        userId: session.user.id
      }
    })

    return createSuccessResponse({ entry }, 'Entered contest successfully', requestId)
  } catch (error) {
    // Handle Prism unique constraint error (already entered)
    if ((error as any).code === 'P2002') {
      return createErrorResponse(
        new ApiError('You have already submitted this work to this contest', 409, ApiErrorType.CONFLICT_ERROR), 
        requestId
      )
    }
    return createErrorResponse(error, requestId)
  }
}
