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

// GET /api/series/[seriesId]
export async function GET(_req: NextRequest, { params }: Params) {
  const { seriesId } = await params

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      author: { select: { id: true, userId: true, user: { select: { name: true, image: true } } } },
      volumes: { orderBy: { orderIndex: 'asc' } },
      works: {
        include: {
          work: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImage: true,
              status: true,
              genres: true,
              statistics: true,
            },
          },
          volume: { select: { id: true, title: true } },
        },
        orderBy: { orderIndex: 'asc' },
      },
      _count: { select: { works: true } },
    },
  })

  if (!series) {
    return NextResponse.json({ error: 'Series not found' }, { status: 404 })
  }

  return NextResponse.json({ series })
}

// PATCH /api/series/[seriesId]
export async function PATCH(req: NextRequest, { params }: Params) {
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
  const { title, description, coverImage, status } = body

  const allowedStatuses = ['ongoing', 'completed', 'hiatus']

  const series = await prisma.series.update({
    where: { id: seriesId },
    data: {
      ...(title != null && { title: String(title).trim() }),
      ...(description != null && { description: String(description).trim() }),
      ...(coverImage != null && { coverImage }),
      ...(status != null && allowedStatuses.includes(status) && { status }),
    },
    include: {
      volumes: { orderBy: { orderIndex: 'asc' } },
      works: { include: { work: { select: { id: true, title: true, coverImage: true } } } },
      _count: { select: { works: true } },
    },
  })

  return NextResponse.json({ series })
}

// DELETE /api/series/[seriesId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { seriesId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const owned = await resolveOwnership(seriesId, session.user.id)
  if (!owned) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
  }

  await prisma.series.delete({ where: { id: seriesId } })

  return NextResponse.json({ deleted: true })
}
