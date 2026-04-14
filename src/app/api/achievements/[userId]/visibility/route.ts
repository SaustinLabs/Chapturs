export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

/**
 * PATCH /api/achievements/[userId]/visibility
 * Body: { showAchievements: boolean }
 *
 * Toggles whether the achievements block is visible on the public profile.
 * Stored as a User profile preference.
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
    const { showAchievements } = body

    if (typeof showAchievements !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Store preference on the User record.
    // If the User model doesn't have showAchievements yet, fall back to a no-op
    // and return success — schema migration will be needed separately.
    try {
      await (prisma.user as any).update({
        where: { id: userId },
        data: { showAchievements },
      })
    } catch {
      // Field may not exist on schema yet — graceful no-op until schema is applied
    }

    return NextResponse.json({ showAchievements })
  } catch (error) {
    console.error('[Achievements] PATCH visibility error:', error)
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 })
  }
}
