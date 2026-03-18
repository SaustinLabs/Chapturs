export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

function buildMonthKeys(count: number) {
  const keys: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    keys.push(key)
  }
  return keys
}

/**
 * GET /api/admin/ad-revenue
 * Admin ad revenue dashboard stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      totalImpressionsAllTime,
      totalImpressionsLast30Days,
      totalClicksAllTime,
      totalClicksLast30Days,
      totalRevenueAllTime,
      totalRevenueLast30Days,
      topEarningAuthors,
      recentImpressions
    ] = await Promise.all([
      prisma.adImpression.count(),
      prisma.adImpression.count({
        where: { createdAt: { gte: last30Days } }
      }),
      prisma.adImpression.count({
        where: { clicked: true }
      }),
      prisma.adImpression.count({
        where: { clicked: true, createdAt: { gte: last30Days } }
      }),
      prisma.adImpression.aggregate({
        _sum: { revenue: true }
      }),
      prisma.adImpression.aggregate({
        where: { createdAt: { gte: last30Days } },
        _sum: { revenue: true }
      }),
      prisma.authorEarnings.findMany({
        orderBy: { totalRevenue: 'desc' },
        take: 10,
        select: {
          totalRevenue: true,
          author: {
            select: {
              user: {
                select: {
                  username: true,
                  displayName: true
                }
              }
            }
          }
        }
      }),
      prisma.adImpression.findMany({
        where: { createdAt: { gte: sixMonthsStart } },
        select: { createdAt: true, revenue: true }
      })
    ])

    const monthKeys = buildMonthKeys(6)
    const monthlyRevenueMap = new Map<string, number>()
    for (const key of monthKeys) {
      monthlyRevenueMap.set(key, 0)
    }

    for (const impression of recentImpressions) {
      const monthKey = `${impression.createdAt.getFullYear()}-${String(impression.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (monthlyRevenueMap.has(monthKey)) {
        monthlyRevenueMap.set(monthKey, (monthlyRevenueMap.get(monthKey) || 0) + Number(impression.revenue || 0))
      }
    }

    const monthlyRevenue = monthKeys.map((key) => ({
      month: key,
      revenue: Number((monthlyRevenueMap.get(key) || 0).toFixed(2))
    }))

    return NextResponse.json({
      success: true,
      totals: {
        impressions: {
          allTime: totalImpressionsAllTime,
          last30Days: totalImpressionsLast30Days
        },
        clicks: {
          allTime: totalClicksAllTime,
          last30Days: totalClicksLast30Days
        },
        revenue: {
          allTime: Number((totalRevenueAllTime._sum.revenue || 0).toFixed(2)),
          last30Days: Number((totalRevenueLast30Days._sum.revenue || 0).toFixed(2))
        }
      },
      topAuthors: topEarningAuthors.map((entry) => ({
        username: entry.author?.user?.username || null,
        displayName: entry.author?.user?.displayName || null,
        totalRevenue: Number((entry.totalRevenue || 0).toFixed(2))
      })),
      monthlyRevenue
    })
  } catch (error: any) {
    console.error('[GET /api/admin/ad-revenue] Error:', error?.message || error)
    return NextResponse.json(
      {
        error: 'Failed to fetch ad revenue stats',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
