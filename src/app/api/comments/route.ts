export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { awardPoints, POINTS_EVENT_TYPE } from '@/lib/achievements/points'

// GET /api/comments?workId=xxx&sectionId=xxx&blockId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const sectionId = searchParams.get('sectionId')
    const blockId = searchParams.get('blockId')

    if (!workId) {
      return NextResponse.json(
        { error: 'workId is required' },
        { status: 400 }
      )
    }

    const where: any = { workId, parentId: null }
    
    if (sectionId) where.sectionId = sectionId
    if (blockId) where.blockId = blockId

    const comments = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
        },
        _count: { select: { likes: true } },
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/comments - Submit a comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      workId,
      sectionId,
      blockId,
      content,
      parentId
    } = body

    if (!workId || !sectionId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields (workId, sectionId, content)' },
        { status: 400 }
      )
    }

    if (typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment must be between 1 and 5000 characters' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        workId,
        sectionId,
        blockId: blockId || null,
        userId: session.user.id,
        content,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    })

    awardPoints(session.user.id, POINTS_EVENT_TYPE.COMMENT, 3, comment.id).catch(() => {})

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/:id - Delete a comment (moderator, admin, or owner)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json(
        { error: 'Comment ID required' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.findUnique({
      where: { id }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check permission
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isOwner = comment.userId === session.user.id
    const isModerator = user?.role === 'moderator' || user?.role === 'admin'

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    await prisma.comment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
