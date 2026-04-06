import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

const MAX_AUTHOR_PICKS = 4

/**
 * GET  — returns the current author-curated list for this work.
 * PUT  — replaces the list (author only, max 4 works).
 * Expects body: { recommendedWorkIds: string[] }
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const rows = await prisma.authorRecommendation.findMany({
    where: { workId: id },
    orderBy: { sortOrder: 'asc' },
    select: {
      sortOrder: true,
      recommendedWork: {
        select: {
          id: true,
          title: true,
          coverImage: true,
          status: true,
          genres: true,
          author: { select: { user: { select: { username: true, displayName: true } } } },
        },
      },
    },
  })

  return NextResponse.json({ data: rows.map((r: any) => r.recommendedWork) })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Verify the caller owns this work
  const work = await prisma.work.findUnique({
    where: { id },
    select: { authorId: true, author: { select: { userId: true } } },
  })

  if (!work) return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  const dbUserId = await resolveDbUserId(session)
  if (work.author.userId !== dbUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const recommendedWorkIds: unknown = body?.recommendedWorkIds

  if (!Array.isArray(recommendedWorkIds)) {
    return NextResponse.json({ error: 'recommendedWorkIds must be an array' }, { status: 400 })
  }

  // Sanitise: strings only, no duplicates, exclude self, cap at MAX_AUTHOR_PICKS
  const ids = [...new Set(
    recommendedWorkIds
      .filter((x): x is string => typeof x === 'string' && x.length > 0)
      .filter((x) => x !== id)
  )].slice(0, MAX_AUTHOR_PICKS)

  // Verify all target works exist and are not drafts
  const validWorks = await prisma.work.findMany({
    where: { id: { in: ids }, status: { not: 'draft' } },
    select: { id: true },
  })
  const validIds = new Set(validWorks.map((w: any) => w.id))
  const safeIds = ids.filter((x) => validIds.has(x))

  // Replace the set atomically
  await prisma.$transaction([
    prisma.authorRecommendation.deleteMany({ where: { workId: id } }),
    ...safeIds.map((recId, idx) =>
      prisma.authorRecommendation.create({
        data: { workId: id, recommendedWorkId: recId, sortOrder: idx },
      })
    ),
  ])

  return NextResponse.json({ data: { saved: safeIds } })
}
