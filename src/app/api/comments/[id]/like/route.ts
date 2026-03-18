export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

// POST /api/comments/[id]/like - Toggle like on comment
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

    // Check if already liked
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: params.id,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.commentLike.delete({
        where: { id: existingLike.id }
      })

      return NextResponse.json({
        liked: false,
        message: 'Comment unliked'
      })
    } else {
      // Like
      await prisma.commentLike.create({
        data: {
          commentId: params.id,
          userId: session.user.id
        }
      })

      return NextResponse.json({
        liked: true,
        message: 'Comment liked'
      })
    }
  } catch (error) {
    console.error('Error toggling comment like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
