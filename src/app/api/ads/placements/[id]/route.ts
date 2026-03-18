export const runtime = 'edge'

/**
 * Individual Ad Placement Management API
 * 
 * Handles PATCH/DELETE operations for specific ad placements
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { 
  AdPlacement, 
  AdPlacementType, 
  AdFormat,
  AdTargetingConfig,
  AdDisplaySettings,
  AdContentFilter
} from '@/types/ads'

// using shared prisma from PrismaService

// PATCH /api/ads/placements/[id] - Update ad placement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: placementId } = await params
    const updates = await request.json()

    const existingPlacement = await prisma.adPlacement.findFirst({
      where: {
        id: placementId,
        createdBy: session.user.id
      },
      include: {
        work: true
      }
    })

    if (!existingPlacement) {
      return NextResponse.json({ 
        error: 'Placement not found or unauthorized' 
      }, { status: 404 })
    }

    // Update the placement
    const updatedPlacement = await prisma.adPlacement.update({
      where: { id: placementId },
      data: {
        ...(updates.placementType && { placementType: updates.placementType }),
        ...(updates.format && { format: updates.format }),
        ...(updates.position && { position: JSON.stringify(updates.position) }),
        ...(updates.revenueShare !== undefined && { revenueShare: updates.revenueShare }),
        ...(updates.targeting && { targeting: JSON.stringify(updates.targeting) }),
        ...(updates.displaySettings && { displaySettings: JSON.stringify(updates.displaySettings) }),
        ...(updates.contentFilters && { contentFilters: JSON.stringify(updates.contentFilters) }),
        ...(updates.creatorNotes !== undefined && { creatorNotes: updates.creatorNotes }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.requiresApproval !== undefined && { requiresApproval: updates.requiresApproval }),
        updatedAt: new Date()
      },
      include: {
        performanceMetrics: true
      }
    })

    return NextResponse.json({
      placement: formatPlacementForClient(updatedPlacement),
      message: 'Ad placement updated successfully'
    })

  } catch (error) {
    console.error('Error updating ad placement:', error)
    return NextResponse.json(
      { error: 'Failed to update ad placement' },
      { status: 500 }
    )
  }
}

// DELETE /api/ads/placements/[id] - Delete ad placement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: placementId } = await params

    // Verify user owns the placement
    const existingPlacement = await prisma.adPlacement.findFirst({
      where: {
        id: placementId,
        createdBy: session.user.id
      }
    })

    if (!existingPlacement) {
      return NextResponse.json({ 
        error: 'Placement not found or unauthorized' 
      }, { status: 404 })
    }

    // Delete the placement (metrics will cascade delete)
    await prisma.adPlacement.delete({
      where: { id: placementId }
    })

    return NextResponse.json({
      message: 'Ad placement deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting ad placement:', error)
    return NextResponse.json(
      { error: 'Failed to delete ad placement' },
      { status: 500 }
    )
  }
}

// GET /api/ads/placements/[id] - Get single ad placement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: placementId } = await params

    // Get the placement with metrics
    const placement = await prisma.adPlacement.findFirst({
      where: {
        id: placementId,
        createdBy: session.user.id
      },
      include: {
        performanceMetrics: true,
        work: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    if (!placement) {
      return NextResponse.json({ 
        error: 'Placement not found or unauthorized' 
      }, { status: 404 })
    }

    return NextResponse.json({
      placement: formatPlacementForClient(placement)
    })

  } catch (error) {
    console.error('Error fetching ad placement:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad placement' },
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
    position: JSON.parse(placement.position),
    revenueShare: placement.revenueShare,
    targeting: JSON.parse(placement.targeting),
    displaySettings: JSON.parse(placement.displaySettings),
    contentFilters: JSON.parse(placement.contentFilters || '[]'),
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
    createdAt: placement.createdAt,
    updatedAt: placement.updatedAt
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