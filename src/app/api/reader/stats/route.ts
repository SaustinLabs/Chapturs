export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

/**
 * GET /api/reader/stats
 * 
 * Returns aggregated reading statistics for the authenticated user:
 * - Total works read, total reading time, total words consumed
 * - Current reading streak (consecutive days with sessions)
 * - Genre breakdown from works read
 * - Daily reading activity for the past 90 days (heatmap data)
 * - Recent reading history with resume links
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // ── 1. Aggregate totals from ReadingSession ──
    const sessionAgg = await prisma.readingSession.aggregate({
      where: { userId },
      _sum: {
        durationSeconds: true,
        wordsRead: true,
      },
      _count: true,
    })

    // ── 2. Distinct works read ──
    const worksRead = await prisma.readingHistory.count({
      where: { userId },
    })

    // ── 3. Reading streak ──
    // Get all distinct reading days in the past 90 days
    const recentSessions = await prisma.readingSession.findMany({
      where: {
        userId,
        sessionStart: { gte: ninetyDaysAgo },
      },
      select: { sessionStart: true },
      orderBy: { sessionStart: 'desc' },
    })

    const readingDays = new Set<string>()
    recentSessions.forEach(s => {
      readingDays.add(s.sessionStart.toISOString().slice(0, 10))
    })

    // Calculate streak: count backward from today
    let streak = 0
    const checkDate = new Date(now)
    // Allow today to not have a session yet (check from yesterday if today has none)
    const todayStr = checkDate.toISOString().slice(0, 10)
    if (!readingDays.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1)
    }
    while (true) {
      const dayStr = checkDate.toISOString().slice(0, 10)
      if (readingDays.has(dayStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // ── 4. Daily heatmap data (past 90 days) ──
    const dailySessions = await prisma.readingSession.groupBy({
      by: ['sessionStart'],
      where: {
        userId,
        sessionStart: { gte: ninetyDaysAgo },
      },
      _sum: { durationSeconds: true, wordsRead: true },
      _count: true,
    })

    // Aggregate by calendar day
    const heatmapMap = new Map<string, { minutes: number; words: number; sessions: number }>()
    dailySessions.forEach(row => {
      const day = row.sessionStart.toISOString().slice(0, 10)
      const existing = heatmapMap.get(day) || { minutes: 0, words: 0, sessions: 0 }
      existing.minutes += Math.round((row._sum.durationSeconds || 0) / 60)
      existing.words += row._sum.wordsRead || 0
      existing.sessions += row._count
      heatmapMap.set(day, existing)
    })

    const heatmap = Array.from(heatmapMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // ── 5. Genre breakdown ──
    const readHistory = await prisma.readingHistory.findMany({
      where: { userId },
      select: {
        work: {
          select: { genres: true },
        },
      },
    })

    const genreCounts: Record<string, number> = {}
    readHistory.forEach(rh => {
      try {
        const genres: string[] = typeof rh.work.genres === 'string'
          ? JSON.parse(rh.work.genres)
          : rh.work.genres || []
        genres.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1
        })
      } catch {
        // Skip malformed genre data
      }
    })

    const genreBreakdown = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }))

    // ── 6. Recent reading history ──
    const recentHistory = await prisma.readingHistory.findMany({
      where: { userId },
      orderBy: { lastReadAt: 'desc' },
      take: 10,
      include: {
        work: {
          select: { id: true, title: true, coverImage: true, status: true, genres: true },
        },
        section: {
          select: { id: true, title: true, chapterNumber: true },
        },
      },
    })

    const recentReads = recentHistory.map(rh => ({
      workId: rh.workId,
      workTitle: rh.work.title,
      coverImage: rh.work.coverImage,
      status: rh.work.status,
      sectionId: rh.sectionId,
      sectionTitle: rh.section?.title || null,
      chapterNumber: rh.section?.chapterNumber || null,
      progress: rh.progress,
      lastReadAt: rh.lastReadAt.toISOString(),
    }))

    // ── 7. Compose response ──
    const totalMinutes = Math.round((sessionAgg._sum.durationSeconds || 0) / 60)
    const totalWords = sessionAgg._sum.wordsRead || 0

    return NextResponse.json({
      success: true,
      stats: {
        worksRead,
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        totalWords,
        totalSessions: sessionAgg._count,
        currentStreak: streak,
        longestStreak: streak, // Would need separate logic for all-time; using current for MVP
        heatmap,
        genreBreakdown,
        recentReads,
      },
    })
  } catch (error) {
    console.error('Reader stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
