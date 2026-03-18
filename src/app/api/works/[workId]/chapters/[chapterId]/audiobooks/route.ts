export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workId: string; chapterId: string }> }
) {
  try {
    const { workId, chapterId } = await params

    console.log('[AUDIO_API] Fetching audiobooks for:', { workId, chapterId })

    // Fetch all audiobooks for this chapter
    let audiobooks: any[] = []
    try {
      audiobooks = await prisma.fanAudiobook.findMany({
        where: {
          workId,
          chapterId,
          status: 'active',
        },
        include: {
          narrator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          { tier: 'asc' }, // TIER_1_OFFICIAL comes first
          { qualityOverall: 'desc' },
        ],
      })
      console.log('[AUDIO_API] Found', audiobooks.length, 'audiobooks')
    } catch (dbError) {
      console.error('[AUDIO_API] Database error:', dbError)
      audiobooks = []
    }

    // Determine current default
    let section
    try {
      section = await prisma.section.findUnique({
        where: { id: chapterId },
        select: { defaultAudiobookId: true },
      })
    } catch (e) {
      console.error('[AUDIO_API] Failed to fetch section:', e)
    }

    const currentDefault = section?.defaultAudiobookId || audiobooks[0]?.id || null

    // Format response
    const formattedAudiobooks = audiobooks.map((a: any) => ({
      id: a.id,
      tier: a.tier,
      narratorName:
        a.tier === 'TIER_1_OFFICIAL'
          ? 'Official AI Voice'
          : a.narrator?.displayName || a.narrator?.username || 'Anonymous',
      narratorId: a.narratorId,
      durationSeconds: a.durationSeconds || 0,
      qualityOverall: a.qualityOverall || 0,
      ratingCount: a.ratingCount || 0,
      isDefault: a.id === currentDefault,
      isPlaying: false,
    }))

    console.log('[AUDIO_API] Returning', formattedAudiobooks.length, 'audiobooks')

    return NextResponse.json({
      currentDefault,
      audiobooks: formattedAudiobooks,
    })
  } catch (error) {
    console.error('[AUDIO_API] Failed to fetch audiobooks:', error)
    return NextResponse.json({
      currentDefault: null,
      audiobooks: [],
    })
  }
}
