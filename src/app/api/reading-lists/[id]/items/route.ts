export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

// POST /api/reading-lists/[id]/items — add a work to a reading list (owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const list = await prisma.readingList.findUnique({ where: { id } })
    if (!list) {
      return NextResponse.json({ error: 'Reading list not found' }, { status: 404 })
    }
    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body.workId !== 'string' || !body.workId.trim()) {
      return NextResponse.json({ error: 'workId is required' }, { status: 400 })
    }

    const workId = body.workId.trim()

    // Ensure the work exists
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { id: true },
    })
    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Compute the next orderIndex (append to end)
    const lastItem = await prisma.readingListItem.findFirst({
      where: { readingListId: id },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })
    const orderIndex = (lastItem?.orderIndex ?? -1) + 1

    const note =
      typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : null

    try {
      const item = await prisma.readingListItem.create({
        data: {
          readingListId: id,
          workId,
          orderIndex,
          note,
        },
        include: {
          work: {
            select: {
              id: true,
              title: true,
              coverImage: true,
            },
          },
        },
      })

      return NextResponse.json({ item }, { status: 201 })
    } catch (createError: any) {
      // Unique constraint: work already in this list
      if (createError?.code === 'P2002') {
        return NextResponse.json(
          { error: 'Work is already in this reading list' },
          { status: 409 }
        )
      }
      throw createError
    }
  } catch (error) {
    console.error('POST /api/reading-lists/[id]/items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
