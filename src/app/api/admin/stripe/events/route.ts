export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

/**
 * GET /api/admin/stripe/events
 * Query recent Stripe webhook events for operations visibility (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const eventType = searchParams.get('eventType')
    const limitParam = Number(searchParams.get('limit') || 50)
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam)) : 50

    const where: any = {}
    if (status) where.status = status
    if (eventType) where.eventType = eventType

    const events = await prisma.stripeEventLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventId: true,
        eventType: true,
        status: true,
        errorMessage: true,
        processedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, count: events.length, events })
  } catch (error: any) {
    console.error('[GET /api/admin/stripe/events] Error:', error?.message || error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Stripe event logs',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
