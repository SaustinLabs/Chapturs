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
 * POST /api/works/[id]/sections/[sectionId]/schedule
 * Schedule a chapter for future publishing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const requestId = generateRequestId()
  const { id: workId, sectionId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError('Authentication required', 401, ApiErrorType.AUTHENTICATION_ERROR)
    }

    const body = await request.json()
    const { scheduledDate } = body // ISO string

    if (!scheduledDate) {
      throw new ApiError('Scheduled date required', 400, ApiErrorType.VALIDATION_ERROR)
    }

    // Verify ownership
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { authorId: true, collaborators: { where: { userId: session.user.id } } }
    })

    if (!work || (work.authorId !== session.user.id && work.collaborators.length === 0)) {
      throw new ApiError('Unauthorized: You do not own this work', 403, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        status: 'draft', // Ensure it's draft until the cron job publishes it
        scheduledPublishAt: new Date(scheduledDate)
      }
    })

    return createSuccessResponse({ section }, 'Chapter scheduled successfully', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
