export const runtime = 'nodejs'

// ============================================================================
// QUALITY ASSESSMENT QUEUE PROCESSOR
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { processNextInQueue, BudgetExceededError } from '@/lib/quality-assessment/assessment-service'

/**
 * POST /api/quality-assessment/process
 * Manually trigger queue processing (for background workers or admin)
 * Requires Authorization: Bearer <QA_PROCESSOR_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.QA_PROCESSOR_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { count = 1 } = await request.json().catch(() => ({}))

    const results = []
    for (let i = 0; i < Math.min(count, 10); i++) {
      const result = await processNextInQueue()
      if (!result) break // No more items in queue
      results.push(result)
    }

    return NextResponse.json({
      processed: results.length,
      results
    })
  } catch (error) {
    if (error instanceof BudgetExceededError) {
      return NextResponse.json(
        {
          error: 'Budget cap reached',
          scope: error.scope,
          limitUsd: error.limitUsd,
          spentUsd: error.spentUsd,
        },
        { status: 429 }
      )
    }

    console.error('Queue processing error:', error)
    return NextResponse.json({ error: 'Failed to process queue' }, { status: 500 })
  }
}
