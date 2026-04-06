export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

// Minimum ratings needed before auto-promoting a community translation
const PROMOTE_MIN_RATINGS = 5
const PROMOTE_MIN_QUALITY = 4.0

/**
 * POST /api/fan-translations/[id]/rate
 * Rate a FanTranslation with a single 1–5 score.
 * The score is stored as all three sub-ratings (readability/comprehension/polish)
 * so the schema stays consistent.
 *
 * Task 92: community rating; Task 93: auto-promote on quality threshold.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { rating } = body

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'rating must be a number between 1 and 5' },
      { status: 400 }
    )
  }

  const ratingInt = Math.round(rating)

  // Fetch translation so we have chapterId + languageCode for auto-promote
  const fanTranslation = await prisma.fanTranslation.findUnique({
    where: { id },
    select: { id: true, chapterId: true, languageCode: true, tier: true },
  })

  if (!fanTranslation) {
    return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
  }

  // Upsert vote — user can revise their rating
  await prisma.fanContentVote.upsert({
    where: {
      userId_fanTranslationId: {
        userId: session.user.id,
        fanTranslationId: id,
      },
    },
    create: {
      userId: session.user.id,
      fanTranslationId: id,
      fanAudiobookId: null,
      readabilityRating: ratingInt,
      comprehensionRating: ratingInt,
      polishRating: ratingInt,
    },
    update: {
      readabilityRating: ratingInt,
      comprehensionRating: ratingInt,
      polishRating: ratingInt,
    },
  })

  // Recompute quality average across all votes
  const allVotes = await prisma.fanContentVote.findMany({
    where: { fanTranslationId: id },
    select: {
      readabilityRating: true,
      comprehensionRating: true,
      polishRating: true,
    },
  })

  const count = allVotes.length
  const sumQuality = allVotes.reduce(
    (acc: number, v: { readabilityRating: number; comprehensionRating: number; polishRating: number }) =>
      acc + (v.readabilityRating + v.comprehensionRating + v.polishRating) / 3,
    0
  )
  const avgQuality = count > 0 ? sumQuality / count : 0

  await prisma.fanTranslation.update({
    where: { id },
    data: {
      qualityOverall: avgQuality,
      ratingCount: count,
    },
  })

  // Task 93: Auto-promote if this translation meets quality threshold
  // Only promote non-AI translations (TIER_2 or TIER_3) when they beat the bar,
  // or any translation when nothing is set yet for the language.
  if (count >= PROMOTE_MIN_RATINGS && avgQuality >= PROMOTE_MIN_QUALITY) {
    const section = await prisma.section.findUnique({
      where: { id: fanTranslation.chapterId },
      select: { defaultTranslationIdByLanguage: true },
    })

    if (section) {
      const defaults: Record<string, string> = section.defaultTranslationIdByLanguage
        ? typeof section.defaultTranslationIdByLanguage === 'string'
          ? JSON.parse(section.defaultTranslationIdByLanguage)
          : (section.defaultTranslationIdByLanguage as Record<string, string>)
        : {}

      const lang = fanTranslation.languageCode
      const currentId = defaults[lang]

      // Promote if: no default set yet, OR this is a community/pro translation
      // (community beat the AI if it also crossed the threshold)
      if (!currentId || fanTranslation.tier !== 'TIER_1_OFFICIAL') {
        defaults[lang] = id
        await prisma.section.update({
          where: { id: fanTranslation.chapterId },
          data: { defaultTranslationIdByLanguage: defaults },
        })
      }
    }
  }

  return NextResponse.json({
    success: true,
    qualityOverall: Math.round(avgQuality * 10) / 10,
    ratingCount: count,
    userRating: ratingInt,
  })
}

/**
 * GET /api/fan-translations/[id]/rate
 * Returns the current user's rating (if any) for the given translation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ userRating: null })
  }

  const { id } = await params

  const vote = await prisma.fanContentVote.findUnique({
    where: {
      userId_fanTranslationId: {
        userId: session.user.id,
        fanTranslationId: id,
      },
    },
    select: { readabilityRating: true },
  })

  return NextResponse.json({
    userRating: vote ? vote.readabilityRating : null,
  })
}
