export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import twitchClient from '@/lib/api/twitch'
import { getCachedOrFetch, CACHE_TTL } from '@/lib/cache/social-cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelName: string }> }
) {
  try {
    const { channelName } = await params

    if (!channelName) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      )
    }

    // Validate channel name format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]{1,25}$/.test(channelName)) {
      return NextResponse.json(
        { error: 'Invalid channel name format' },
        { status: 400 }
      )
    }

    // Use cache with 5-minute TTL
    const cacheKey = `twitch:channel:${channelName.toLowerCase()}`
    
    const data = await getCachedOrFetch(
      cacheKey,
      () => twitchClient.getChannelData(channelName),
      CACHE_TTL.twitch
    )

    // If there's an error in the data, return it with appropriate status
    if (data.error) {
      const status = data.error.includes('not found') ? 404 : 500
      return NextResponse.json(data, { status })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('[API] Error fetching Twitch channel:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch Twitch channel data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
