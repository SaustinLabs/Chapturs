export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { getUserLevel } from '@/lib/achievements/points'

/**
 * GET /api/achievements/[userId]
 *
 * Public: returns featured achievements only.
 * Owner: returns all achievements.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await auth()
    const isOwner = session?.user?.id === userId

    const [achievements, pointsAgg, featuredCount, totalCount] = await Promise.all([
      prisma.userAchievement.findMany({
        where: isOwner ? { userId } : { userId, isFeatured: true },
        include: { achievement: true },
        orderBy: { awardedAt: 'desc' },
      }),
      prisma.pointsLedger.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      prisma.userAchievement.count({ where: { userId, isFeatured: true } }),
      prisma.userAchievement.count({ where: { userId } }),
    ])

    const totalPoints = pointsAgg._sum.points ?? 0
    const level = await getUserLevel(totalPoints)

    return NextResponse.json({
      achievements,
      totalPoints,
      level,
      stats: {
        total: isOwner ? totalCount : featuredCount,
        featured: featuredCount,
      },
    })
  } catch (error) {
    console.error('[Achievements] GET error:', error)
    return NextResponse.json({ error: 'Failed to load achievements' }, { status: 500 })
  }
}
