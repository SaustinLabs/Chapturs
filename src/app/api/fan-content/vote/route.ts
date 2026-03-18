export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      fanTranslationId,
      fanAudiobookId,
      readabilityRating,
      comprehensionRating,
      polishRating,
    } = body

    // Validate that exactly one content type is specified
    if (
      (!fanTranslationId && !fanAudiobookId) ||
      (fanTranslationId && fanAudiobookId)
    ) {
      return NextResponse.json(
        { error: 'Must specify exactly one of fanTranslationId or fanAudiobookId' },
        { status: 400 }
      )
    }

    // Validate ratings (1-5)
    if (
      !readabilityRating ||
      !comprehensionRating ||
      !polishRating ||
      readabilityRating < 1 ||
      readabilityRating > 5 ||
      comprehensionRating < 1 ||
      comprehensionRating > 5 ||
      polishRating < 1 ||
      polishRating > 5
    ) {
      return NextResponse.json(
        { error: 'Ratings must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Create or update vote
    const vote = await prisma.fanContentVote.upsert({
      where: fanTranslationId
        ? {
            userId_fanTranslationId: {
              userId: session.user.id,
              fanTranslationId,
            },
          }
        : {
            userId_fanAudiobookId: {
              userId: session.user.id,
              fanAudiobookId: fanAudiobookId!,
            },
          },
      create: {
        userId: session.user.id,
        fanTranslationId,
        fanAudiobookId,
        readabilityRating,
        comprehensionRating,
        polishRating,
      },
      update: {
        readabilityRating,
        comprehensionRating,
        polishRating,
      },
    })

    // Recalculate quality averages
    const contentId = fanTranslationId || fanAudiobookId!
    const contentType = fanTranslationId ? 'translation' : 'audiobook'

    const votes = await prisma.fanContentVote.findMany({
      where: fanTranslationId
        ? { fanTranslationId }
        : { fanAudiobookId },
    })

    const totalVotes = votes.length
    const readabilityAvg =
      votes.reduce((sum: number, v: any) => sum + v.readabilityRating, 0) / totalVotes
    const comprehensionAvg =
      votes.reduce((sum: number, v: any) => sum + v.comprehensionRating, 0) / totalVotes
    const polishAvg =
      votes.reduce((sum: number, v: any) => sum + v.polishRating, 0) / totalVotes
    const qualityOverall = (readabilityAvg + comprehensionAvg + polishAvg) / 3

    // Update content with new averages
    if (fanTranslationId) {
      await prisma.fanTranslation.update({
        where: { id: fanTranslationId },
        data: {
          readabilityAvg,
          comprehensionAvg,
          polishAvg,
          qualityOverall,
          ratingCount: totalVotes,
        },
      })
    } else {
      await prisma.fanAudiobook.update({
        where: { id: fanAudiobookId },
        data: {
          readabilityAvg,
          comprehensionAvg,
          polishAvg,
          qualityOverall,
          ratingCount: totalVotes,
        },
      })
    }

    return NextResponse.json({
      success: true,
      vote: {
        id: vote.id,
        readabilityRating: vote.readabilityRating,
        comprehensionRating: vote.comprehensionRating,
        polishRating: vote.polishRating,
        qualityOverall: (vote.readabilityRating + vote.comprehensionRating + vote.polishRating) / 3,
      },
      updatedQuality: {
        qualityOverall: Math.round(qualityOverall * 10) / 10,
        ratingCount: totalVotes,
      },
    })
  } catch (error) {
    console.error('Failed to submit vote:', error)
    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    )
  }
}
