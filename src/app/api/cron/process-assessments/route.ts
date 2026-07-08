export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron Job - Process Quality Assessment Queue
 * 
 * Triggered by VPS crontab or PM2 to process the quality
 * assessment queue every 5 minutes.
 * 
 * Add to crontab (runs every 5 min):
 *   curl -s -H "Authorization: Bearer $CRON_SECRET" \
 *   https://chapturs.com/api/cron/process-assessments
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process up to 10 assessments per run
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/quality-assessment/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 10 })
      }
    )

    if (!response.ok) {
      throw new Error(`Process API returned ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed: result.processed || 0,
      failed: result.failed || 0,
      remaining: result.remaining || 0
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process queue',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
