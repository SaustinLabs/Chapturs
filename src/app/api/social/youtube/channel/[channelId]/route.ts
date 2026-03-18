export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCachedOrFetch, CACHE_TTL } from '@/lib/cache/social-cache'
import { getChannelStatsById } from '@/lib/api/youtube'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    const cacheKey = `youtube:channel:${channelId}`
    const data = await getCachedOrFetch(cacheKey, () => getChannelStatsById(channelId), CACHE_TTL.youtube)

    if ('error' in data) {
      const status = data.error.includes('not found') ? 404 : 502
      return NextResponse.json(data, { status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] YouTube channel route error:', error)
    return NextResponse.json({ error: 'Failed to fetch YouTube channel data' }, { status: 500 })
  }
}
