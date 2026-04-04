export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

/**
 * GET /api/creator/earnings
 * Returns the author's earnings summary + payout history.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      earnings: {
        select: {
          totalRevenue: true,
          premiumRevenue: true,
          pendingPayout: true,
          lifetimePayout: true,
          totalImpressions: true,
          totalClicks: true,
          lastCalculatedAt: true,
        },
      },
      payouts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          transactionId: true,
          processedAt: true,
          createdAt: true,
        },
      },
    },
  })

  if (!author) {
    return NextResponse.json({ error: 'Author not found' }, { status: 404 })
  }

  // Monthly earnings from ad impressions (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const monthlyImpressions = await prisma.adImpression.groupBy({
    by: ['createdAt'],
    where: {
      authorId: author.id,
      createdAt: { gte: sixMonthsAgo },
    },
    _sum: { revenue: true },
  })

  // Aggregate by month label (YYYY-MM)
  const byMonth: Record<string, number> = {}
  for (const row of monthlyImpressions) {
    const month = row.createdAt.toISOString().slice(0, 7)
    byMonth[month] = (byMonth[month] || 0) + (row._sum.revenue || 0)
  }

  const monthlyEarnings = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue: parseFloat(revenue.toFixed(2)) }))

  return NextResponse.json({
    earnings: author.earnings ?? {
      totalRevenue: 0,
      premiumRevenue: 0,
      pendingPayout: 0,
      lifetimePayout: 0,
      totalImpressions: 0,
      totalClicks: 0,
      lastCalculatedAt: null,
    },
    payouts: author.payouts,
    monthlyEarnings,
    revenueShare: 0.7,
    minimumPayout: 10,
  })
}
