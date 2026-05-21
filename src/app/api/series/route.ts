import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

export const runtime = 'nodejs'

// GET /api/series?authorId=&page=1&pageSize=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const authorId = searchParams.get('authorId')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)))

  if (!authorId) {
    return NextResponse.json({ error: 'authorId is required' }, { status: 400 })
  }

  const [series, total] = await Promise.all([
    prisma.series.findMany({
      where: { authorId },
      include: {
        volumes: { orderBy: { orderIndex: 'asc' } },
        works: {
          include: { work: { select: { id: true, title: true, coverImage: true, status: true } } },
          orderBy: { orderIndex: 'asc' },
        },
        _count: { select: { works: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.series.count({ where: { authorId } }),
  ])

  return NextResponse.json({
    series,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
}

// POST /api/series  — create a new series
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!author) {
    return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, coverImage, status } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const allowedStatuses = ['ongoing', 'completed', 'hiatus']
  const seriesStatus = allowedStatuses.includes(status) ? status : 'ongoing'

  const series = await prisma.series.create({
    data: {
      authorId: author.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      coverImage: coverImage ?? null,
      status: seriesStatus,
    },
    include: {
      volumes: true,
      works: true,
      _count: { select: { works: true } },
    },
  })

  return NextResponse.json({ series }, { status: 201 })
}
