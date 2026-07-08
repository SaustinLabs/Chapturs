export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

// GET /api/reading-lists/[id] — fetch a single reading list (public or owner)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    const list = await prisma.readingList.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            work: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: { id: true, username: true, displayName: true },
        },
      },
    })

    if (!list) {
      return NextResponse.json({ error: 'Reading list not found' }, { status: 404 })
    }

    // Enforce visibility: only the owner may view a private list
    if (!list.isPublic && list.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ readingList: list })
  } catch (error) {
    console.error('GET /api/reading-lists/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/reading-lists/[id] — update a reading list (owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.readingList.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Reading list not found' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const data: {
      name?: string
      description?: string | null
      isPublic?: boolean
    } = {}

    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim().slice(0, 120)
    }
    if (typeof body.description === 'string') {
      data.description = body.description.trim().slice(0, 2000) || null
    }
    if (typeof body.isPublic === 'boolean') {
      data.isPublic = body.isPublic
    }

    const updated = await prisma.readingList.update({
      where: { id },
      data,
    })

    return NextResponse.json({ readingList: updated })
  } catch (error) {
    console.error('PUT /api/reading-lists/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reading-lists/[id] — delete a reading list (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.readingList.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Reading list not found' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.readingList.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/reading-lists/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
