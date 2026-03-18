export const runtime = 'nodejs'

/**
 * Creator Recommendations API
 * 
 * Handles creator-to-creator story recommendations and cross-promotion
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { PrismaClient } from '@prisma/client'
import { 
  CreatorRecommendationAd,
  RecommendationTemplate 
} from '@/types/creator-ads'

import { prisma } from '@/lib/database/PrismaService'

// GET /api/creator-ads/recommendations - Get creator's recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'created' or 'received'

    let recommendations
    
    if (type === 'received') {
      // Recommendations made about this user's works
      recommendations = await prisma.creatorRecommendation.findMany({
        where: {
          recommendedAuthorId: session.user.id
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          recommendedWork: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Recommendations created by this user
      recommendations = await prisma.creatorRecommendation.findMany({
        where: {
          creatorId: session.user.id
        },
        include: {
          recommendedWork: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              status: true
            }
          },
          recommendedAuthor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({
      recommendations: recommendations.map(formatRecommendationForClient),
      total: recommendations.length
    })

  } catch (error) {
    console.error('Error fetching creator recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

// POST /api/creator-ads/recommendations - Create new creator recommendation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      recommendedWorkId,
      recommendedAuthorId,
      template,
      customMessage,
      similarityReason,
      personalRating,
      placementTargets,
      displaySettings
    } = body

    // Validate required fields
    if (!recommendedWorkId || !recommendedAuthorId || !template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the recommended work exists and user doesn't own it
    const recommendedWork = await prisma.work.findUnique({
      where: { id: recommendedWorkId },
      include: {
        author: true
      }
    })

    if (!recommendedWork) {
      return NextResponse.json({ error: 'Recommended work not found' }, { status: 404 })
    }

    if (recommendedWork.authorId === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot recommend your own work' 
      }, { status: 400 })
    }

    // Check if user already has a recommendation for this work
    const existingRecommendation = await prisma.creatorRecommendation.findFirst({
      where: {
        creatorId: session.user.id,
        recommendedWorkId,
        isActive: true
      }
    })

    if (existingRecommendation) {
      return NextResponse.json({ 
        error: 'You already have an active recommendation for this work' 
      }, { status: 400 })
    }

    // Create the recommendation
    const recommendation = await prisma.creatorRecommendation.create({
      data: {
        creatorId: session.user.id,
        recommendedWorkId,
        recommendedAuthorId,
        template,
        customMessage: customMessage || null,
        similarityReason: similarityReason || null,
        personalRating: personalRating || 5,
        placementTargets: JSON.stringify(placementTargets || []),
        displaySettings: JSON.stringify(displaySettings || getDefaultDisplaySettings()),
        isActive: true,
        approvedByRecommendee: false // May require approval in the future
      },
      include: {
        recommendedWork: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            status: true
          }
        },
        recommendedAuthor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      recommendation: formatRecommendationForClient(recommendation),
      message: 'Creator recommendation created successfully'
    })

  } catch (error) {
    console.error('Error creating creator recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    )
  }
}

// Helper function to format recommendation for client
function formatRecommendationForClient(recommendation: any): CreatorRecommendationAd {
  return {
    id: recommendation.id,
    creatorId: recommendation.creatorId,
    recommendedWorkId: recommendation.recommendedWorkId,
    recommendedAuthorId: recommendation.recommendedAuthorId,
    template: recommendation.template as RecommendationTemplate,
    customMessage: recommendation.customMessage,
    similarityReason: recommendation.similarityReason,
    personalRating: recommendation.personalRating,
    placementTargets: JSON.parse(recommendation.placementTargets || '[]'),
    displaySettings: JSON.parse(recommendation.displaySettings || '{}'),
    impressions: recommendation.impressions,
    clicks: recommendation.clicks,
    conversions: recommendation.conversions,
    revenue: recommendation.revenue,
    isActive: recommendation.isActive,
    approvedByRecommendee: recommendation.approvedByRecommendee,
    createdAt: recommendation.createdAt,
    updatedAt: recommendation.updatedAt
  }
}

function getDefaultDisplaySettings() {
  return {
    showCreatorAvatar: true,
    showPersonalMessage: true,
    showSimilarityScore: false,
    showRating: true,
    animateEntrance: true,
    revenueShareWithRecommendee: 0.2,
    preferredFormats: ['NATIVE', 'BANNER'],
    preferredPlacements: ['SIDEBAR_RIGHT', 'CHAPTER_END'],
    maxImpressionsPerReader: 3,
    cooldownBetweenShows: 24
  }
}