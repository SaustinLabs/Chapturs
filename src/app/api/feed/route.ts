export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  checkRateLimit,
  addCorsHeaders,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'
import { z } from 'zod'
import IntelligentRecommendationEngine from '@/lib/recommendations/IntelligentRecommendationEngine'

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
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`feed_${clientId}`, 50, 60000) // 50 requests per minute

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
        feedItems = await getFallbackFeed(limit, offset)
      }
    } else {
      // Guest user - show popular/trending content
      feedItems = await getFallbackFeed(limit, offset)
    }

    // If we didn't get enough items, supplement with generic content
    if (feedItems.length < limit) {
      const supplemental = await getFallbackFeed(limit - feedItems.length, offset + feedItems.length)
      feedItems.push(...supplemental)
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

    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

// Fallback feed for guest users or when personalization fails
async function getFallbackFeed(limit: number, offset: number) {
  const works = await prisma.work.findMany({
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

  return works.map((work: any) => ({
    id: `${work.id}-feed`,
    work: {
      id: work.id,
      title: work.title,
      description: work.description,
      formatType: work.formatType,
      coverImage: work.coverImage,
      status: work.status,
      maturityRating: work.maturityRating,
      genres: JSON.parse(work.genres || '[]'),
      tags: JSON.parse(work.tags || '[]'),
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
        ...JSON.parse(work.statistics || '{}')
      },
      createdAt: work.createdAt,
      updatedAt: work.updatedAt
    },
    feedType: 'discovery' as const,
    reason: 'Popular content',
    score: Math.random(),
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
