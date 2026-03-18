export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

/**
 * GET /api/creator/dashboard-stats
 * Aggregated stats for Creator Dashboard
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const author = await prisma.author.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        works: {
          select: {
            id: true,
            statistics: true,
            _count: {
              select: {
                sections: true,
                likes: true,
                bookmarks: true,
              }
            }
          }
        },
        _count: {
          select: {
            subscriptions: true,
          }
        }
      }
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    let totalReads = 0
    let totalLikes = 0
    let totalChapters = 0

    for (const work of author.works) {
      totalChapters += work._count.sections
      totalLikes += work._count.likes
      try {
        const stats = typeof work.statistics === 'string'
          ? JSON.parse(work.statistics || '{}')
          : work.statistics || {}
        totalReads += (stats as any).views || 0
      } catch {}
    }

    return NextResponse.json({
      overview: {
        totalWorks: author.works.length,
        totalChapters,
        totalReads,
        totalLikes,
        totalBookmarks: author.works.reduce((sum, w) => sum + w._count.bookmarks, 0),
        totalSubscribers: author._count.subscriptions,
      },
      recentActivity: {
        newReads: 0,
        newLikes: 0,
        newComments: 0,
        pendingFanart: 0,
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
