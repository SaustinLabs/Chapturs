export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

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

    const where: any = { workId, parentId: null } // Only top-level comments
    
    if (sectionId) where.sectionId = sectionId
    if (blockId) where.blockId = blockId

    const comments = await prisma.blockComment.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: { id: string; [key: string]: any }) => {
        const replies = await prisma.blockComment.findMany({
          where: { parentId: comment.id },
          orderBy: { createdAt: 'asc' }
        })
        return { ...comment, replies }
      })
    )

    return NextResponse.json({ comments: commentsWithReplies })
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
    
    if (!session?.user?.id || !session?.user?.name) {
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
      text,
      parentId
    } = body

    if (!workId || !sectionId || !blockId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 5000) {
      return NextResponse.json(
        { error: 'Comment must be between 1 and 5000 characters' },
        { status: 400 }
      )
    }

    const comment = await prisma.blockComment.create({
      data: {
        workId,
        sectionId,
        blockId,
        userId: session.user.id,
        username: session.user.name,
        text,
        parentId
      }
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

// PATCH /api/comments/:id - Like a comment or mark as resolved
export async function PATCH(request: NextRequest) {
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
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Comment ID required' },
        { status: 400 }
      )
    }

    const { action } = body

    if (action === 'like') {
      const comment = await prisma.blockComment.update({
        where: { id },
        data: { likes: { increment: 1 } }
      })
      return NextResponse.json({ comment })
    }

    if (action === 'resolve') {
      const { isResolved } = body

      // Get the comment to verify ownership
      const comment = await prisma.blockComment.findUnique({
        where: { id }
      })

      if (!comment) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        )
      }

      // Only comment author can resolve
      if (comment.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only the comment author can resolve comments' },
          { status: 403 }
        )
      }

      const updatedComment = await prisma.blockComment.update({
        where: { id },
        data: { isResolved }
      })

      return NextResponse.json({ comment: updatedComment })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/:id - Delete a comment
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

    const comment = await prisma.blockComment.findUnique({
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

    await prisma.blockComment.delete({
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
