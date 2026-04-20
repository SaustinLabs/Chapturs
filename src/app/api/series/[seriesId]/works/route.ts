import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

export const runtime = 'nodejs'

type Params = { params: Promise<{ seriesId: string }> }

async function resolveOwnership(seriesId: string, userId: string) {
  const author = await prisma.author.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!author) return null

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { id: true, authorId: true },
  })
  if (!series || series.authorId !== author.id) return null
  return series
}

// GET /api/series/[seriesId]/works  — list membership entries
export async function GET(_req: NextRequest, { params }: Params) {
  const { seriesId } = await params

  const exists = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { id: true },
  })
  if (!exists) {
    return NextResponse.json({ error: 'Series not found' }, { status: 404 })
  }

  const works = await prisma.seriesWork.findMany({
    where: { seriesId },
    include: {
      work: {
        select: {
          id: true,
          title: true,
          description: true,
          coverImage: true,
          status: true,
          genres: true,
        },
      },
      volume: { select: { id: true, title: true } },
    },
    orderBy: { orderIndex: 'asc' },
  })

  return NextResponse.json({ works })
}

// POST /api/series/[seriesId]/works  — add work to series
export async function POST(req: NextRequest, { params }: Params) {
  const { seriesId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const owned = await resolveOwnership(seriesId, session.user.id)
  if (!owned) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
  }

  const body = await req.json()
  const { workId, volumeId, orderIndex } = body

  if (!workId || typeof workId !== 'string') {
    return NextResponse.json({ error: 'workId is required' }, { status: 400 })
  }

  // Verify the work belongs to this author
  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true, authorId: true },
  })
  if (!work || work.authorId !== author!.id) {
    return NextResponse.json({ error: 'Work not found or not owned by you' }, { status: 403 })
  }

  // Determine next orderIndex if not provided
  let idx = typeof orderIndex === 'number' ? orderIndex : 0
  if (typeof orderIndex !== 'number') {
    const last = await prisma.seriesWork.findFirst({
      where: { seriesId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })
    idx = last ? last.orderIndex + 1 : 0
  }

  const entry = await prisma.seriesWork.upsert({
    where: { seriesId_workId: { seriesId, workId } },
    create: {
      seriesId,
      workId,
      volumeId: volumeId ?? null,
      orderIndex: idx,
    },
    update: {
      volumeId: volumeId ?? null,
      orderIndex: idx,
    },
    include: {
      work: { select: { id: true, title: true, coverImage: true } },
      volume: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json({ entry }, { status: 201 })
}

// DELETE /api/series/[seriesId]/works  — remove work from series (body: { workId })
export async function DELETE(req: NextRequest, { params }: Params) {
  const { seriesId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const owned = await resolveOwnership(seriesId, session.user.id)
  if (!owned) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
  }

  const body = await req.json()
  const { workId } = body
  if (!workId) {
    return NextResponse.json({ error: 'workId is required' }, { status: 400 })
  }

  await prisma.seriesWork.deleteMany({ where: { seriesId, workId } })

  return NextResponse.json({ removed: true })
}
