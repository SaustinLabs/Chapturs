// ============================================================================
// CONTENT SIMILARITY SERVICE
// ============================================================================
//
// Three signal layers, each activates automatically when data is available:
//
//  1. Semantic (immediate) — Jaccard distance on LLM-extracted tag sets.
//     Written after every QA run; works from day one with a single work.
//
//  2. Collaborative (dormant) — co-read overlap from ReadingSession.
//     Activates per-work once MIN_CO_READS unique readers exist.
//     Stored in ContentSimilarity with type='collaborative'.
//
//  3. Author curated (always) — AuthorRecommendation rows set manually.
//     Surfaced first, independent of signal availability.
//
// getRelatedWorks() cascades through all three plus trending/popular fallbacks.

import { prisma } from '@/lib/database/PrismaService'
import type { WorkSemanticProfileData } from '@/lib/quality-assessment/types'

// Minimum unique readers before collaborative signals are considered meaningful
const MIN_CO_READS = 5
// Minimum score to store a semantic similarity pair (avoids table bloat)
const MIN_SEMANTIC_SCORE = 0.12
// Max works to scan when computing similarity (performance guard)
const MAX_PROFILE_SCAN = 2000

// ─── Jaccard ────────────────────────────────────────────────────────────────

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  const setA = new Set(a.map((s) => s.toLowerCase()))
  const setB = new Set(b.map((s) => s.toLowerCase()))
  const intersection = [...setA].filter((x) => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

function buildAllTags(profile: WorkSemanticProfileData, discoveryTags: string[]): string[] {
  return [
    ...discoveryTags,
    ...profile.tone,
    ...profile.themes,
    ...profile.tropes,
    profile.pacing,
    profile.perspective,
    profile.audience,
  ]
}

// ─── Semantic profile persistence ───────────────────────────────────────────

export async function saveSemanticProfile(
  workId: string,
  profile: WorkSemanticProfileData,
  discoveryTags: string[]
): Promise<void> {
  const allTags = buildAllTags(profile, discoveryTags)

  await prisma.workSemanticProfile.upsert({
    where: { workId },
    create: {
      workId,
      tone: JSON.stringify(profile.tone),
      themes: JSON.stringify(profile.themes),
      tropes: JSON.stringify(profile.tropes),
      pacing: profile.pacing,
      perspective: profile.perspective,
      audience: profile.audience,
      allTags: JSON.stringify(allTags),
    },
    update: {
      tone: JSON.stringify(profile.tone),
      themes: JSON.stringify(profile.themes),
      tropes: JSON.stringify(profile.tropes),
      pacing: profile.pacing,
      perspective: profile.perspective,
      audience: profile.audience,
      allTags: JSON.stringify(allTags),
      computedAt: new Date(),
    },
  })

  // Fire-and-forget: compute similarity against existing profiles
  computeSemanticSimilarity(workId, allTags).catch((err) =>
    console.error('[Similarity] Semantic computation failed for', workId, err)
  )
}

// ─── Semantic similarity computation ────────────────────────────────────────

async function computeSemanticSimilarity(workId: string, allTags: string[]): Promise<void> {
  const others = await prisma.workSemanticProfile.findMany({
    where: { workId: { not: workId } },
    select: { workId: true, allTags: true },
    take: MAX_PROFILE_SCAN,
    orderBy: { computedAt: 'desc' },
  })

  for (const other of others) {
    let otherTags: string[]
    try {
      otherTags = JSON.parse(other.allTags) as string[]
    } catch {
      continue
    }
    const score = jaccardSimilarity(allTags, otherTags)
    if (score < MIN_SEMANTIC_SCORE) continue

    // Upsert both directions so queries only need workId1=thisWork
    const upsertOpts = (w1: string, w2: string) => ({
      where: {
        workId1_workId2_similarityType: {
          workId1: w1,
          workId2: w2,
          similarityType: 'semantic' as const,
        },
      },
      create: { workId1: w1, workId2: w2, similarityScore: score, similarityType: 'semantic' },
      update: { similarityScore: score, computedAt: new Date() },
    })

    await Promise.all([
      prisma.contentSimilarity.upsert(upsertOpts(workId, other.workId)),
      prisma.contentSimilarity.upsert(upsertOpts(other.workId, workId)),
    ])
  }
}

// ─── Collaborative signals ───────────────────────────────────────────────────
// Dormant until MIN_CO_READS unique readers exist for a given work.
// Call this periodically (e.g. during a cron/manual trigger) for any work you
// want to compute collaborative scores for.

export async function computeCollaborativeSignals(workId: string): Promise<void> {
  const readers = await prisma.readingSession.groupBy({
    by: ['userId'],
    where: { workId, durationSeconds: { gte: 60 } },
    _count: { userId: true },
  })

  if (readers.length < MIN_CO_READS) {
    // Not enough signal yet — skip silently. Will be revisited next time.
    return
  }

  const readerIds = readers.map((r: { userId: string }) => r.userId)

  const coReadWorks = await prisma.readingSession.groupBy({
    by: ['workId'],
    where: {
      userId: { in: readerIds },
      workId: { not: workId },
      durationSeconds: { gte: 60 },
    },
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 20,
  })

  for (const coWork of coReadWorks) {
    const overlap = coWork._count.userId
    const score = overlap / readers.length
    if (score < 0.1) continue

    const upsertOpts = (w1: string, w2: string) => ({
      where: {
        workId1_workId2_similarityType: {
          workId1: w1,
          workId2: w2,
          similarityType: 'collaborative' as const,
        },
      },
      create: { workId1: w1, workId2: w2, similarityScore: score, similarityType: 'collaborative' },
      update: { similarityScore: score, computedAt: new Date() },
    })

    await Promise.all([
      prisma.contentSimilarity.upsert(upsertOpts(workId, coWork.workId)),
      prisma.contentSimilarity.upsert(upsertOpts(coWork.workId, workId)),
    ])
  }
}

// ─── Related works cascade ───────────────────────────────────────────────────

export interface RelatedWork {
  id: string
  title: string
  coverImage: string | null
  status: string
  genres: string[]
  author: { username: string; displayName: string | null }
  signalSource: 'author' | 'collaborative' | 'semantic' | 'trending' | 'popular'
}

const WORK_SELECT = {
  id: true,
  title: true,
  coverImage: true,
  status: true,
  genres: true,
  author: { select: { user: { select: { username: true, displayName: true } } } },
} as const

function parseRelatedWork(
  w: {
    id: string
    title: string
    coverImage: string | null
    status: string
    genres: string
    author: { user: { username: string; displayName: string | null } }
  },
  signalSource: RelatedWork['signalSource']
): RelatedWork {
  return {
    id: w.id,
    title: w.title,
    coverImage: w.coverImage,
    status: w.status,
    genres: (() => {
      try {
        return JSON.parse(w.genres) as string[]
      } catch {
        return []
      }
    })(),
    author: {
      username: w.author.user.username,
      displayName: w.author.user.displayName,
    },
    signalSource,
  }
}

/**
 * Returns up to `limit` related works for the given work using a cascade:
 *  1. Author curated picks
 *  2. Collaborative similarity (if signals exist)
 *  3. Semantic similarity (LLM tag Jaccard)
 *  4. Trending works in same primary genre
 *  5. Popular (viewCount) in same primary genre
 */
export async function getRelatedWorks(
  workId: string,
  genres: string[],
  limit = 4
): Promise<RelatedWork[]> {
  const results: RelatedWork[] = []
  const seen = new Set<string>([workId])

  const fill = (items: RelatedWork[]) => {
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        results.push(item)
      }
    }
  }

  // ── 1. Author curated ────────────────────────────────────────────────────
  const curated = await prisma.authorRecommendation.findMany({
    where: { workId },
    orderBy: { sortOrder: 'asc' },
    take: limit,
    select: {
      recommendedWork: { select: WORK_SELECT },
    },
  })
  fill(curated.map((r: any) => parseRelatedWork(r.recommendedWork as any, 'author')))

  if (results.length >= limit) return results.slice(0, limit)

  // ── 2. Collaborative ─────────────────────────────────────────────────────
  const collaborative = await prisma.contentSimilarity.findMany({
    where: {
      workId1: workId,
      similarityType: 'collaborative',
      work2: { status: { not: 'draft' } },
    },
    orderBy: { similarityScore: 'desc' },
    take: limit * 2,
    select: { work2: { select: WORK_SELECT } },
  })
  fill(collaborative.map((r: any) => parseRelatedWork(r.work2 as any, 'collaborative')))

  if (results.length >= limit) return results.slice(0, limit)

  // ── 3. Semantic ──────────────────────────────────────────────────────────
  const semantic = await prisma.contentSimilarity.findMany({
    where: {
      workId1: workId,
      similarityType: 'semantic',
      work2: { status: { not: 'draft' } },
    },
    orderBy: { similarityScore: 'desc' },
    take: limit * 2,
    select: { work2: { select: WORK_SELECT } },
  })
  fill(semantic.map((r: any) => parseRelatedWork(r.work2 as any, 'semantic')))

  if (results.length >= limit) return results.slice(0, limit)

  const primaryGenre = genres[0] ?? null
  const remaining = limit - results.length

  if (primaryGenre) {
    // ── 4. Trending same genre ─────────────────────────────────────────────
    const trending = await prisma.work.findMany({
      where: {
        id: { notIn: [...seen] },
        status: { not: 'draft' },
        genres: { contains: primaryGenre },
        trendingMetric: { isNot: null },
      },
      select: { ...WORK_SELECT, trendingMetric: { select: { trendingScore: true } } },
      orderBy: { trendingMetric: { trendingScore: 'desc' } },
      take: remaining,
    })
    fill(trending.map((w: any) => parseRelatedWork(w as any, 'trending')))

    if (results.length >= limit) return results.slice(0, limit)

    // ── 5. Popular same genre (final fallback) ────────────────────────────
    const popular = await prisma.work.findMany({
      where: {
        id: { notIn: [...seen] },
        status: { not: 'draft' },
        genres: { contains: primaryGenre },
      },
      select: WORK_SELECT,
      orderBy: { viewCount: 'desc' },
      take: limit - results.length,
    })
    fill(popular.map((w: any) => parseRelatedWork(w as any, 'popular')))
  }

  return results.slice(0, limit)
}
