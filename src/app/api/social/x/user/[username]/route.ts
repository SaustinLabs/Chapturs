export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCachedOrFetch, CACHE_TTL } from '@/lib/cache/social-cache'
import { getUserByUsername } from '@/lib/api/x'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    if (process.env.ENABLE_X_API !== 'true' || !process.env.TWITTER_BEARER_TOKEN) {
      return NextResponse.json({ error: 'X integration disabled' }, { status: 503 })
    }
    const { username } = await params
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const cacheKey = `x:user:${username.toLowerCase()}`
    // Heavy caching: 12 hours by default
    const ttl = 12 * 60 * 60 * 1000
    const data = await getCachedOrFetch(cacheKey, () => getUserByUsername(username), ttl)

    if ('error' in data) {
      const status = data.error.includes('not found') ? 404 : 502
      return NextResponse.json(data, { status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] X user route error:', error)
    return NextResponse.json({ error: 'Failed to fetch X user' }, { status: 500 })
  }
}
