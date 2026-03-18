export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { flushRedisToDatabase } from '@/lib/analytics/view-counter'

/**
 * Vercel Cron Job - Flush Redis View Counters to Database
 * 
 * Runs every 5 minutes to batch-write accumulated view counts from Redis to PostgreSQL.
 * This reduces database writes by 95%+ for high-traffic stories.
 * 
 * Add to vercel.json:
 * "crons": [
 *   {
 *     "path": "/api/cron/flush-analytics",
 *     "schedule": "every 5 minutes"
 *   }
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
