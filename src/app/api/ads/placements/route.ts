export const runtime = 'edge'

/**
 * Ad Placements API Routes
 * 
 * Handles CRUD operations for ad placements within works/sections
 * Provides creator control over ad monetization
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { PrismaClient } from '@prisma/client'
import { 
  AdPlacement, 
  AdPlacementType, 
  AdFormat, 
  AdTargeting,
  AdPosition,
  AdTargetingConfig,
  AdDisplaySettings
} from '@/types/ads'

import { prisma } from '@/lib/database/PrismaService'

// GET /api/ads/placements - Get ad placements for a work/section
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const sectionId = searchParams.get('sectionId')

    if (!workId) {
      return NextResponse.json({ error: 'Work ID required' }, { status: 400 })
    }

    // Verify user owns the work
    const work = await prisma.work.findFirst({
      where: {
        id: workId,
        authorId: session.user.id
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found or unauthorized' }, { status: 404 })
    }

    // Get placements for the work/section
    const placements = await prisma.adPlacement.findMany({
      where: {
        workId,
        ...(sectionId && { sectionId })
      },
      include: {
        performanceMetrics: true
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      placements: placements.map(formatPlacementForClient),
      totalPlacements: placements.length,
      activePlacements: placements.filter((p: any) => p.isActive).length
    })

  } catch (error) {
    console.error('Error fetching ad placements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad placements' },
      { status: 500 }
    )
  }
}

// POST /api/ads/placements - Create new ad placement
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      workId,
      sectionId,
      placementType,
      format,
      position,
      revenueShare,
      targeting,
      displaySettings,
      creatorNotes,
      isActive,
      requiresApproval
    } = body

    // Validate required fields
    if (!workId || !placementType || !format || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user owns the work
    const work = await prisma.work.findFirst({
      where: {
        id: workId,
        authorId: session.user.id
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found or unauthorized' }, { status: 404 })
    }

    // Create ad placement
    const placement = await prisma.adPlacement.create({
      data: {
        workId,
        sectionId: sectionId || null,
        placementType,
        format,
        position: JSON.stringify(position),
        revenueShare: revenueShare || 0.7,
        targeting: JSON.stringify(targeting || getDefaultTargeting()),
        displaySettings: JSON.stringify(displaySettings || getDefaultDisplaySettings()),
        creatorNotes: creatorNotes || '',
        isActive: isActive !== undefined ? isActive : true,
        requiresApproval: requiresApproval || false,
        createdBy: session.user.id
      }
    })

    // Create initial performance metrics
    await prisma.adPlacementMetrics.create({
      data: {
        placementId: placement.id,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cpm: 0,
        cpc: 0,
        conversionRate: 0,
        viewabilityRate: 0,
        completionRate: 0,
        engagementTime: 0,
        dailyMetrics: '{}',
        weeklyMetrics: '{}',
        monthlyMetrics: '{}'
      }
    })

    // Get the created placement with metrics
    const createdPlacement = await prisma.adPlacement.findUnique({
      where: { id: placement.id },
      include: {
        performanceMetrics: true
      }
    })

    return NextResponse.json({
      placement: formatPlacementForClient(createdPlacement!),
      message: 'Ad placement created successfully'
    })

  } catch (error) {
    console.error('Error creating ad placement:', error)
    return NextResponse.json(
      { error: 'Failed to create ad placement' },
      { status: 500 }
    )
  }
}

// Helper function to format placement data for client
function formatPlacementForClient(placement: any): AdPlacement {
  return {
    id: placement.id,
    workId: placement.workId,
    sectionId: placement.sectionId,
    placementType: placement.placementType as AdPlacementType,
    format: placement.format as AdFormat,
    position: JSON.parse(placement.position) as AdPosition,
    revenueShare: placement.revenueShare,
    targeting: JSON.parse(placement.targeting) as AdTargetingConfig,
    displaySettings: JSON.parse(placement.displaySettings) as AdDisplaySettings,
    performanceMetrics: placement.performanceMetrics ? {
      impressions: placement.performanceMetrics.impressions,
      clicks: placement.performanceMetrics.clicks,
      conversions: placement.performanceMetrics.conversions,
      revenue: placement.performanceMetrics.revenue,
      ctr: placement.performanceMetrics.ctr,
      cpm: placement.performanceMetrics.cpm,
      cpc: placement.performanceMetrics.cpc,
      conversionRate: placement.performanceMetrics.conversionRate,
      viewabilityRate: placement.performanceMetrics.viewabilityRate,
      completionRate: placement.performanceMetrics.completionRate,
      engagementTime: placement.performanceMetrics.engagementTime,
      dailyMetrics: JSON.parse(placement.performanceMetrics.dailyMetrics || '{}'),
      weeklyMetrics: JSON.parse(placement.performanceMetrics.weeklyMetrics || '{}'),
      monthlyMetrics: JSON.parse(placement.performanceMetrics.monthlyMetrics || '{}')
    } : getEmptyMetrics(),
    creatorNotes: placement.creatorNotes,
    isActive: placement.isActive,
    requiresApproval: placement.requiresApproval,
    contentFilters: placement.contentFilters ? JSON.parse(placement.contentFilters) : [],
    createdAt: placement.createdAt,
    updatedAt: placement.updatedAt
  }
}

function getDefaultTargeting(): AdTargetingConfig {
  return {
    targetingTypes: [AdTargeting.GENRE_BASED, AdTargeting.CONTEXTUAL],
    genrePreferences: [],
    contentKeywords: [],
    deviceTypes: ['mobile', 'tablet', 'desktop'],
    minimumEngagement: 0.3
  }
}

function getDefaultDisplaySettings(): AdDisplaySettings {
  return {
    fadeIn: true,
    animationDuration: 300,
    maxImpressionsPerSession: 3,
    minimumTimeBetweenAds: 30,
    closeable: true,
    respectDoNotTrack: true
  }
}

function getEmptyMetrics() {
  return {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    ctr: 0,
    cpm: 0,
    cpc: 0,
    conversionRate: 0,
    viewabilityRate: 0,
    completionRate: 0,
    engagementTime: 0,
    dailyMetrics: {},
    weeklyMetrics: {},
    monthlyMetrics: {}
  }
}