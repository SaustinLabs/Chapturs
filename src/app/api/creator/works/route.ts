export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

// GET /api/creator/works - Get all creator's works
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const author = await prisma.author.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        works: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            formatType: true,
            coverImage: true,
            status: true,
            maturityRating: true,
            genres: true,
            tags: true,
            statistics: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                sections: true,
                likes: true,
                bookmarks: true,
                comments: true,
              }
            }
          }
        }
      }
    })

    if (!author) {
      return NextResponse.json({ works: [] })
    }

    const works = author.works.map(w => ({
      ...w,
      genres: JSON.parse(w.genres || '[]'),
      tags: JSON.parse(w.tags || '[]'),
      chapters: w._count.sections,
      likes: w._count.likes,
      bookmarks: w._count.bookmarks,
      comments: w._count.comments,
    }))

    return NextResponse.json({ works })
  } catch (error) {
    console.error('Creator works error:', error)
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 })
  }
}
