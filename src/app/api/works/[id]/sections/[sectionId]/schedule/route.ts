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
    const dbUserId = session.user.id
    const body = await request.json()
    const { scheduledDate } = body // ISO string
    if (!scheduledDate) {
      throw new ApiError('Scheduled date required', 400, ApiErrorType.VALIDATION_ERROR)
    }
    // Fetch work with author and active collaborator (if any)
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: { select: { userId: true } },
        collaborators: {
          where: { userId: dbUserId, status: 'active' },
          select: { permissions: true },
          take: 1,
        },
      },
    })
    if (!work) {
      throw new ApiError('Work not found', 404, ApiErrorType.NOT_FOUND)
    }
    const isOwner = work.author?.userId === dbUserId
    let canPublish = false
    if (!isOwner && work.collaborators.length > 0) {
      try {
        const perms = JSON.parse(work.collaborators[0].permissions || '{}')
        canPublish = !!perms.canPublish
      } catch { canPublish = false }
    }
    if (!isOwner && !canPublish) {
      throw new ApiError('Forbidden: insufficient permissions', 403, ApiErrorType.AUTHORIZATION_ERROR)
    }
    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        status: 'draft', // Ensure it's draft until the cron job publishes it
        scheduledPublishAt: new Date(scheduledDate)
      }
    })
    // Log collaboration activity (fire-and-forget)
    import { logCollaborationActivity } from '../../../../lib/collaborationActivity'
    logCollaborationActivity({
      workId,
      userId: dbUserId,
      action: 'scheduled_section',
      details: { sectionId, scheduledDate },
    }).catch(() => {})
    return createSuccessResponse({ section }, 'Chapter scheduled successfully', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
