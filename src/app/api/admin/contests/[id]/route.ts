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
 * PATCH /api/admin/contests/[id]
 * Update contest details or status (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id } = await params

  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      throw new ApiError('Unauthorized: Admin access required', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const body = await request.json()
    
    // Prepare update data — only include provided fields
    const updateData: any = {}
    
    if (body.title) updateData.title = body.title
    if (body.description) updateData.description = body.description
    if (body.rules) updateData.rules = body.rules
    if (body.status) updateData.status = body.status
    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate) updateData.endDate = new Date(body.endDate)
    if (body.submissionDeadline) updateData.submissionDeadline = new Date(body.submissionDeadline)
    if (body.prizePool !== undefined) updateData.prizePool = Number(body.prizePool)
    if (body.prizeSplit) updateData.prizeSplit = typeof body.prizeSplit === 'string' ? body.prizeSplit : JSON.stringify(body.prizeSplit)
    if (body.theme !== undefined) updateData.theme = body.theme
    if (body.genres) updateData.genres = typeof body.genres === 'string' ? body.genres : JSON.stringify(body.genres)
    if (body.minWordCount !== undefined) updateData.minWordCount = body.minWordCount
    if (body.maxWordCount !== undefined) updateData.maxWordCount = body.maxWordCount
    if (body.judges) updateData.judges = typeof body.judges === 'string' ? body.judges : JSON.stringify(body.judges)
    if (body.adRevenueShare !== undefined) updateData.adRevenueShare = Number(body.adRevenueShare)

    const contest = await prisma.contest.update({
      where: { id },
      data: updateData
    })

    return createSuccessResponse({ contest }, 'Contest updated', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

/**
 * DELETE /api/admin/contests/[id]
 * Delete/Cancel a contest (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id } = await params

  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      throw new ApiError('Unauthorized: Admin access required', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    await prisma.contest.delete({
      where: { id }
    })

    return createSuccessResponse(null, 'Contest deleted', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
