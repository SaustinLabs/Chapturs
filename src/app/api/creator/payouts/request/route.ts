export const runtime = 'nodejs'

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { getCreatorPayoutsEnabled } from '@/lib/settings'

const MINIMUM_PAYOUT = 10

/**
 * POST /api/creator/payouts/request
 * Creates a payout request from the creator's currently pending earnings.
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payoutsEnabled = await getCreatorPayoutsEnabled()
  if (!payoutsEnabled) {
    return NextResponse.json(
      { error: 'Creator payouts are not enabled yet' },
      { status: 503 }
    )
  }

  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      earnings: {
        select: {
          id: true,
          pendingPayout: true,
        },
      },
    },
  })

  if (!author?.earnings) {
    return NextResponse.json({ error: 'Author earnings not found' }, { status: 404 })
  }

  const pendingAmount = Number(author.earnings.pendingPayout || 0)
  if (pendingAmount < MINIMUM_PAYOUT) {
    return NextResponse.json(
      {
        error: `Minimum payout is $${MINIMUM_PAYOUT.toFixed(2)}`,
        pendingAmount,
        minimumPayout: MINIMUM_PAYOUT,
      },
      { status: 400 }
    )
  }

  const existingPending = await prisma.payout.findFirst({
    where: {
      authorId: author.id,
      earningsId: author.earnings.id,
      status: { in: ['pending', 'processing'] },
    },
    select: { id: true, amount: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  if (existingPending) {
    return NextResponse.json(
      {
        success: true,
        alreadyRequested: true,
        payout: existingPending,
      },
      { status: 200 }
    )
  }

  const payout = await prisma.payout.create({
    data: {
      authorId: author.id,
      earningsId: author.earnings.id,
      amount: pendingAmount,
      status: 'pending',
      method: null,
      requestedById: session.user.id,
      requestedAt: new Date(),
      idempotencyKey: crypto.randomUUID(),
    },
    select: {
      id: true,
      amount: true,
      status: true,
      method: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ success: true, payout })
}
