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

    const validTargetTypes = ['work', 'section', 'comment', 'user']
    const validReasons = ['spam', 'harassment', 'explicit', 'misinformation', 'copyright', 'other']

    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json({ error: 'Invalid targetType', requestId }, { status: 400 })
    }
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason', requestId }, { status: 400 })
    }

    // Check for duplicate reports from the same user
    const existingContentReport = await prisma.contentReport.findFirst({
      where: { reportedBy: session.user.id, targetType, targetId }
    })
    if (existingContentReport) {
      return NextResponse.json({ error: 'You have already reported this', requestId }, { status: 400 })
    }

    // Persist to unified ContentReport table
    await prisma.contentReport.create({
      data: {
        reportedBy: session.user.id,
        targetType,
        targetId,
        reason,
        details: details || null,
        status: 'pending'
      }
    })

    // Handle Comment Reports (also write to CommentReport for backward compat)
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

    // For 'user' reports, the ContentReport record is sufficient
    if (targetType === 'user') {
      return createSuccessResponse(null, 'User report submitted successfully', requestId)
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

export async function GET(req: NextRequest) {
  const requestId = generateRequestId()

  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 })
    }

    // Admin only
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'
    const targetType = searchParams.get('targetType') || undefined

    const reports = await prisma.contentReport.findMany({
      where: {
        status,
        ...(targetType ? { targetType } : {})
      },
      include: {
        reporter: { select: { id: true, username: true, displayName: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return createSuccessResponse({ reports }, 'Reports fetched', requestId)
  } catch (error) {
    console.error('[Moderation Report GET Error]:', error)
    return createErrorResponse(error, requestId)
  }
}

