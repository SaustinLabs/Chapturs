export const runtime = 'nodejs'

// ============================================================================
// QUALITY ASSESSMENT QUEUE API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { queueForAssessment } from '@/lib/quality-assessment/assessment-service'

/**
 * POST /api/quality-assessment/queue
 * Add a work to the quality assessment queue
 * Requires Authorization: Bearer <QA_PROCESSOR_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.QA_PROCESSOR_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { workId, sectionId, priority } = body

    if (!workId || !sectionId) {
      return NextResponse.json(
        { error: 'workId and sectionId are required' },
        { status: 400 }
      )
    }

    const queueItem = await queueForAssessment({
      workId,
      sectionId,
      content: '', // Will be fetched by processor
      metadata: {
        title: '',
        genres: [],
        tags: [],
        formatType: '',
        maturityRating: '',
      },
      priority: priority || 'normal',
    })

    return NextResponse.json({
      success: true,
      queueItem,
    })
  } catch (error) {
    console.error('Queue error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to queue assessment' },
      { status: 500 }
    )
  }
}
