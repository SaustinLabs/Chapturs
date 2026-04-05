export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { translateOnDemand, translateBatch } from '@/lib/translation'

// Short-lived in-memory cache keyed by `${workId}:${chapterId}:${lang}`
const aiCache = new Map<string, { content: any[]; translatedTitle: string }>()

async function generateAITranslation(
  originalTitle: string,
  originalContent: any[],
  lang: string
): Promise<{ translatedTitle: string; translatedContent: any[] }> {
  // Translate title
  const translatedTitle = await translateOnDemand(originalTitle, lang)

  // Extract text from each block; skip non-text blocks (images, embeds, etc.)
  const texts = originalContent.map((block) => block.content ?? block.text ?? '')

  // Translate all text blocks in a single batched LLM call
  const translatedTexts = await translateBatch(texts, lang)

  const translatedContent = originalContent.map((block, i) => ({
    ...block,
    ...(block.content !== undefined ? { content: translatedTexts[i] } : {}),
    ...(block.text !== undefined && block.content === undefined ? { text: translatedTexts[i] } : {}),
  }))

  return { translatedTitle, translatedContent }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workId: string; chapterId: string }> }
) {
  try {
    const { workId, chapterId } = await params
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang') || 'en'

    // Fetch chapter/section data
    const section = await prisma.section.findUnique({
      where: { id: chapterId },
      select: {
        title: true,
        content: true,
        defaultTranslationIdByLanguage: true,
      },
    })

    if (!section) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // Check if there is a default translation for this language
    let defaultTransId = null
    if (section.defaultTranslationIdByLanguage) {
      const defaults =
        typeof section.defaultTranslationIdByLanguage === 'string'
          ? JSON.parse(section.defaultTranslationIdByLanguage)
          : section.defaultTranslationIdByLanguage
      defaultTransId = defaults[lang] || null
    }

    if (defaultTransId) {
      // Fetch the translation
      const translation = await prisma.fanTranslation.findUnique({
        where: { id: defaultTransId },
        select: {
          translatedTitle: true,
          translatedContent: true,
          tier: true,
        },
      })
      if (translation) {
        return NextResponse.json({
          language: lang,
          title: translation.translatedTitle,
          content: JSON.parse(translation.translatedContent),
          source: translation.tier,
        })
      }
    }

    // No translation yet – generate or fetch AI version
    const cacheKey = `${workId}:${chapterId}:${lang}`
    const cached = aiCache.get(cacheKey)
    if (cached) {
      return NextResponse.json({
        language: lang,
        title: cached.translatedTitle,
        content: cached.translatedContent,
        source: 'TIER_1_OFFICIAL',
      })
    }

    // Generate AI translation (placeholder)
    const originalTitle = section.title
    const originalContent = section.content as any[]
    const { translatedTitle, translatedContent } = await generateAITranslation(
      originalTitle,
      originalContent,
      lang
    )

    // Cache in memory
    aiCache.set(cacheKey, { translatedTitle, translatedContent })

    // Optionally persist as a FanTranslation with tier TIER_1_OFFICIAL for caching
    try {
      await prisma.fanTranslation.create({
        data: {
          id: `ai-${workId}-${chapterId}-${lang}-${Date.now()}`,
          workId,
          chapterId,
          languageCode: lang,
          status: 'active',
          tier: 'TIER_1_OFFICIAL',
          translatedTitle,
          translatedContent: JSON.stringify(translatedContent),
          qualityOverall: 4.5,
          ratingCount: 0,
          editCount: 0,
          translatorId: 'system-ai',
        },
      })
    } catch (e) {
      // ignore duplicate or DB errors
      console.error('Failed to persist AI translation:', e)
    }

    return NextResponse.json({
      language: lang,
      title: translatedTitle,
      content: translatedContent,
      source: 'TIER_1_OFFICIAL',
    })
  } catch (error) {
    console.error('Translation content fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translation' },
      { status: 500 }
    )
  }
}
