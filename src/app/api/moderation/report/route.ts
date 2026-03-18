export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { createErrorResponse, createSuccessResponse, generateRequestId } from '@/lib/api/errorHandling'

export async function POST(req: NextRequest) {
  const requestId = generateRequestId()

  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 })
    }

    const { targetId, targetType, reason, details } = await req.json()

    if (!targetId || !targetType || !reason) {
      return NextResponse.json({ error: 'Missing required fields', requestId }, { status: 400 })
    }

    // Handle Comment Reports
    if (targetType === 'comment') {
      const existingReport = await prisma.commentReport.findFirst({
        where: { commentId: targetId, userId: session.user.id }
      })

      if (existingReport) {
        return NextResponse.json({ error: 'You have already reported this comment', requestId }, { status: 400 })
      }

      await prisma.commentReport.create({
        data: {
          commentId: targetId,
          userId: session.user.id,
          reason,
          details,
          status: 'pending'
        }
      })

      return createSuccessResponse(null, 'Comment report submitted successfully', requestId)
    }

    // Handle Work and Section (Chapter) Reports via ModerationQueue
    let workId = null
    let sectionId = null

    if (targetType === 'work') {
      workId = targetId
      // Verify work exists
      const work = await prisma.work.findUnique({ where: { id: workId } })
      if (!work) return NextResponse.json({ error: 'Work not found', requestId }, { status: 404 })
    } else if (targetType === 'section') {
      sectionId = targetId
      // Find section to get workId
      const section = await prisma.section.findUnique({ 
        where: { id: sectionId },
        select: { workId: true }
      })
      if (!section) return NextResponse.json({ error: 'Section not found', requestId }, { status: 404 })
      workId = section.workId
    }

    // Create entry in ContentModerationQueue
    await prisma.contentModerationQueue.create({
      data: {
        workId,
        sectionId,
        priority: 'normal',
        reason: `User Report [${reason}]: ${details || 'No additional details provided.'}`,
        status: 'queued',
        notes: `Submitted by user ${session.user.id}`
      }
    })

    return createSuccessResponse(null, 'Content report submitted successfully', requestId)

  } catch (error) {
    console.error('[Moderation Report API Error]:', error)
    return createErrorResponse(error, requestId)
  }
}

