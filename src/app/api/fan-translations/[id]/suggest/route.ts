export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

/**
 * POST /api/fan-translations/[id]/suggest
 * Submit a text improvement suggestion for an AI-generated or community FanTranslation.
 *
 * Body: { suggestedText: string, reason?: string, blockIndex?: number }
 *
 * Stored in TranslationSuggestion with:
 *   - translationId  → fanTranslation.id (cross-reference for admin review)
 *   - workId/sectionId → from the FanTranslation record
 *   - blockId        → blockIndex as string (identifies the paragraph, defaults 'general')
 *   - sentenceId     → '0'
 *   - language       → fanTranslation.languageCode
 *
 * Task 91: community improvement suggestions.
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
  const { suggestedText, reason, blockIndex } = body

  if (!suggestedText || typeof suggestedText !== 'string' || !suggestedText.trim()) {
    return NextResponse.json(
      { error: 'suggestedText is required' },
      { status: 400 }
    )
  }

  const fanTranslation = await prisma.fanTranslation.findUnique({
    where: { id },
    select: { workId: true, chapterId: true, languageCode: true },
  })

  if (!fanTranslation) {
    return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
  }

  // Rate-limit: one pending suggestion per block per user per translation
  const existingPending = await prisma.translationSuggestion.findFirst({
    where: {
      translationId: id,
      userId: session.user.id,
      blockId: blockIndex != null ? String(blockIndex) : 'general',
      status: 'pending',
    },
    select: { id: true },
  })

  if (existingPending) {
    return NextResponse.json(
      { error: 'You already have a pending suggestion for this passage. Wait for it to be reviewed before submitting another.' },
      { status: 429 }
    )
  }

  const suggestion = await prisma.translationSuggestion.create({
    data: {
      translationId: id, // references the FanTranslation id for admin review
      workId: fanTranslation.workId,
      sectionId: fanTranslation.chapterId,
      blockId: blockIndex != null ? String(blockIndex) : 'general',
      sentenceId: '0',
      language: fanTranslation.languageCode,
      originalText: '', // original paragraph text is not required client-side
      suggestedText: suggestedText.trim(),
      reason: reason?.trim() || null,
      userId: session.user.id,
      status: 'pending',
    },
  })

  return NextResponse.json({ success: true, suggestionId: suggestion.id }, { status: 201 })
}
