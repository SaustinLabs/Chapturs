import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const SITE_PAGEVIEWS_KEY = 'chapturs:site:pageviews'

// These reflect actual codebase measurements (updated at build time).
// Lines of code: TypeScript/TSX files in src/ — last counted April 2026.
const BUILD_STATS = {
  linesOfCode: 85000,
  featuresShipped: 74,
  // Approximate hours — project active development started late 2025.
  hoursBuilding: 600,
}

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export const revalidate = 60 // cache for 60 seconds

export async function GET() {
  let pageviews = 0

  const redis = getRedis()
  if (redis) {
    try {
      const raw = await redis.get<number>(SITE_PAGEVIEWS_KEY)
      pageviews = typeof raw === 'number' ? raw : parseInt(String(raw ?? '0'), 10) || 0
    } catch {
      // Return 0 rather than error
    }
  }

  return NextResponse.json({
    pageviews,
    ...BUILD_STATS,
  })
}
