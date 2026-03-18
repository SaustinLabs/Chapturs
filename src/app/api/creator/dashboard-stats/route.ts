import { NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { supabaseQuery } from '@/lib/supabase-edge'

export const runtime = 'edge'

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

    const author = await supabaseQuery('authors', {
      select: 'id',
      filter: { userId: `eq.${session.user.id}` },
      single: true
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    // Get works count
    const works = await supabaseQuery('works', {
      select: 'id,statistics',
      filter: { authorId: `eq.${author.id}` }
    })

    const worksList = works || []
    const totalWorks = worksList.length

    // Aggregate stats from works
    let totalReads = 0
    let totalLikes = 0
    for (const work of worksList) {
      try {
        const stats = JSON.parse(work.statistics || '{}')
        totalReads += stats.views || 0
        totalLikes += stats.likes || 0
      } catch {}
    }

    // Get sections/chapters count
    const sections = await supabaseQuery('sections', {
      select: 'id',
      filter: { workId: `in.(${worksList.map((w: any) => w.id).join(',')})` }
    })
    const totalChapters = sections?.length || 0

    return NextResponse.json({
      overview: {
        totalWorks,
        totalChapters,
        totalReads,
        totalLikes,
        totalBookmarks: 0,
        totalSubscribers: 0,
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
