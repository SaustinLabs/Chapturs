import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'

// POST /api/works/drafts - Create new work draft (not published to main library)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      formatType,
      coverImage,
      genres = [],
      tags = [],
      maturityRating = 'PG'
    } = body

    if (!title || !description || !formatType) {
      return NextResponse.json(
        { error: 'Title, description, and format type are required' },
        { status: 400 }
      )
    }

    // Get the author profile for this user
    let author = await prisma.author.findUnique({
      where: { userId: session.user.id }
    })

    // If no author profile exists, create one
    if (!author) {
      author = await prisma.author.create({
        data: {
          userId: session.user.id,
          verified: false,
          socialLinks: '[]',
        }
      })
    }

    // Create work draft - this creates a record but with status='unpublished' 
    // so it won't appear in feeds or public listings
    const draft = await prisma.work.create({
      data: {
        title,
        description,
        authorId: author.id,
        formatType,
        coverImage: coverImage,
        status: 'unpublished', // Special status that prevents it from appearing in feeds
        maturityRating,
        genres: JSON.stringify(genres),
        tags: JSON.stringify(tags),
        glossary: JSON.stringify([]),
        statistics: JSON.stringify({
          likes: 0,
          bookmarks: 0,
          views: 0,
          wordCount: 0
        })
      }
    })

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        title: draft.title,
        description: draft.description,
        formatType: draft.formatType,
        status: draft.status
      }
    })

  } catch (error) {
    console.error('Work draft creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create work draft' },
      { status: 500 }
    )
  }
}

// GET /api/works/drafts - Get user's work drafts
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the author profile for this user
    let author = await prisma.author.findUnique({
      where: { userId: session.user.id }
    })

    if (!author) {
      return NextResponse.json({
        success: true,
        drafts: []
      })
    }

    const drafts = await prisma.work.findMany({
      where: {
        authorId: author.id,
        status: 'unpublished' // Only get unpublished drafts
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      drafts
    })

  } catch (error) {
    console.error('Drafts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    )
  }
}
