export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const { action } = await req.json()

    if (!['dismiss', 'hide', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const report = await prisma.commentReport.findUnique({
      where: { id },
      include: {
        comment: {
          include: {
            work: {
              select: {
                authorId: true
              }
            }
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        authorProfile: true
      }
    })

    const isCreator = user?.authorProfile?.id === report.comment.work.authorId
    const isModerator = user?.role === 'moderator' || user?.role === 'admin'

    if (!isCreator && !isModerator) {
      return NextResponse.json(
        { error: 'You do not have permission to moderate this report' },
        { status: 403 }
      )
    }

    if (action === 'dismiss') {
      await prisma.commentReport.update({
        where: { id },
        data: { status: 'reviewed' }
      })
    }

    if (action === 'hide') {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { isHidden: true }
      })

      await prisma.commentReport.update({
        where: { id },
        data: { status: 'actioned' }
      })
    }

    if (action === 'delete') {
      await prisma.comment.delete({
        where: { id: report.commentId }
      })

      await prisma.commentReport.updateMany({
        where: { commentId: report.commentId },
        data: { status: 'actioned' }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error applying comment moderation action:', error)
    return NextResponse.json({ error: 'Failed to apply moderation action' }, { status: 500 })
  }
}