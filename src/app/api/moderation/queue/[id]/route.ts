export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/moderation/queue/[id] - Get moderation item details
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['moderator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const itemId = params.id

    const moderationItem = await prisma.contentModerationQueue.findUnique({
      where: { id: itemId },
      include: {
        work: {
          include: {
            author: true,
            sections: {
              where: { status: 'published' },
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        section: {
          include: {
            work: {
              include: {
                author: true
              }
            }
          }
        }
      }
    })

    if (!moderationItem) {
      return NextResponse.json({ error: 'Moderation item not found' }, { status: 404 })
    }

    // Get validation results for this item
    const validations = await prisma.contentValidation.findMany({
      where: {
        OR: [
          { workId: moderationItem.workId },
          { sectionId: moderationItem.sectionId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      moderationItem,
      validations
    })

  } catch (error) {
    console.error('Moderation item fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation item' },
      { status: 500 }
    )
  }
}

// PATCH /api/moderation/queue/[id] - Update moderation status
export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user is a moderator

    const itemId = params.id
    const body = await request.json()
    const { action, notes } = body // action: 'approve', 'reject', 'flag'

    if (!['approve', 'reject', 'flag'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or flag' },
        { status: 400 }
      )
    }

    // Update moderation queue item
    const updatedItem = await prisma.contentModerationQueue.update({
      where: { id: itemId },
      data: {
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'queued',
        completedAt: new Date(),
        notes
      },
      include: {
        work: true,
        section: true
      }
    })

    // If approving, update the work/section status
    if (action === 'approve') {
      if (updatedItem.workId) {
        await prisma.work.update({
          where: { id: updatedItem.workId },
          data: { status: 'published' }
        })
      }

      if (updatedItem.sectionId) {
        await prisma.section.update({
          where: { id: updatedItem.sectionId },
          data: { status: 'published', publishedAt: new Date() }
        })
      }
    }

    // If rejecting, update work/section status back to draft
    if (action === 'reject') {
      if (updatedItem.workId) {
        await prisma.work.update({
          where: { id: updatedItem.workId },
          data: { status: 'draft' }
        })
      }

      if (updatedItem.sectionId) {
        await prisma.section.update({
          where: { id: updatedItem.sectionId },
          data: { status: 'draft' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Content ${action}d successfully`,
      moderationItem: updatedItem
    })

  } catch (error) {
    console.error('Moderation update error:', error)
    return NextResponse.json(
      { error: 'Failed to update moderation status' },
      { status: 500 }
    )
  }
}