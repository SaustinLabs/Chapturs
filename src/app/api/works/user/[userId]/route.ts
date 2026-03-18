export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'

// use shared prisma instance from PrismaService

// GET /api/works/user/[userId] - Get all works for a specific user (published + drafts)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is requesting their own works
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the author profile for this user
    let author = await prisma.author.findUnique({
      where: { userId: session.user.id }
    })

    if (!author) {
      return NextResponse.json({
        success: true,
        works: [],
        drafts: []
      })
    }

    // Get both published works and drafts
    const [publishedWorks, drafts] = await Promise.all([
      // Published works (status: published, ongoing, completed)
      prisma.work.findMany({
        where: {
          authorId: author.id,
          status: {
            in: ['published', 'ongoing', 'completed']
          }
        },
        include: {
          sections: true,
          author: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }),
      
      // Drafts (status: unpublished, pending_review)
      prisma.work.findMany({
        where: {
          authorId: author.id,
          status: {
            in: ['unpublished', 'pending_review']
          }
        },
        include: {
          sections: true,
          author: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    ])

    // Transform to our Work type format
    const mapWork = (work: any) => ({
      id: work.id,
      title: work.title,
      description: work.description,
      formatType: work.formatType,
      coverImage: work.coverImage,
      status: work.status,
      maturityRating: work.maturityRating,
      genres: Array.isArray(work.genres) ? work.genres : JSON.parse(work.genres || '[]'),
      tags: Array.isArray(work.tags) ? work.tags : JSON.parse(work.tags || '[]'),
      statistics: JSON.parse(work.statistics || '{"views": 0, "subscribers": 0, "averageRating": 0}'),
      glossary: JSON.parse(work.glossary || '[]'),
      sections: work.sections || [],
      author: {
        id: work.author.id,
        username: work.author.user.username,
        displayName: work.author.user.displayName,
        avatar: work.author.user.avatar,
        verified: work.author.verified
      },
      createdAt: work.createdAt,
      updatedAt: work.updatedAt
    })

    return NextResponse.json({
      success: true,
      works: publishedWorks.map(mapWork),
      drafts: drafts.map(mapWork)
    })

  } catch (error) {
    console.error('User works fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user works' },
      { status: 500 }
    )
  }
}
