import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import AppLayout from '@/components/AppLayout'
import CreatorDashboardNew from '@/components/CreatorDashboardNew'

// Same data shape as /api/creator/dashboard-stats
interface DashboardStats {
  overview: {
    totalWorks: number
    totalChapters: number
    totalReads: number
    totalLikes: number
    totalBookmarks: number
    totalSubscriptions: number
  }
  recentActivity: {
    newReads: number
    newLikes: number
    newComments: number
    pendingFanart: number
  }
  qualityScores: {
    averageScore: number
    tier: string
    boostMultiplier: number
  }
  revenue: {
    thisMonth: number
    lastMonth: number
    pending: number
  }
}

async function getDashboardStats(userId: string): Promise<DashboardStats | null> {
  try {
    const author = await prisma.author.findUnique({
      where: { userId },
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
                comments: true,
              },
            },
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    })

    if (!author) return null

    let totalReads = 0
    let totalLikes = 0
    let totalChapters = 0
    let totalComments = 0
    let totalBookmarks = 0

    for (const work of author.works) {
      totalChapters += work._count.sections
      totalLikes += work._count.likes
      totalComments += work._count.comments
      totalBookmarks += work._count.bookmarks
      try {
        const stats =
          typeof work.statistics === 'string'
            ? JSON.parse(work.statistics || '{}')
            : work.statistics || {}
        totalReads += (stats as any).views || 0
      } catch {
        /* malformed JSON — skip */
      }
    }

    return {
      overview: {
        totalWorks: author.works.length,
        totalChapters,
        totalReads,
        totalLikes,
        totalBookmarks,
        totalSubscriptions: author._count.subscriptions,
      },
      recentActivity: {
        newReads: 0,
        newLikes: 0,
        newComments: totalComments,
        pendingFanart: 0,
      },
      qualityScores: {
        averageScore: 0,
        tier: 'unrated',
        boostMultiplier: 1.0,
      },
      revenue: {
        thisMonth: 0,
        lastMonth: 0,
        pending: 0,
      },
    }
  } catch {
    return null
  }
}

export default async function CreatorDashboardPage() {
  const session = await auth()
  const isAuthenticated = !!session?.user
  const userName =
    (session?.user as { displayName?: string; name?: string })?.displayName ||
    (session?.user as { name?: string })?.name ||
    'Creator'

  let stats: DashboardStats | null = null
  let hasAuthorProfile = false

  if (isAuthenticated && session.user.id) {
    stats = await getDashboardStats(session.user.id)
    hasAuthorProfile = stats !== null
  }

  return (
    <AppLayout>
      <CreatorDashboardNew
        initialStats={stats}
        userName={userName}
        isAuthenticated={isAuthenticated}
        hasAuthorProfile={hasAuthorProfile}
      />
    </AppLayout>
  )
}
