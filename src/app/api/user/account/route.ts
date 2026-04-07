export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

/**
 * DELETE /api/user/account
 * Permanently deletes the authenticated user's account and all associated data.
 * All related records cascade via the Prisma schema onDelete: Cascade rules.
 */
export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user — all related records cascade through onDelete: Cascade rules
    // (Subscription, Bookmark, Like, ReadingHistory, UserSignal, UserProfile,
    //  ReadingSession, Comment, CommentLike, CommentReport, Notification,
    //  WorkRating, ChapterReaction, Author→Works, etc.)
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 },
    )
  }
}
