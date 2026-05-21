import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

/**
 * POST /api/works/[id]/complete
 *
 * Persists a per-user completion event for a work as a UserSignal
 * (signalType: 'work_complete', value: 1.0).  Idempotent — repeated
 * calls update the timestamp on the existing signal rather than
 * creating duplicates.
 *
 * Used by the reader client when a user reaches the last chapter,
 * and feeds reader-to-reader recommendation computation.
 */
export async function POST(
  _req: NextRequest,
  { params }: Params
) {
  const { id: workId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Verify the work exists and is publicly readable
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true, status: true },
  })

  if (!work) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  }

  if (work.status === 'draft') {
    return NextResponse.json({ error: 'Work is not published' }, { status: 403 })
  }

  // Upsert completion signal — one row per user/work pair.
  // UserSignal has no @@unique on (userId, workId, signalType), so we use
  // findFirst + conditional create/update.
  const existing = await prisma.userSignal.findFirst({
    where: { userId, workId, signalType: 'work_complete' },
    select: { id: true },
  })

  if (existing) {
    await prisma.userSignal.update({
      where: { id: existing.id },
      data: { timestamp: new Date() },
    })
  } else {
    await prisma.userSignal.create({
      data: {
        userId,
        workId,
        signalType: 'work_complete',
        value: 1.0,
      },
    })
  }

  return NextResponse.json({ completed: true })
}
