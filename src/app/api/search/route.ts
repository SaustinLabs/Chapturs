export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import {
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
  addCorsHeaders,
} from '@/lib/api/errorHandling'

function safeJsonParse(str: string | null | undefined, fallback: any) {
  try { return str ? JSON.parse(str) : fallback } catch { return fallback }
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const genre = searchParams.get('genre') || ''
    const status = searchParams.get('status') || ''
    const maturityRating = searchParams.get('maturityRating') || ''
    const formatType = searchParams.get('formatType') || ''
    const sortBy = searchParams.get('sortBy') || 'popular'
    const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, any> = {
      status: { not: 'draft' },
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status
    if (maturityRating) where.maturityRating = maturityRating
    if (formatType) where.formatType = formatType
    // Genre stored as JSON string — use a substring search
    if (genre) where.genres = { contains: genre }

    let orderBy: any
    if (sortBy === 'recent') {
      orderBy = { updatedAt: 'desc' }
    } else if (sortBy === 'alpha') {
      orderBy = { title: 'asc' }
    } else {
      // popular: sort by viewCount descending
      orderBy = { viewCount: 'desc' }
    }

    const works = await prisma.work.findMany({
      where,
      include: {
        author: { include: { user: true } },
        _count: { select: { bookmarks: true, likes: true, sections: true } },
      },
      orderBy,
      skip: offset,
      take: limit,
    })

    const items = works
      .filter((work: any) => work.author && work.author.user)
      .map((work: any) => ({
        id: `search-${work.id}`,
        work: {
          id: work.id,
          title: work.title,
          description: work.description,
          coverImage: work.coverImage,
          formatType: work.formatType,
          status: work.status,
          maturityRating: work.maturityRating,
          genres: safeJsonParse(work.genres, []),
          tags: safeJsonParse(work.tags, []),
          author: {
            id: work.author.id,
            username: work.author.user.username,
            displayName: work.author.user.displayName,
            avatar: work.author.user.avatar,
            verified: work.author.verified,
          },
          statistics: {
            bookmarks: work._count.bookmarks,
            likes: work._count.likes,
            sections: work._count.sections,
            views: work.viewCount,
            subscribers: 0,
            comments: 0,
            averageRating: 0,
            ratingCount: 0,
            ...safeJsonParse(work.statistics, {}),
          },
          createdAt: work.createdAt,
          updatedAt: work.updatedAt,
        },
        feedType: 'discovery' as const,
        reason: q ? `Matched "${q}"` : 'Search result',
        score: work._count.likes * 2 + work._count.bookmarks + work.viewCount / 100,
        readingStatus: 'unread' as const,
        addedToFeedAt: new Date(),
        bookmark: false,
        liked: false,
      }))

    const response = createSuccessResponse(
      { items, total: items.length, hasMore: items.length === limit },
      `Found ${items.length} results`,
      requestId
    )
    return addCorsHeaders(response)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

export async function OPTIONS() {
  const { NextResponse } = await import('next/server')
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}
