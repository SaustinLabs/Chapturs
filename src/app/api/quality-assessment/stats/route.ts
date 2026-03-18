export const runtime = 'nodejs'

// ============================================================================
// QUALITY ASSESSMENT STATS API
// ============================================================================

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

/**
 * GET /api/quality-assessment/stats
 * Get quality assessment statistics (for admin dashboards)
 */
export async function GET() {
  try {
    const [queueStats, assessmentStats, costStats] = await Promise.all([
      // Queue statistics
      prisma.qualityAssessmentQueue.groupBy({
        by: ['status'],
        _count: true,
      }),
      
      // Assessment tier distribution
      prisma.qualityAssessment.groupBy({
        by: ['qualityTier'],
        _count: true,
      }),
      
      // LLM usage costs
      prisma.lLMUsageLog.aggregate({
        _sum: {
          estimatedCost: true,
        },
        _count: true,
      }),
    ])

    const queueCounts = queueStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count
      return acc
    }, {} as Record<string, number>)

    const tierCounts = assessmentStats.reduce((acc, stat) => {
      acc[stat.qualityTier] = stat._count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      queue: {
        pending: queueCounts.pending || 0,
        processing: queueCounts.processing || 0,
        completed: queueCounts.completed || 0,
        failed: queueCounts.failed || 0,
      },
      assessments: {
        total: assessmentStats.reduce((sum, stat) => sum + stat._count, 0),
        byTier: tierCounts,
      },
      costs: {
        totalCost: costStats._sum.estimatedCost || 0,
        totalCalls: costStats._count || 0,
      },
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

