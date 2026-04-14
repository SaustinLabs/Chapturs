export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

interface RouteParams {
  params: Promise<{
    username: string
  }>
}

function parseStringArray(input: string | null | undefined): string[] {
  if (!input) return []
  try {
    const parsed = JSON.parse(input)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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
        isPremium: true,
        featuredCommentCount: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch author profile (with CreatorProfile and blocks)
    const author = await prisma.author.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        verified: true,
        creatorProfile: {
          select: {
            bio: true,
            profileImage: true,
            coverImage: true,
            featuredType: true,
            featuredWorkId: true,
            accentColor: true,
            fontStyle: true,
            backgroundStyle: true,
            isPublished: true,
            blocks: {
              where: { isVisible: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                type: true,
                data: true,
                gridX: true,
                gridY: true,
                width: true,
                height: true,
                title: true,
                order: true,
              },
            },
          },
        },
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
        isPremium: user.isPremium,
        featuredCommentCount: user.featuredCommentCount,
      },
      author: author ? {
        id: author.id,
        verified: author.verified,
        workCount: author._count.works,
        subscriberCount: author._count.subscriptions,
      } : null,
      works: works.map(w => ({
        ...w,
        genres: parseStringArray(w.genres),
        tags: parseStringArray(w.tags),
        statistics: {
          likes: w._count.likes,
          bookmarks: w._count.bookmarks,
          sections: w._count.sections,
        },
      })),
      profile: author?.creatorProfile
        ? {
            bio: author.creatorProfile.bio,
            profileImage: author.creatorProfile.profileImage,
            coverImage: author.creatorProfile.coverImage,
            featuredType: author.creatorProfile.featuredType,
            featuredWorkId: author.creatorProfile.featuredWorkId,
            accentColor: author.creatorProfile.accentColor,
            fontStyle: author.creatorProfile.fontStyle,
            backgroundStyle: author.creatorProfile.backgroundStyle,
            isPublished: author.creatorProfile.isPublished,
            blocks: author.creatorProfile.blocks.map(b => ({
              ...b,
              data: (() => { try { return JSON.parse(b.data) } catch { return {} } })(),
            })),
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
