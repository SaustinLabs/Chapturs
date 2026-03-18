export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dealId } = await params
    const body = await request.json()
    const { action, rejectionReason } = body

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get deal
    const deal = await prisma.tier3Deal.findUnique({
      where: { id: dealId },
      include: {
        creator: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Verify user is the creator
    if (deal.creator.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the creator can approve or reject deals' },
        { status: 403 }
      )
    }

    // Update deal
    const updatedDeal = await prisma.tier3Deal.update({
      where: { id: dealId },
      data: {
        status: action === 'approve' ? 'active' : 'rejected',
        ...(action === 'approve' && { acceptedAt: new Date() }),
        ...(action === 'reject' && { rejectionReason }),
      },
    })

    return NextResponse.json({
      success: true,
      deal: {
        id: updatedDeal.id,
        status: updatedDeal.status,
        acceptedAt: updatedDeal.acceptedAt,
        rejectionReason: updatedDeal.rejectionReason,
      },
    })
  } catch (error) {
    console.error('Failed to update deal:', error)
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}
