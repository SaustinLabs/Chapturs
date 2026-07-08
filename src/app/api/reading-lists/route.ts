export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

// GET /api/reading-lists — list the current user's reading lists
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lists = await prisma.readingList.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    })

    return NextResponse.json({ readingLists: lists })
  } catch (error) {
    console.error('GET /api/reading-lists error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reading-lists — create a new reading list
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const name = body.name.trim().slice(0, 120)
    const description =
      typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : null
    const isPublic = typeof body.isPublic === 'boolean' ? body.isPublic : true

    const list = await prisma.readingList.create({
      data: {
        userId: session.user.id,
        name,
        description,
        isPublic,
      },
    })

    return NextResponse.json({ readingList: list }, { status: 201 })
  } catch (error) {
    console.error('POST /api/reading-lists error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
