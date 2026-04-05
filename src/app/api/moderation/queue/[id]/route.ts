export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

const CLAIM_TIMEOUT_MINUTES = 20

const getClaimExpiryCutoff = () => new Date(Date.now() - CLAIM_TIMEOUT_MINUTES * 60 * 1000)

const isStaleClaim = (assignedAt?: Date | null) => Boolean(assignedAt && assignedAt.getTime() < getClaimExpiryCutoff().getTime())

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

    await prisma.contentModerationQueue.updateMany({
      where: {
        id: itemId,
        status: 'in_review',
        assignedTo: { not: null },
        assignedAt: { lt: getClaimExpiryCutoff() },
      },
      data: {
        assignedTo: null,
        assignedAt: null,
        status: 'queued',
      },
    })

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

    const assignee = moderationItem.assignedTo
      ? await prisma.user.findUnique({
          where: { id: moderationItem.assignedTo },
          select: { id: true, displayName: true, username: true },
        })
      : null

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
      moderationItem: {
        ...moderationItem,
        assignee,
        isStaleAssignment: isStaleClaim(moderationItem.assignedAt),
      },
      validations,
      claimTimeoutMinutes: CLAIM_TIMEOUT_MINUTES,
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['moderator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const itemId = params.id
    const body = await request.json()
    const { action, notes } = body // action: 'approve', 'reject', 'flag', 'claim', 'release'

    if (!['approve', 'reject', 'flag', 'claim', 'release'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, flag, claim, or release' },
        { status: 400 }
      )
    }

    await prisma.contentModerationQueue.updateMany({
      where: {
        id: itemId,
        status: 'in_review',
        assignedTo: { not: null },
        assignedAt: { lt: getClaimExpiryCutoff() },
      },
      data: {
        assignedTo: null,
        assignedAt: null,
        status: 'queued',
      },
    })

    const existingItem = await prisma.contentModerationQueue.findUnique({
      where: { id: itemId },
      include: {
        work: true,
        section: true,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Moderation item not found' }, { status: 404 })
    }

    const isAdmin = user.role === 'admin'
    const assignedToSomeoneElse = Boolean(existingItem.assignedTo && existingItem.assignedTo !== session.user.id)

    if (action === 'claim') {
      if (assignedToSomeoneElse && !isAdmin) {
        return NextResponse.json(
          { error: 'This item is already assigned to another moderator' },
          { status: 409 }
        )
      }

      const claimedItem = await prisma.contentModerationQueue.update({
        where: { id: itemId },
        data: {
          assignedTo: session.user.id,
          assignedAt: new Date(),
          status: existingItem.status === 'queued' ? 'in_review' : existingItem.status,
        },
        include: {
          work: true,
          section: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Item claimed for review',
        moderationItem: claimedItem,
      })
    }

    if (action === 'release') {
      if (!isAdmin && existingItem.assignedTo !== session.user.id) {
        return NextResponse.json(
          { error: 'Only the assigned moderator can release this item' },
          { status: 403 }
        )
      }

      const releasedItem = await prisma.contentModerationQueue.update({
        where: { id: itemId },
        data: {
          assignedTo: null,
          assignedAt: null,
          status: existingItem.status === 'in_review' ? 'queued' : existingItem.status,
          notes,
        },
        include: {
          work: true,
          section: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Item released back to queue',
        moderationItem: releasedItem,
      })
    }

    if (!isAdmin && existingItem.assignedTo !== session.user.id) {
      return NextResponse.json(
        { error: 'Claim this item before taking moderation action' },
        { status: 409 }
      )
    }

    // Update moderation queue item
    const updatedItem = await prisma.contentModerationQueue.update({
      where: { id: itemId },
      data: {
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'queued',
        completedAt: new Date(),
        notes,
        assignedTo: existingItem.assignedTo || session.user.id,
        assignedAt: existingItem.assignedAt || new Date(),
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

      // Notify the author
      if (updatedItem.work?.authorId) {
        try {
          const author = await prisma.user.findUnique({
            where: { id: updatedItem.work.authorId },
            select: { email: true, displayName: true },
          })
          if (author?.email) {
            const { notifyChapterRejected } = await import('@/lib/email')
            notifyChapterRejected({
              authorEmail: author.email,
              authorName: author.displayName || 'Creator',
              workTitle: updatedItem.work.title,
              sectionTitle: updatedItem.section?.title || 'Untitled chapter',
              reason: notes || null,
            }).catch(() => {/* non-critical */})
          }
        } catch {
          // email is non-critical — don't fail the request
        }
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