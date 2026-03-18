export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workId: string; chapterId: string; audiobookId: string }> }
) {
  try {
    const { audiobookId } = await params

    // Fetch audiobook
    const audiobook = await prisma.fanAudiobook.findUnique({
      where: {
        id: audiobookId,
        status: 'active',
      },
      include: {
        narrator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    if (!audiobook) {
      return NextResponse.json(
        { error: 'Audiobook not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      url: audiobook.audioUrl,
      durationSeconds: audiobook.durationSeconds,
      narratorName:
        audiobook.tier === 'TIER_1_OFFICIAL'
          ? 'Official AI Voice'
          : audiobook.narrator?.displayName ||
            audiobook.narrator?.username ||
            'Anonymous',
      contentType: 'audio/mpeg',
    })
  } catch (error) {
    console.error('Failed to fetch audiobook stream:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audiobook stream' },
      { status: 500 }
    )
  }
}
