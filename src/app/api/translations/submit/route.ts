export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      workId,
      chapterId,
      languageCode,
      translatedTitle,
      translatedContent,
      translationNotes,
    } = body

    // Validate required fields
    if (
      !workId ||
      !chapterId ||
      !languageCode ||
      !translatedTitle ||
      !translatedContent
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if creator allows Tier 3 translations
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: {
          include: {
            fanContentSettings: true,
          },
        },
      },
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const settings = work.author.fanContentSettings
    if (settings && !settings.allowTier3Translations) {
      return NextResponse.json(
        { error: 'Creator does not allow Tier 3 translations' },
        { status: 403 }
      )
    }

    // Create translation
    const translation = await prisma.fanTranslation.create({
      data: {
        workId,
        chapterId,
        languageCode,
        tier: 'TIER_3_PROFESSIONAL',
        translatorId: session.user.id,
        translatedTitle,
        translatedContent:
          typeof translatedContent === 'string'
            ? translatedContent
            : JSON.stringify(translatedContent),
        translationNotes,
        status: 'active',
      },
    })

    // Create Tier 3 deal if required
    if (settings?.requireCustomDealApproval) {
      await prisma.tier3Deal.create({
        data: {
          workId,
          creatorId: work.authorId,
          contributorId: session.user.id,
          contentType: 'TRANSLATION',
          languageCode,
          revenueSharePercent: settings.defaultTranslationRevenueShare,
          status: 'pending_creator',
        },
      })
    }

    return NextResponse.json({
      success: true,
      translation: {
        id: translation.id,
        tier: translation.tier,
        status: translation.status,
        message: 'Translation submitted! It will appear in the menu immediately.',
      },
    })
  } catch (error) {
    console.error('Failed to submit translation:', error)
    return NextResponse.json(
      { error: 'Failed to submit translation' },
      { status: 500 }
    )
  }
}
