export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

// GET /api/works/[id]/featured-comments
// Returns up to 10 featured comments for a work's story page carousel
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const comments = await prisma.comment.findMany({
      where: {
        workId: id,
        isFeatured: true,
        isHidden: false,
        parentId: null, // top-level only
      },
      orderBy: { featuredAt: 'desc' },
      take: 10,
      select: {
        id: true,
        content: true,
        createdAt: true,
        featuredAt: true,
        sectionId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching featured comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured comments' },
      { status: 500 }
    )
  }
}
