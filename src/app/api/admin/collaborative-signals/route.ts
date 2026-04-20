export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { computeCollaborativeSignals } from '@/lib/recommendations/similarity'
import { computeReaderToReaderRecommendations } from '@/lib/recommendations/reader-signals'

/**
 * POST /api/admin/collaborative-signals
 *
 * Admin-only manual trigger for collaborative similarity computation.
 * Iterates all published/ongoing works and runs computeCollaborativeSignals
 * and computeReaderToReaderRecommendations for each. Works with insufficient
 * readership are silently skipped by the underlying functions.
 *
 * Auth: either an admin session cookie OR the x-scheduler-secret header
 * (used by the GitHub Actions cron job — value must match ADMIN_SCHEDULER_SECRET).
 *
 * Returns { success: true, processed: number, types: string[] }
 */
export async function POST(req: NextRequest) {
  // Support scheduler-secret auth for headless cron calls
  const schedulerSecret = process.env.ADMIN_SCHEDULER_SECRET
  const headerSecret = req.headers.get('x-scheduler-secret')
  const isScheduler = schedulerSecret && headerSecret === schedulerSecret

  if (!isScheduler) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const works = await prisma.work.findMany({
    where: { status: { in: ['published', 'ongoing'] } },
    select: { id: true },
  })

  for (const work of works) {
    await computeCollaborativeSignals(work.id)
    await computeReaderToReaderRecommendations(work.id)
  }

  return NextResponse.json({
    success: true,
    processed: works.length,
    types: ['collaborative', 'reader_to_reader'],
  })
}
