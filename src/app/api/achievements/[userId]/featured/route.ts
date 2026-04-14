export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

const MAX_FEATURED = 4

/**
 * PATCH /api/achievements/[userId]/featured
 * Body: { achievementId: string, isFeatured: boolean }
 *
 * Toggles the featured status of a user achievement.
 * Enforces a cap of MAX_FEATURED pinned achievements server-side.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await auth()

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { achievementId, isFeatured } = body

    if (typeof achievementId !== 'string' || typeof isFeatured !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Confirm this userAchievement belongs to this user
    const record = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    })

    if (!record) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }

    // Enforce featured cap when pinning
    if (isFeatured) {
      const featuredCount = await prisma.userAchievement.count({
        where: { userId, isFeatured: true },
      })
      if (featuredCount >= MAX_FEATURED) {
        return NextResponse.json(
          { error: `Cannot feature more than ${MAX_FEATURED} achievements` },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.userAchievement.update({
      where: { userId_achievementId: { userId, achievementId } },
      data: { isFeatured },
      include: { achievement: true },
    })

    return NextResponse.json({ achievement: updated })
  } catch (error) {
    console.error('[Achievements] PATCH featured error:', error)
    return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 })
  }
}
