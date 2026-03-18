export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import twitchClient from '@/lib/api/twitch'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelName = searchParams.get('channel')

    if (!channelName) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      )
    }

    // Validate channel name format
    if (!/^[a-zA-Z0-9_]{1,25}$/.test(channelName)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid channel name format' },
        { status: 200 }
      )
    }

    const isValid = await twitchClient.validateChannel(channelName)

    return NextResponse.json({ 
      valid: isValid,
      channel: isValid ? channelName : null
    })

  } catch (error) {
    console.error('[API] Error validating Twitch channel:', error)
    return NextResponse.json(
      { 
        valid: false,
        error: 'Failed to validate channel'
      },
      { status: 200 } // Still return 200 to indicate validation completed
    )
  }
}
