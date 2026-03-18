export const runtime = 'edge'

// ============================================================================
// QUALITY ASSESSMENT QUEUE PROCESSOR
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { processNextInQueue } from '@/lib/quality-assessment/assessment-service'

/**
 * POST /api/quality-assessment/process
 * Manually trigger queue processing (for background workers or admin)
 */
export async function POST(request: NextRequest) {
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
    console.error('Queue processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    )
  }
}
