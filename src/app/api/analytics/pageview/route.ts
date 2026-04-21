import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const SITE_PAGEVIEWS_KEY = 'chapturs:site:pageviews'

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export async function POST() {
  const redis = getRedis()
  if (!redis) {
    // Redis not configured — silently succeed
    return new NextResponse(null, { status: 204 })
  }

  try {
    await redis.incr(SITE_PAGEVIEWS_KEY)
  } catch {
    // Never fail a user request over a stats write
  }

  return new NextResponse(null, { status: 204 })
}
