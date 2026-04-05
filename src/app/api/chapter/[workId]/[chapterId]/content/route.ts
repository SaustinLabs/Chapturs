export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { translateOnDemand, translateBatch } from '@/lib/translation'

// Short-lived in-memory cache keyed by `${workId}:${chapterId}:${lang}`
const aiCache = new Map<string, { content: any[]; translatedTitle: string }>()

// ---------------------------------------------------------------------------
// Rate limiter — max 20 translation calls per IP per hour
// Uses a simple sliding-window counter stored in process memory.
// Good enough without Redis; resets on server restart.
// ---------------------------------------------------------------------------
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

interface RateEntry { count: number; windowStart: number }
const rateLimitMap = new Map<string, RateEntry>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

// Periodically purge stale entries to prevent unbounded growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_WINDOW_MS) rateLimitMap.delete(key)
  }
}, RATE_WINDOW_MS)
// ---------------------------------------------------------------------------

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

    // If English, return early — caller should use the normal section endpoint
    if (lang === 'en') {
      return NextResponse.json({ language: 'en', title: null, content: null, source: 'original' })
    }

    // --- Rate limit check (applied before any LLM work) ---
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many translation requests. Please wait before translating more chapters.' },
        { status: 429 }
      )
    }

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
      const translation = await prisma.fanTranslation.findUnique({
        where: { id: defaultTransId },
        select: { translatedTitle: true, translatedContent: true, tier: true },
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

    // Check process-level cache (avoids duplicate LLM calls within same deploy)
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

    // Generate AI translation
    const originalTitle = section.title
    const originalContent = section.content as any[]
    const { translatedTitle, translatedContent } = await generateAITranslation(
      originalTitle,
      originalContent,
      lang
    )

    // Store in process cache
    aiCache.set(cacheKey, { translatedTitle, translatedContent })

    // Persist to DB so future requests skip the LLM entirely.
    // Uses upsert to handle the unique(chapterId, languageCode, tier) constraint.
    // translatorId is null — AI translations have no user FK.
    prisma.fanTranslation.upsert({
      where: { chapterId_languageCode_tier: { chapterId, languageCode: lang, tier: 'TIER_1_OFFICIAL' } },
      create: {
        workId,
        chapterId,
        languageCode: lang,
        status: 'active',
        tier: 'TIER_1_OFFICIAL',
        translatorId: null,
        translatedTitle,
        translatedContent: JSON.stringify(translatedContent),
        qualityOverall: 0,
        ratingCount: 0,
        editCount: 0,
      },
      update: {
        translatedTitle,
        translatedContent: JSON.stringify(translatedContent),
        updatedAt: new Date(),
      },
    }).catch((e) => console.error('Failed to persist AI translation:', e))

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

