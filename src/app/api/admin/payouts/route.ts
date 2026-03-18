export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

/**
 * GET /api/admin/payouts
 * List all pending payouts (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payouts = await prisma.payout.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        authorId: true,
        earningsId: true,
        amount: true,
        status: true,
        method: true,
        processedAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                username: true,
                displayName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, payouts })
  } catch (error: any) {
    console.error('[GET /api/admin/payouts] Error:', error?.message || error)
    return NextResponse.json(
      {
        error: 'Failed to fetch payouts',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/payouts
 * Process payouts (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const authorIds = Array.isArray(body?.authorIds) ? body.authorIds : []
    const method = typeof body?.method === 'string' ? body.method : ''

    if (authorIds.length === 0 || !method) {
      return NextResponse.json(
        { error: 'authorIds (string[]) and method are required' },
        { status: 400 }
      )
    }

    const pendingPayouts = await prisma.payout.findMany({
      where: {
        status: 'pending',
        authorId: { in: authorIds }
      },
      select: {
        id: true,
        authorId: true,
        amount: true
      }
    })

    if (pendingPayouts.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        totalAmount: 0
      })
    }

    const totalsByAuthor = new Map<string, number>()
    for (const payout of pendingPayouts) {
      totalsByAuthor.set(
        payout.authorId,
        (totalsByAuthor.get(payout.authorId) || 0) + Number(payout.amount || 0)
      )
    }

    const processedAt = new Date()

    await prisma.$transaction(async (tx) => {
      await tx.payout.updateMany({
        where: {
          status: 'pending',
          authorId: { in: authorIds }
        },
        data: {
          status: 'completed',
          processedAt,
          method
        }
      })

      for (const [authorId, amount] of totalsByAuthor) {
        await tx.authorEarnings.update({
          where: { authorId },
          data: {
            pendingPayout: { decrement: amount },
            lifetimePayout: { increment: amount }
          }
        })
      }
    })

    const totalAmount = Array.from(totalsByAuthor.values()).reduce((sum, amount) => sum + amount, 0)

    return NextResponse.json({
      success: true,
      processed: pendingPayouts.length,
      totalAmount: Number(totalAmount.toFixed(2))
    })
  } catch (error: any) {
    console.error('[POST /api/admin/payouts] Error:', error?.message || error)
    return NextResponse.json(
      {
        error: 'Failed to process payouts',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
