export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCachedOrFetch, CACHE_TTL } from '@/lib/cache/social-cache'

async function fetchDiscordWidget(guildId: string) {
  const res = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`, {
    // Discord API prefers a UA; not strictly required but nice to have
    headers: {
      'User-Agent': 'ChaptursApp/1.0 (https://chapturs.com)'
    },
    // Avoid Next.js caching the external request implicitly
    cache: 'no-store'
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord widget fetch failed (${res.status}): ${text}`)
  }

  return res.json()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params
    if (!guildId || !/^\d{5,20}$/.test(guildId)) {
      return NextResponse.json({ error: 'Invalid guild ID' }, { status: 400 })
    }

    const cacheKey = `discord:server:${guildId}`
    const data = await getCachedOrFetch(cacheKey, () => fetchDiscordWidget(guildId), CACHE_TTL.discord)

    // Normalize the response shape for the front-end
    const normalized = {
      id: data.id,
      name: data.name,
      instantInvite: data.instant_invite || null,
      presenceCount: data.presence_count || 0,
      memberCount: Array.isArray(data.members) ? data.members.length : 0,
      iconUrl: data.icon_url || null,
    }

    return NextResponse.json(normalized)
  } catch (error) {
    console.error('[API] Discord server widget error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    // Most common: widget disabled or guild not found
    const status = message.includes('404') ? 404 : 502
    return NextResponse.json({ error: 'Failed to fetch Discord widget', details: message }, { status })
  }
}
