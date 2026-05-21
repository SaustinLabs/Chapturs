export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

// POST /api/comments/[id]/resolve - Mark a comment thread as resolved
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { isResolved: true }
    })

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Error resolving comment:', error)
    return NextResponse.json(
      { error: 'Failed to resolve comment' },
      { status: 500 }
    )
  }
}
