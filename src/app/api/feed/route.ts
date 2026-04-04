export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  checkRateLimitAsync,
  addCorsHeaders,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'
import { z } from 'zod'
import IntelligentRecommendationEngine from '@/lib/recommendations/IntelligentRecommendationEngine'
import { getRedis } from '@/lib/redis'

// use shared prisma instance from PrismaService

// Feed query validation
const feedQuerySchema = z.object({
  hubMode: z.enum(['reader', 'creator']).default('reader'),
  userId: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0)
})

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting — use a broad shared limit since x-forwarded-for may not be
    // set by the reverse proxy, causing all traffic to share one 'anonymous' bucket.
    // Per-IP limiting is enforced by Nginx upstream.
    const clientId = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null
    if (clientId) {
      await checkRateLimitAsync(`feed_${clientId}`, 120, 60000) // 120/min per real IP
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      hubMode: searchParams.get('hubMode') || 'reader',
      userId: searchParams.get('userId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10)
    }

    const { hubMode, userId, limit, offset } = feedQuerySchema.parse(queryParams)

    // Optional authentication - feed works without login but can be personalized
    let session = null
    try {
      session = await auth()
    } catch (error) {
      // Ignore auth errors for public feed
    }

    let feedItems
    
    if (session?.user?.id) {
      // Authenticated user - use intelligent recommendations
      try {
        feedItems = await IntelligentRecommendationEngine.generatePersonalizedFeed(
          session.user.id,
          limit,
          {
            diversityWeight: 0.3,
            freshnessWeight: 0.2,
            qualityThreshold: 0.1
          }
        )
      } catch (error) {
        console.error('Failed to generate personalized feed, falling back to generic:', error)
        feedItems = await getFallbackFeed(limit, offset, session?.user?.id)
      }
    } else {
      // Guest user - show popular/trending content
      feedItems = await getFallbackFeed(limit, offset)
    }

    // If we didn't get enough items, supplement with generic content
    if (feedItems.length < limit) {
      try {
        const supplemental = await getFallbackFeed(limit - feedItems.length, offset + feedItems.length, session?.user?.id)
        feedItems.push(...supplemental)
      } catch (suppErr) {
        console.error('Supplemental feed fetch failed (non-fatal):', suppErr)
      }
    }

    // Batch-annotate bookmark/like status so FeedCard doesn't need per-card API calls
    if (session?.user?.id && feedItems.length > 0) {
      try {
        const workIds = feedItems.map((item: any) => item.work?.id).filter(Boolean)
        const [bookmarks, likes] = await Promise.all([
          prisma.bookmark.findMany({ where: { userId: session.user.id, workId: { in: workIds } }, select: { workId: true } }),
          prisma.like.findMany({ where: { userId: session.user.id, workId: { in: workIds } }, select: { workId: true } })
        ])
        const bookmarkedIds = new Set(bookmarks.map((b: any) => b.workId))
        const likedIds = new Set(likes.map((l: any) => l.workId))
        feedItems = feedItems.map((item: any) => ({
          ...item,
          bookmark: bookmarkedIds.has(item.work?.id),
          liked: likedIds.has(item.work?.id)
        }))
      } catch (e) {
        // non-critical — FeedCard falls back to individual checks
      }
    }

    const response = createSuccessResponse({
      items: feedItems,
      pagination: {
        offset,
        limit, 
        total: feedItems.length,
        hasMore: feedItems.length === limit
      },
      hubMode,
      userId,
      isAuthenticated: !!session?.user
    }, `Found ${feedItems.length} items`, requestId)

    // Cache anonymous feed briefly at the edge; never cache personalised feeds
    if (!session?.user?.id) {
      response.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30')
    } else {
      response.headers.set('Cache-Control', 'private, no-store')
    }

    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

// Fallback feed for guest users or when personalization fails.
// Results are cached in Redis for 30 seconds to avoid hammering the DB
// on every anonymous page load.
const FALLBACK_FEED_TTL = 30 // seconds

async function getFallbackFeed(limit: number, offset: number, userId?: string) {
  // For anonymous requests (no userId) serve from Redis cache when available.
  // Personalised results (userId present) are never cached.
  if (!userId) {
    const redis = getRedis()
    const cacheKey = `feed:fallback:${limit}:${offset}`
    if (redis) {
      try {
        const cached = await redis.get<any[]>(cacheKey)
        if (cached) return cached
      } catch { /* cache miss — continue to DB */ }
    }

    // Build from DB, then cache
    const result = await buildFallbackFeed(limit, offset, undefined)
    if (redis) {
      try { await redis.set(cacheKey, result, { ex: FALLBACK_FEED_TTL }) } catch { /* non-fatal */ }
    }
    return result
  }

  return buildFallbackFeed(limit, offset, userId)
}

async function buildFallbackFeed(limit: number, offset: number, userId: string | undefined) {
  let subscribedAuthorIds: string[] = []
  if (userId) {
    try {
      const subs = await prisma.subscription.findMany({
        where: { userId },
        select: { authorId: true }
      })
      subscribedAuthorIds = subs.map(s => s.authorId)
    } catch (e) {
      // ignore — personalisation is best-effort
    }
  }

  let works: any[] = []
  try {
    works = await prisma.work.findMany({
      where: {
        status: { in: ['published', 'ongoing', 'completed'] }
      },
      include: {
        author: {
          include: { user: true }
        },
        _count: {
          select: {
            bookmarks: true,
            likes: true,
            sections: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    })
  } catch (err) {
    console.error('[getFallbackFeed] prisma.work.findMany failed:', err)
    return []
  }

  const safeJsonParse = (str: string | null | undefined, fallback: any) => {
    try { return str ? JSON.parse(str) : fallback } catch { return fallback }
  }

  return works
    .filter((work: any) => work.author && work.author.user)
    .map((work: any) => ({
      id: `${work.id}-feed`,
      work: {
        id: work.id,
        title: work.title,
        description: work.description,
        formatType: work.formatType,
        coverImage: work.coverImage,
        status: work.status,
        maturityRating: work.maturityRating,
        genres: safeJsonParse(work.genres, []),
        tags: safeJsonParse(work.tags, []),
        author: {
          id: work.author.id,
          username: work.author.user.username,
          displayName: work.author.user.displayName,
          avatar: work.author.user.avatar,
          verified: work.author.verified
        },
        statistics: {
          bookmarks: work._count.bookmarks,
          likes: work._count.likes,
          sections: work._count.sections,
          views: 0,
          subscribers: 0,
          comments: 0,
          averageRating: 0,
          ratingCount: 0,
          ...safeJsonParse(work.statistics, {})
        },
        createdAt: work.createdAt,
        updatedAt: work.updatedAt
      },
      feedType: subscribedAuthorIds.includes(work.authorId) ? 'subscribed' as const
        : (work._count.likes + work._count.bookmarks) > 3 ? 'algorithmic' as const
        : 'discovery' as const,
      reason: subscribedAuthorIds.includes(work.authorId) ? 'From an author you follow'
        : (work._count.likes + work._count.bookmarks) > 3 ? 'Trending with readers'
        : 'Popular content',
      score: (work._count.likes * 2 + work._count.bookmarks + work._count.sections) / 10 + Math.random() * 0.1,
      readingStatus: 'unread' as const,
      addedToFeedAt: new Date(),
      bookmark: false,
      liked: false
    }))
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
