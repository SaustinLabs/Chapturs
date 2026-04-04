export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'
import { rateLimit } from '@/lib/rate-limit'

// Track ad impressions for revenue calculation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Rate limit: max 100 impressions per hour per user
    const identifier = session?.user?.id || request.ip || 'anonymous'
    const { success } = await rateLimit(identifier, 'ad_impression', 100, 3600)
    
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json()
    const { type, authorId, workId, placement, chapterId } = body

    if (!type || !authorId || !workId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, authorId, workId' },
        { status: 400 }
      )
    }

    // Verify the author exists before writing (avoids FK violation)
    const author = await prisma.author.findUnique({ where: { id: authorId }, select: { id: true } })
    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    await prisma.adImpression.create({
      data: {
        userId:    session?.user?.id ?? null,
        authorId,
        workId,
        sectionId: chapterId ?? null,
        placement: placement ?? 'inline',
        adType:    type,
        revenue:   0, // updated later by revenue reconciliation job
        clicked:   false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ad impression error:', error)
    return NextResponse.json(
      { error: 'Failed to record impression' },
      { status: 500 }
    )
  }
}
