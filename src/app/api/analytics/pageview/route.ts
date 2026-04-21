import { NextResponse } from 'next/server'

const SITE_PAGEVIEWS_KEY = 'chapturs:site:pageviews'

// Use raw fetch against the Upstash REST API — no SDK, no package bundling issues.
// Works in Next.js standalone mode since fetch is built into Node.js 18+.
async function redisIncr(key: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return

  await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function POST() {
  try {
    await redisIncr(SITE_PAGEVIEWS_KEY)
  } catch {
    // Never fail a user request over a stats write
  }
  return new NextResponse(null, { status: 204 })
}
