export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import DatabaseService from '@/lib/database/PrismaService'
import { prisma } from '@/lib/database/PrismaService'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  requireAuth,
  validateRequest,
  checkRateLimit,
  addCorsHeaders,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'
import { toggleSubscriptionSchema, updateSubscriptionPreferencesSchema } from '@/lib/api/schemas'

// use shared prisma instance from PrismaService

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`subscription_${clientId}`, 20, 60000) // 20 per minute

    // Authentication
    const session = await auth()
    requireAuth(session)

    // Validation
    const validatedData = await validateRequest(request, toggleSubscriptionSchema)
    const { authorId } = validatedData

    // Check if author exists
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: { user: true }
    })
    
    if (!author) {
      throw new ApiError(
        'Author not found',
        404,
        ApiErrorType.NOT_FOUND_ERROR,
        { authorId }
      )
    }

    // Prevent self-subscription
    if (author.userId === session.user.id) {
      throw new ApiError(
        'Cannot subscribe to yourself',
        400,
        ApiErrorType.VALIDATION_ERROR
      )
    }

    // Toggle subscription
    const isSubscribed = await DatabaseService.toggleSubscription(authorId, session.user.id)
    
    const response = createSuccessResponse({
      subscribed: isSubscribed,
      authorId,
      authorName: author.user.displayName || author.user.username
    }, isSubscribed ? 'Subscribed successfully' : 'Unsubscribed successfully', requestId)
    
    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`subscription_check_${clientId}`, 100, 60000) // 100 per minute for GET

    // Authentication
    const session = await auth()
    requireAuth(session)

    // Validation
    const { searchParams } = new URL(request.url)
    const authorId = searchParams.get('authorId')

    if (!authorId) {
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: session.user.id },
        orderBy: { subscribedAt: 'desc' },
        include: {
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                }
              },
              works: {
                where: {
                  NOT: { status: 'draft' }
                },
                orderBy: { updatedAt: 'desc' },
                include: {
                  sections: {
                    where: { status: 'published' },
                    orderBy: { orderIndex: 'asc' },
                    select: {
                      id: true,
                      title: true,
                      chapterNumber: true,
                      publishedAt: true,
                      wordCount: true,
                    }
                  }
                }
              }
            }
          }
        }
      })

      const items = subscriptions.flatMap((subscription) => {
        return subscription.author.works.map((work) => {
          let genres: string[] = []
          let tags: string[] = []
          let statistics: Record<string, any> = {}

          try {
            genres = JSON.parse(work.genres || '[]')
          } catch {
            genres = []
          }

          try {
            tags = JSON.parse(work.tags || '[]')
          } catch {
            tags = []
          }

          try {
            statistics = JSON.parse(work.statistics || '{}')
          } catch {
            statistics = {}
          }

          const chapterCount = work.sections.length
          const firstSectionId = work.sections[0]?.id || null

          return {
            id: `${subscription.id}:${work.id}`,
            subscriptionId: subscription.id,
            subscribedAt: subscription.subscribedAt,
            notificationsEnabled: subscription.notificationsEnabled,
            author: {
              id: subscription.author.id,
              username: subscription.author.user.username,
              displayName: subscription.author.user.displayName,
              avatar: subscription.author.user.avatar,
            },
            story: {
              id: work.id,
              title: work.title,
              description: work.description,
              coverImage: work.coverImage,
              status: work.status,
              updatedAt: work.updatedAt,
              genres,
              tags,
              chapterCount,
              firstSectionId,
              statistics: {
                views: statistics.views || work.viewCount || 0,
                subscribers: statistics.subscribers || 0,
                averageRating: statistics.averageRating || 0,
                ratingCount: statistics.ratingCount || 0,
              }
            }
          }
        })
      })

      const response = createSuccessResponse({
        items,
        total: items.length,
      }, undefined, requestId)

      return addCorsHeaders(response)
    }

    // Check if author exists
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: { user: true }
    })
    
    if (!author) {
      throw new ApiError(
        'Author not found',
        404,
        ApiErrorType.NOT_FOUND_ERROR,
        { authorId }
      )
    }

    // Check subscription status
    const isSubscribed = await DatabaseService.checkUserSubscription(session.user.id, authorId)
    
    const response = createSuccessResponse({
      subscribed: isSubscribed,
      authorId,
      authorName: author.user.displayName || author.user.username
    }, undefined, requestId)
    
    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`subscription_update_${clientId}`, 40, 60000)

    const session = await auth()
    requireAuth(session)

    const validatedData = await validateRequest(request, updateSubscriptionPreferencesSchema)
    const { authorId, notificationsEnabled } = validatedData

    const updated = await prisma.subscription.updateMany({
      where: {
        userId: session.user.id,
        authorId,
      },
      data: {
        notificationsEnabled,
      }
    })

    if (updated.count === 0) {
      throw new ApiError(
        'Subscription not found',
        404,
        ApiErrorType.NOT_FOUND_ERROR,
        { authorId }
      )
    }

    const response = createSuccessResponse({
      authorId,
      notificationsEnabled,
    }, 'Subscription preferences updated', requestId)

    return addCorsHeaders(response)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
