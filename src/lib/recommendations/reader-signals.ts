// ============================================================================
// READER-TO-READER RECOMMENDATION SIGNALS
// ============================================================================
//
// Computes "readers who completed X also completed Y" similarity scores and
// stores them in ContentSimilarity with similarityType = 'reader_to_reader'.
//
// Algorithm:
//   1. Find all users who have a `work_complete` UserSignal for the given work.
//   2. Find all other works those same users also completed.
//   3. Score each co-completed work as: overlap / completers_of_target
//      (i.e. what fraction of people who finished THIS work also finished THAT work).
//   4. Filter by MIN_COMPLETERS and MIN_SCORE thresholds then upsert both
//      directions into ContentSimilarity.
//
// This runs independently of collaborative signals (which are based on reading
// sessions, not completions). Both types are surfaced by getRelatedWorks().

import { prisma } from '@/lib/database/PrismaService'

const MIN_COMPLETERS = 3   // Minimum completers before we trust the signal
const MIN_SCORE = 0.08     // Minimum co-completion ratio to store
const MAX_CO_WORKS = 25    // Cap results per work to avoid table bloat

/**
 * Compute reader-to-reader similarity for a single work.
 * Safe to call repeatedly — uses upsert semantics.
 */
export async function computeReaderToReaderRecommendations(workId: string): Promise<{
  completers: number
  stored: number
}> {
  // 1. Users who completed this work
  const completers = await prisma.userSignal.findMany({
    where: { workId, signalType: 'work_complete' },
    select: { userId: true },
    distinct: ['userId'],
  })

  if (completers.length < MIN_COMPLETERS) {
    return { completers: completers.length, stored: 0 }
  }

  const completerIds = completers.map((c) => c.userId)

  // 2. Other works those completers also finished, sorted by co-completion count
  const coCompleted = await prisma.userSignal.groupBy({
    by: ['workId'],
    where: {
      userId: { in: completerIds },
      workId: { not: workId },
      signalType: 'work_complete',
    },
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
    take: MAX_CO_WORKS,
  })

  // 3. Score and upsert
  let stored = 0
  const totalCompleters = completers.length

  for (const coWork of coCompleted) {
    if (!coWork.workId) continue
    const score = coWork._count.userId / totalCompleters
    if (score < MIN_SCORE) continue

    const upsertOpts = (w1: string, w2: string) => ({
      where: {
        workId1_workId2_similarityType: {
          workId1: w1,
          workId2: w2,
          similarityType: 'reader_to_reader' as const,
        },
      },
      create: {
        workId1: w1,
        workId2: w2,
        similarityScore: score,
        similarityType: 'reader_to_reader',
      },
      update: { similarityScore: score, computedAt: new Date() },
    })

    await Promise.all([
      prisma.contentSimilarity.upsert(upsertOpts(workId, coWork.workId)),
      prisma.contentSimilarity.upsert(upsertOpts(coWork.workId, workId)),
    ])
    stored++
  }

  return { completers: totalCompleters, stored }
}

/**
 * Batch: run reader-to-reader computation for all published/ongoing works.
 * Returns a summary of what was processed.
 */
export async function computeAllReaderToReaderSignals(): Promise<{
  processed: number
  skipped: number
  totalStored: number
}> {
  const works = await prisma.work.findMany({
    where: { status: { in: ['published', 'ongoing'] } },
    select: { id: true },
  })

  let skipped = 0
  let totalStored = 0

  for (const work of works) {
    const result = await computeReaderToReaderRecommendations(work.id)
    if (result.completers === 0) {
      skipped++
    } else {
      totalStored += result.stored
    }
  }

  return { processed: works.length, skipped, totalStored }
}
