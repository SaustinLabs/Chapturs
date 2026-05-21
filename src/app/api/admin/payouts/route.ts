export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { notifyPayoutStatus } from '@/lib/email'

/**
 * GET /api/admin/payouts
 * List all pending payouts (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const statusParam = new URL(request.url).searchParams.get('status')
    const statusList = statusParam
      ? statusParam.split(',').map((s) => s.trim()).filter(Boolean)
      : ['pending', 'processing']

    const payouts = await prisma.payout.findMany({
      where: { status: { in: statusList } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        authorId: true,
        earningsId: true,
        amount: true,
        status: true,
        method: true,
        failureReason: true,
        requestedAt: true,
        processedById: true,
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
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const action = typeof body?.action === 'string' ? body.action : 'complete'
    const authorIds = Array.isArray(body?.authorIds) ? body.authorIds : []
    const method = typeof body?.method === 'string' ? body.method : ''
    const failureReason = typeof body?.failureReason === 'string' ? body.failureReason : undefined
    const transactionId = typeof body?.transactionId === 'string' ? body.transactionId : undefined

    if (authorIds.length === 0) {
      return NextResponse.json(
        { error: 'authorIds (string[]) is required' },
        { status: 400 }
      )
    }

    if (!['approve', 'complete', 'fail'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be one of: approve | complete | fail' },
        { status: 400 }
      )
    }

    if ((action === 'approve' || action === 'complete') && !method) {
      return NextResponse.json(
        { error: 'method is required for approve/complete actions' },
        { status: 400 }
      )
    }

    if (action === 'fail' && !failureReason) {
      return NextResponse.json(
        { error: 'failureReason is required for fail action' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      const approvingRows = await prisma.payout.findMany({
        where: {
          status: 'pending',
          authorId: { in: authorIds }
        },
        select: {
          authorId: true,
          amount: true,
        },
      })

      const approved = await prisma.payout.updateMany({
        where: {
          status: 'pending',
          authorId: { in: authorIds }
        },
        data: {
          status: 'processing',
          method,
          processedById: session.user.id,
        }
      })

      if (approvingRows.length > 0) {
        const totalsByAuthor = new Map<string, number>()
        for (const row of approvingRows) {
          totalsByAuthor.set(row.authorId, (totalsByAuthor.get(row.authorId) || 0) + Number(row.amount || 0))
        }

        const authors = await prisma.author.findMany({
          where: { id: { in: Array.from(totalsByAuthor.keys()) } },
          select: {
            id: true,
            user: {
              select: {
                email: true,
                displayName: true,
                username: true,
              },
            },
          },
        })

        for (const author of authors) {
          const email = author.user.email
          if (!email) continue
          notifyPayoutStatus({
            creatorEmail: email,
            creatorName: author.user.displayName || author.user.username || 'Creator',
            amount: Number((totalsByAuthor.get(author.id) || 0).toFixed(2)),
            status: 'approved',
            method,
          }).catch(() => {})
        }
      }

      return NextResponse.json({
        success: true,
        action,
        processed: approved.count,
      })
    }

    if (action === 'fail') {
      const failingRows = await prisma.payout.findMany({
        where: {
          status: { in: ['pending', 'processing'] },
          authorId: { in: authorIds }
        },
        select: {
          authorId: true,
          amount: true,
        },
      })

      const failed = await prisma.payout.updateMany({
        where: {
          status: { in: ['pending', 'processing'] },
          authorId: { in: authorIds }
        },
        data: {
          status: 'failed',
          failureReason,
          processedAt: new Date(),
          processedById: session.user.id,
        }
      })

      if (failingRows.length > 0) {
        const totalsByAuthor = new Map<string, number>()
        for (const row of failingRows) {
          totalsByAuthor.set(row.authorId, (totalsByAuthor.get(row.authorId) || 0) + Number(row.amount || 0))
        }

        const authors = await prisma.author.findMany({
          where: { id: { in: Array.from(totalsByAuthor.keys()) } },
          select: {
            id: true,
            user: {
              select: {
                email: true,
                displayName: true,
                username: true,
              },
            },
          },
        })

        for (const author of authors) {
          const email = author.user.email
          if (!email) continue
          notifyPayoutStatus({
            creatorEmail: email,
            creatorName: author.user.displayName || author.user.username || 'Creator',
            amount: Number((totalsByAuthor.get(author.id) || 0).toFixed(2)),
            status: 'failed',
            method,
            reason: failureReason,
          }).catch(() => {})
        }
      }

      return NextResponse.json({
        success: true,
        action,
        processed: failed.count,
      })
    }

    const pendingPayouts = await prisma.payout.findMany({
      where: {
        status: { in: ['pending', 'processing'] },
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
          status: { in: ['pending', 'processing'] },
          authorId: { in: authorIds }
        },
        data: {
          status: 'completed',
          processedAt,
          method,
          transactionId,
          processedById: session.user.id,
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

    const authors = await prisma.author.findMany({
      where: { id: { in: Array.from(totalsByAuthor.keys()) } },
      select: {
        id: true,
        user: {
          select: {
            email: true,
            displayName: true,
            username: true,
          },
        },
      },
    })

    for (const author of authors) {
      const email = author.user.email
      if (!email) continue
      notifyPayoutStatus({
        creatorEmail: email,
        creatorName: author.user.displayName || author.user.username || 'Creator',
        amount: Number((totalsByAuthor.get(author.id) || 0).toFixed(2)),
        status: 'completed',
        method,
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      action,
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
