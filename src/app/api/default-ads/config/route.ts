export const runtime = 'edge'

/**
 * Default Ad Configuration API
 * 
 * Manages default ad settings for works without custom placements
 * Ensures ALL content has ads as per business requirement
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'

// GET /api/default-ads/config - Get default ad configuration for a work
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')

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

    // Get existing config or create default
    let config = await prisma.defaultAdConfig.findUnique({
      where: { workId }
    })

    if (!config) {
      // Create default configuration
      config = await prisma.defaultAdConfig.create({
        data: {
          workId,
          hasCustomPlacements: false,
          defaultSidebarRight: true,    // Non-intrusive default
          defaultSidebarLeft: false,
          defaultChapterEnd: true,      // Natural break point
          defaultBetweenChapters: false,
          platformRevenueShare: 0.3,    // 30% platform
          creatorRevenueShare: 0.7,     // 70% creator
          allowExternalAds: true,
          allowCreatorRecs: true,
          allowPlatformAds: true,
          maxAdsPerSession: 5,
          minTimeBetweenAds: 30
        }
      })
    }

    return NextResponse.json({
      config: formatConfigForClient(config)
    })

  } catch (error) {
    console.error('Error fetching default ad config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// POST /api/default-ads/config - Update default ad configuration
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      workId,
      defaultPlacements,
      allowExternalAds,
      allowCreatorRecommendations,
      allowPlatformAds
    } = body

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

    // Check if work has custom ad placements
    const customPlacements = await prisma.adPlacement.count({
      where: {
        workId,
        isActive: true
      }
    })

    // Update or create configuration
    const config = await prisma.defaultAdConfig.upsert({
      where: { workId },
      update: {
        hasCustomPlacements: customPlacements > 0,
        defaultSidebarRight: defaultPlacements?.sidebarRight ?? true,
        defaultSidebarLeft: defaultPlacements?.sidebarLeft ?? false,
        defaultChapterEnd: defaultPlacements?.chapterEnd ?? true,
        defaultBetweenChapters: defaultPlacements?.betweenChapters ?? false,
        allowExternalAds: allowExternalAds ?? true,
        allowCreatorRecs: allowCreatorRecommendations ?? true,
        allowPlatformAds: allowPlatformAds ?? true,
        updatedAt: new Date()
      },
      create: {
        workId,
        hasCustomPlacements: customPlacements > 0,
        defaultSidebarRight: defaultPlacements?.sidebarRight ?? true,
        defaultSidebarLeft: defaultPlacements?.sidebarLeft ?? false,
        defaultChapterEnd: defaultPlacements?.chapterEnd ?? true,
        defaultBetweenChapters: defaultPlacements?.betweenChapters ?? false,
        platformRevenueShare: 0.3,
        creatorRevenueShare: 0.7,
        allowExternalAds: allowExternalAds ?? true,
        allowCreatorRecs: allowCreatorRecommendations ?? true,
        allowPlatformAds: allowPlatformAds ?? true,
        maxAdsPerSession: 5,
        minTimeBetweenAds: 30
      }
    })

    return NextResponse.json({
      config: formatConfigForClient(config),
      message: 'Configuration updated successfully'
    })

  } catch (error) {
    console.error('Error updating default ad config:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

// GET /api/default-ads/config/all - Get all works that need default ad configurations
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user's works
    const works = await prisma.work.findMany({
      where: {
        authorId: session.user.id
      },
      select: {
        id: true,
        title: true,
        status: true
      }
    })

    // Check which works have custom placements vs default configs
    const workConfigs = await Promise.all(works.map(async (work: any) => {
      const customPlacements = await prisma.adPlacement.count({
        where: {
          workId: work.id,
          isActive: true
        }
      })

      const defaultConfig = await prisma.defaultAdConfig.findUnique({
        where: { workId: work.id }
      })

      return {
        work,
        hasCustomPlacements: customPlacements > 0,
        hasDefaultConfig: !!defaultConfig,
        needsSetup: !customPlacements && !defaultConfig
      }
    }))

    return NextResponse.json({
      works: workConfigs,
      total: works.length,
      needingSetup: workConfigs.filter(w => w.needsSetup).length
    })

  } catch (error) {
    console.error('Error fetching work configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work configurations' },
      { status: 500 }
    )
  }
}

// Helper function to format config for client
function formatConfigForClient(config: any): any {
  return {
    workId: config.workId,
    hasCustomPlacements: config.hasCustomPlacements,
    defaultPlacements: {
      sidebarRight: config.defaultSidebarRight,
      sidebarLeft: config.defaultSidebarLeft,
      chapterEnd: config.defaultChapterEnd,
      betweenChapters: config.defaultBetweenChapters
    },
    platformRevenueShare: config.platformRevenueShare,
    creatorRevenueShare: config.creatorRevenueShare,
    allowExternalAds: config.allowExternalAds,
    allowCreatorRecommendations: config.allowCreatorRecs,
    allowPlatformAds: config.allowPlatformAds,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt
  }
}