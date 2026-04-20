/**
 * Weekly Digest Builder
 *
 * Generates personalized reading summaries for users who opt in.
 * Each digest includes:
 *  - Reading stats for the past 7 days
 *  - New chapters from authors they subscribe to
 *  - A gentle nudge if their streak is active
 *
 * Called by the cron endpoint. Does NOT send emails itself —
 * returns structured payloads for the caller to dispatch.
 */

import { prisma } from '@/lib/database/PrismaService'

export interface DigestPayload {
  userId: string
  email: string
  displayName: string | null
  weeklyStats: {
    sessionsCount: number
    minutesRead: number
    wordsRead: number
    worksStarted: number
  }
  newChapters: Array<{
    workTitle: string
    chapterTitle: string
    authorName: string
    url: string
  }>
  currentStreak: number
}

/**
 * Build digest payloads for all opted-in users who were active this week.
 */
export async function buildWeeklyDigests(): Promise<DigestPayload[]> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Find all users who opted in
  const optedInUsers = await prisma.user.findMany({
    where: { weeklyDigestEnabled: true },
    select: {
      id: true,
      email: true,
      displayName: true,
      subscriptions: {
        select: { authorId: true },
      },
    },
  })

  if (optedInUsers.length === 0) return []

  const payloads: DigestPayload[] = []

  for (const user of optedInUsers) {
    // ── Stats for the week ──
    const weekSessions = await prisma.readingSession.aggregate({
      where: {
        userId: user.id,
        sessionStart: { gte: sevenDaysAgo },
      },
      _sum: { durationSeconds: true, wordsRead: true },
      _count: true,
    })

    const worksStarted = await prisma.readingHistory.count({
      where: {
        userId: user.id,
        lastReadAt: { gte: sevenDaysAgo },
      },
    })

    const minutesRead = Math.round((weekSessions._sum.durationSeconds || 0) / 60)
    const wordsRead = weekSessions._sum.wordsRead || 0
    const sessionsCount = weekSessions._count

    // Skip users who didn't read at all this week — no point emailing them
    if (sessionsCount === 0 && wordsRead === 0) continue

    // ── New chapters from subscribed authors ──
    const authorIds = user.subscriptions.map(s => s.authorId)
    let newChapters: DigestPayload['newChapters'] = []

    if (authorIds.length > 0) {
      const recentSections = await prisma.section.findMany({
        where: {
          status: 'published',
          publishedAt: { gte: sevenDaysAgo },
          work: { authorId: { in: authorIds } },
        },
        select: {
          title: true,
          chapterNumber: true,
          work: {
            select: {
              id: true,
              title: true,
              author: {
                select: {
                  user: { select: { displayName: true, username: true } },
                },
              },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      })

      newChapters = recentSections.map(sec => ({
        workTitle: sec.work.title,
        chapterTitle: sec.title || `Chapter ${sec.chapterNumber || '?'}`,
        authorName: sec.work.author.user.displayName || sec.work.author.user.username,
        url: `/story/${sec.work.id}/chapter/${sec.chapterNumber || '1'}`,
      }))
    }

    // ── Simple streak calc ──
    const recentSessionDays = await prisma.readingSession.findMany({
      where: {
        userId: user.id,
        sessionStart: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { sessionStart: true },
      orderBy: { sessionStart: 'desc' },
    })

    const daySet = new Set<string>()
    recentSessionDays.forEach(s => daySet.add(s.sessionStart.toISOString().slice(0, 10)))

    let streak = 0
    const check = new Date(now)
    const todayStr = check.toISOString().slice(0, 10)
    if (!daySet.has(todayStr)) check.setDate(check.getDate() - 1)
    while (daySet.has(check.toISOString().slice(0, 10))) {
      streak++
      check.setDate(check.getDate() - 1)
    }

    payloads.push({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      weeklyStats: { sessionsCount, minutesRead, wordsRead, worksStarted },
      newChapters,
      currentStreak: streak,
    })
  }

  return payloads
}

/**
 * Render a digest payload into HTML email content.
 */
export function renderDigestEmail(payload: DigestPayload): { subject: string; html: string } {
  const name = payload.displayName || 'Reader'
  const { minutesRead, wordsRead, sessionsCount, worksStarted } = payload.weeklyStats
  const APP_URL = process.env.NEXTAUTH_URL || 'https://chapturs.com'

  const streakLine = payload.currentStreak > 0
    ? `<p style="color:#f97316;font-weight:600;margin:0 0 16px">🔥 ${payload.currentStreak}-day reading streak! Keep it going.</p>`
    : ''

  const chapterRows = payload.newChapters.length > 0
    ? `
      <h3 style="margin:24px 0 8px;font-size:14px;color:#333">New from authors you follow:</h3>
      <table style="width:100%;border-collapse:collapse">
        ${payload.newChapters.map(ch => `
          <tr>
            <td style="padding:6px 0;border-bottom:1px solid #eee">
              <a href="${APP_URL}${ch.url}" style="color:#2563eb;text-decoration:none;font-weight:500">${ch.chapterTitle}</a>
              <span style="color:#888;font-size:12px"> — ${ch.workTitle} by ${ch.authorName}</span>
            </td>
          </tr>
        `).join('')}
      </table>
    `
    : ''

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;padding:32px 24px;color:#111">
      <h1 style="margin:0 0 4px;font-size:22px">Your Week in Reading</h1>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Hi ${name}, here's your reading recap.</p>

      ${streakLine}

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="text-align:center;padding:16px;background:#f8fafc;border-radius:8px 0 0 8px">
            <div style="font-size:24px;font-weight:700;color:#111">${sessionsCount}</div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Sessions</div>
          </td>
          <td style="text-align:center;padding:16px;background:#f8fafc">
            <div style="font-size:24px;font-weight:700;color:#111">${minutesRead}m</div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Read</div>
          </td>
          <td style="text-align:center;padding:16px;background:#f8fafc">
            <div style="font-size:24px;font-weight:700;color:#111">${(wordsRead / 1000).toFixed(1)}K</div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Words</div>
          </td>
          <td style="text-align:center;padding:16px;background:#f8fafc;border-radius:0 8px 8px 0">
            <div style="font-size:24px;font-weight:700;color:#111">${worksStarted}</div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Stories</div>
          </td>
        </tr>
      </table>

      ${chapterRows}

      <div style="margin-top:32px;text-align:center">
        <a href="${APP_URL}/reader/stats" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Full Stats</a>
      </div>

      <p style="margin-top:32px;font-size:11px;color:#bbb;text-align:center">
        You're receiving this because you opted in to the weekly digest.
        <a href="${APP_URL}/reader/settings" style="color:#888">Unsubscribe</a>
      </p>
    </div>
  `

  return {
    subject: `📖 Your Week in Reading — ${minutesRead}m read, ${sessionsCount} sessions`,
    html,
  }
}
