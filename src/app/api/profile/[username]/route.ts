export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

interface RouteParams {
  params: Promise<{
    username: string
  }>
}

// GET /api/profile/[username] - Get public profile data
export async function GET(request: Request, props: RouteParams) {
  const params = await props.params
  try {
    const { username } = params

    // Fetch user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        verified: true,
        bio: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch author profile
    const author = await prisma.author.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        verified: true,
        _count: {
          select: {
            works: true,
            subscriptions: true,
          }
        }
      }
    })

    // Fetch user's published works
    const works = author ? await prisma.work.findMany({
      where: {
        authorId: author.id,
        status: { in: ['published', 'ongoing', 'completed'] }
      },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        formatType: true,
        status: true,
        genres: true,
        tags: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            bookmarks: true,
            sections: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }) : []

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        verified: user.verified,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      author: author ? {
        id: author.id,
        verified: author.verified,
        workCount: author._count.works,
        subscriberCount: author._count.subscriptions,
      } : null,
      works: works.map(w => ({
        ...w,
        genres: JSON.parse(w.genres || '[]'),
        tags: JSON.parse(w.tags || '[]'),
        statistics: {
          likes: w._count.likes,
          bookmarks: w._count.bookmarks,
          sections: w._count.sections,
        },
      })),
      profile: null,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
