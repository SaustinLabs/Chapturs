export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workId: string; chapterId: string; translationId: string }> }
) {
  try {
    const { translationId } = await params
    const session = await auth()

    // Fetch translation with content
    const translation = await prisma.fanTranslation.findUnique({
      where: {
        id: translationId,
        status: 'active',
      },
      include: {
        translator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      )
    }

    // Get user's vote if authenticated
    let userVote = null
    if (session?.user?.id) {
      const vote = await prisma.fanContentVote.findUnique({
        where: {
          userId_fanTranslationId: {
            userId: session.user.id,
            fanTranslationId: translationId,
          },
        },
      })

      if (vote) {
        userVote = {
          readability: vote.readabilityRating,
          comprehension: vote.comprehensionRating,
          polish: vote.polishRating,
        }
      }
    }

    // Parse content if it's a string
    let content = translation.translatedContent
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content)
      } catch (e) {
        console.error('Failed to parse translation content:', e)
      }
    }

    return NextResponse.json({
      id: translation.id,
      tier: translation.tier,
      title: translation.translatedTitle,
      content,
      qualityOverall: translation.qualityOverall,
      ratingCount: translation.ratingCount,
      translatorName:
        translation.tier === 'TIER_2_COMMUNITY'
          ? 'Community Edits'
          : translation.translator?.displayName ||
            translation.translator?.username ||
            'Anonymous',
      translationNotes: translation.translationNotes,
      userVote,
    })
  } catch (error) {
    console.error('Failed to fetch translation content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translation content' },
      { status: 500 }
    )
  }
}
