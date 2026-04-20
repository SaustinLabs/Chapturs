import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

export const runtime = 'nodejs'

type Params = { params: Promise<{ seriesId: string }> }

// POST /api/series/[seriesId]/subscribe
// Idempotently bookmarks all published works in the series for the current user.
export async function POST(_req: NextRequest, { params }: Params) {
  const { seriesId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      works: {
        include: {
          work: { select: { id: true, status: true } },
        },
      },
    },
  })

  if (!series) {
    return NextResponse.json({ error: 'Series not found' }, { status: 404 })
  }

  // Only subscribe to published works
  const publishedWorkIds = series.works
    .filter((sw) => sw.work.status !== 'draft')
    .map((sw) => sw.workId)

  if (publishedWorkIds.length === 0) {
    return NextResponse.json({ subscribed: 0, message: 'No published works in this series' })
  }

  // Idempotent bulk bookmark using createMany + skipDuplicates
  const result = await prisma.bookmark.createMany({
    data: publishedWorkIds.map((workId) => ({
      userId,
      workId,
      shelf: 'reading',
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({
    subscribed: result.count,
    total: publishedWorkIds.length,
    message: `Subscribed to ${result.count} new work(s) in this series`,
  })
}

// DELETE /api/series/[seriesId]/subscribe
// Removes bookmarks for all works in this series.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { seriesId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: { works: { select: { workId: true } } },
  })

  if (!series) {
    return NextResponse.json({ error: 'Series not found' }, { status: 404 })
  }

  const workIds = series.works.map((sw) => sw.workId)

  const result = await prisma.bookmark.deleteMany({
    where: { userId, workId: { in: workIds } },
  })

  return NextResponse.json({ removed: result.count })
}
