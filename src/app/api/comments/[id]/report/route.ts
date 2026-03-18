export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

// POST /api/comments/[id]/report - Report inappropriate comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reason, details } = body

    // Validate reason
    const validReasons = ['spam', 'harassment', 'spoiler', 'other']
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason. Must be one of: spam, harassment, spoiler, other' },
        { status: 400 }
      )
    }

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: params.id }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user already reported this comment
    const existingReport = await prisma.commentReport.findFirst({
      where: {
        commentId: params.id,
        userId: session.user.id
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this comment' },
        { status: 400 }
      )
    }

    // Create report
    const report = await prisma.commentReport.create({
      data: {
        commentId: params.id,
        userId: session.user.id,
        reason,
        details: details || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Comment reported successfully',
      report: {
        id: report.id,
        reason: report.reason
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error reporting comment:', error)
    return NextResponse.json(
      { error: 'Failed to report comment' },
      { status: 500 }
    )
  }
}
