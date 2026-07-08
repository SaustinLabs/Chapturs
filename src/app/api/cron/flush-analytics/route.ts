export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { flushRedisToDatabase } from '@/lib/analytics/view-counter'

/**
 * Cron Job - Flush Redis View Counters to Database
 * 
 * Runs every 5 minutes to batch-write accumulated view counts from Redis to PostgreSQL.
 * This reduces database writes by 95%+ for high-traffic stories.
 * 
 * Add to crontab (runs every 5 min):
 *   curl -s -H "Authorization: Bearer $CRON_SECRET" \
 *   https://chapturs.com/api/cron/flush-analytics
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

    // Flush Redis counters to database
    const result = await flushRedisToDatabase()

    // Auto-publish scheduled chapters
    const now = new Date()
    const publishCount = await prisma.section.updateMany({
      where: {
        status: 'draft',
        scheduledPublishAt: {
          lte: now
        }
      },
      data: {
        status: 'published',
        publishedAt: now,
        scheduledPublishAt: null // Clear the schedule once published
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      publishedChapters: publishCount.count,
      ...result
    })

  } catch (error) {
    console.error('Cron job error (flush-analytics):', error)
    return NextResponse.json(
      { 
        error: 'Failed to flush analytics',
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
