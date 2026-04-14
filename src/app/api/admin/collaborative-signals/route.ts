export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { computeCollaborativeSignals } from '@/lib/recommendations/similarity'

/**
 * POST /api/admin/collaborative-signals
 *
 * Admin-only manual trigger for collaborative similarity computation.
 * Iterates all published/ongoing works and runs computeCollaborativeSignals
 * for each. Works with insufficient readership are silently skipped by the
 * underlying function (MIN_CO_READS guard).
 *
 * Returns { success: true, processed: number }
 */
export async function POST(_req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const works = await prisma.work.findMany({
    where: { status: { in: ['published', 'ongoing'] } },
    select: { id: true },
  })

  for (const work of works) {
    await computeCollaborativeSignals(work.id)
  }

  return NextResponse.json({ success: true, processed: works.length })
}
