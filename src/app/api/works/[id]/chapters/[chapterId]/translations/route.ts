export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id, chapterId } = await params
    const { searchParams } = new URL(request.url)
    const languageCode = searchParams.get('languageCode') || 'en'

    console.log('[TRANS_API] Fetching translations for:', { id, chapterId, languageCode })

    // Fetch all translations for this chapter and language
    let translations: any[] = []
    try {
      translations = await prisma.fanTranslation.findMany({
        where: {
          id,
          chapterId,
          languageCode,
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
        orderBy: {
          qualityOverall: 'desc',
        },
      })
      console.log('[TRANS_API] Found', translations.length, 'translations')
    } catch (dbError) {
      console.error('[TRANS_API] Database error fetching translations:', dbError)
      // Return empty array instead of error if DB query fails
      translations = []
    }

    // Determine current default
    let currentDefault = null
    try {
      const section = await prisma.section.findUnique({
        where: { id: chapterId },
        select: { defaultTranslationIdByLanguage: true },
      })

      if (section?.defaultTranslationIdByLanguage) {
        const defaults =
          typeof section.defaultTranslationIdByLanguage === 'string'
            ? JSON.parse(section.defaultTranslationIdByLanguage)
            : section.defaultTranslationIdByLanguage
        currentDefault = defaults[languageCode] || null
      }
    } catch (e) {
      console.error('[TRANS_API] Failed to determine default translation:', e)
    }

    // Format response
    const formattedTranslations = translations.map((t: any) => ({
      id: t.id,
      tier: t.tier,
      title: t.translatedTitle,
      translatorName:
        t.tier === 'TIER_2_COMMUNITY'
          ? 'Community Edits'
          : t.translator?.displayName || t.translator?.username || 'Anonymous',
      qualityOverall: t.qualityOverall || 0,
      ratingCount: t.ratingCount || 0,
      editCount: t.editCount || 0,
      isDefault: t.id === currentDefault,
    }))

    console.log('[TRANS_API] Returning response with', formattedTranslations.length, 'translations')

    return NextResponse.json({
      languageCode,
      currentDefault,
      translations: formattedTranslations,
    })
  } catch (error) {
    console.error('[TRANS_API] Failed to fetch translations:', error)
    // Return empty array instead of error
    return NextResponse.json({
      languageCode: 'en',
      currentDefault: null,
      translations: [],
    })
  }
}
