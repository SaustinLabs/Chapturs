import { prisma } from '@/lib/database/PrismaService'

// ─── Event type registry ─────────────────────────────────────────────────────

export const POINTS_EVENT_TYPE = {
  CHAPTER_PUBLISHED:   'CHAPTER_PUBLISHED',
  FIRST_READ:          'FIRST_READ',
  COMMENT:             'COMMENT',
  GLOSSARY_ENTRY:      'GLOSSARY_ENTRY',
  CHARACTER_CREATED:   'CHARACTER_CREATED',
  FAN_TRANSLATION:     'FAN_TRANSLATION',
  FAN_AUDIOBOOK:       'FAN_AUDIOBOOK',
  FAN_ART_APPROVED:    'FAN_ART_APPROVED',
  COMMENT_FEATURED:    'COMMENT_FEATURED',
  SUBSCRIBER_GAINED:   'SUBSCRIBER_GAINED',
  ACHIEVEMENT_AWARDED: 'ACHIEVEMENT_AWARDED',
} as const

export type PointsEventType = (typeof POINTS_EVENT_TYPE)[keyof typeof POINTS_EVENT_TYPE]

// ─── Award points (idempotent) ────────────────────────────────────────────────
// Dedup key: userId + eventType + sourceId.
// If sourceId is omitted the dedup key is userId + eventType (one-time event).

export async function awardPoints(
  userId: string,
  eventType: string,
  points: number,
  sourceId?: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  const existing = await prisma.pointsLedger.findFirst({
    where: { userId, eventType, sourceId: sourceId ?? null },
  })

  if (!existing) {
    await prisma.pointsLedger.create({
      data: { userId, eventType, points, sourceId: sourceId ?? null, metadata } as any,
    })
  }

  const agg = await prisma.pointsLedger.aggregate({
    where: { userId },
    _sum: { points: true },
  })

  return agg._sum.points ?? 0
}

// ─── Award achievement (idempotent) ──────────────────────────────────────────
// Upsert on @@unique([userId, achievementId]) — safe to call multiple times.
// Also fires awardPoints for the achievement's pointValue.

export async function awardAchievement(
  userId: string,
  achievementKey: string,
  sourceId?: string
) {
  const achievement = await prisma.achievement.findUnique({
    where: { key: achievementKey },
  })

  if (!achievement || !achievement.isActive) return null

  const record = await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
    create: { userId, achievementId: achievement.id, sourceId },
    update: {}, // no-op if already exists
    include: { achievement: true },
  })

  if (achievement.pointValue > 0) {
    await awardPoints(
      userId,
      POINTS_EVENT_TYPE.ACHIEVEMENT_AWARDED,
      achievement.pointValue,
      achievement.id
    )
  }

  return record
}

// ─── Level lookup ─────────────────────────────────────────────────────────────

export async function getUserLevel(totalPoints: number) {
  return prisma.levelTier.findFirst({
    where: { minPoints: { lte: totalPoints } },
    orderBy: { minPoints: 'desc' },
  })
}

// ─── Founding Creator cohort badge (#100) ────────────────────────────────────
// Awarded on first chapter publish if the platform total published count is ≤ 100.
// Idempotent — safe to call on every publish; awardAchievement deduplicates.

export async function checkAndAwardFoundingCreator(userId: string, chapterId: string) {
  const totalPublished = await prisma.section.count({
    where: { status: 'published' },
  })

  if (totalPublished > 100) return null

  return awardAchievement(userId, 'founding_creator', chapterId)
}

// ─── Count-based milestone checker ──────────────────────────────────────────
// Checks if an author's count of entries (glossary, characters, chapters, etc.)
// has crossed a milestone threshold and awards the corresponding achievement.
// Idempotent — awardAchievement deduplicates.

type MilestoneDef = { threshold: number; achievementKey: string }

export async function checkAndAwardCountMilestone(
  userId: string,
  count: number,
  milestones: MilestoneDef[],
  sourceId?: string
): Promise<number> {
  let awarded = 0
  for (const m of milestones) {
    if (count >= m.threshold) {
      const result = await awardAchievement(userId, m.achievementKey, sourceId)
      if (result) awarded++
    }
  }
  return awarded
}

// ─── Glossary milestones (#102) ─────────────────────────────────────────────
const GLOSSARY_MILESTONES: MilestoneDef[] = [
  { threshold: 10, achievementKey: 'glossary_10' },
  { threshold: 25, achievementKey: 'glossary_25' },
  { threshold: 50, achievementKey: 'glossary_50' },
  { threshold: 100, achievementKey: 'glossary_100' },
]

export async function checkGlossaryMilestones(authorUserId: string, workId: string) {
  const count = await prisma.glossaryEntry.count({
    where: { work: { author: { userId: authorUserId } } },
  })
  return checkAndAwardCountMilestone(authorUserId, count, GLOSSARY_MILESTONES, workId)
}

// ─── Character milestones (#103) ────────────────────────────────────────────
const CHARACTER_MILESTONES: MilestoneDef[] = [
  { threshold: 25, achievementKey: 'characters_25' },
  { threshold: 50, achievementKey: 'characters_50' },
  { threshold: 100, achievementKey: 'characters_100' },
]

export async function checkCharacterMilestones(authorUserId: string, workId: string) {
  const count = await prisma.characterProfile.count({
    where: { work: { author: { userId: authorUserId } } },
  })
  return checkAndAwardCountMilestone(authorUserId, count, CHARACTER_MILESTONES, workId)
}

// ─── Chapter milestones ─────────────────────────────────────────────────────
const CHAPTER_MILESTONES: MilestoneDef[] = [
  { threshold: 1, achievementKey: 'first_chapter' },
  { threshold: 10, achievementKey: 'ten_chapters' },
]

export async function checkChapterMilestones(authorUserId: string, chapterId: string) {
  const count = await prisma.section.count({
    where: { work: { author: { userId: authorUserId } }, status: 'published' },
  })
  return checkAndAwardCountMilestone(authorUserId, count, CHAPTER_MILESTONES, chapterId)
}

// ─── First reader window (#101) ─────────────────────────────────────────────
// Records a 5-minute "first reader" window when a chapter is published.
// Readers who view the chapter within the window AND meet dwell/scroll
// requirements can claim the "first_reader" achievement.

export async function openFirstReaderWindow(chapterId: string): Promise<Date> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  // Store window expiry as chapter metadata — we use a simple approach:
  // update the section's existing metadata field. If that's not practical,
  // we could use a separate table. For now, we track via a points ledger entry
  // so the claim API can check timing.
  await prisma.pointsLedger.create({
    data: {
      userId: 'system',
      eventType: 'FIRST_READER_WINDOW_OPENED',
      points: 0,
      sourceId: chapterId,
      metadata: { expiresAt: expiresAt.toISOString() },
    } as any,
  })
  return expiresAt
}

export async function claimFirstReader(
  userId: string,
  chapterId: string,
  dwellMs: number,
  scrollPercent: number
): Promise<{ success: boolean; reason?: string }> {
  // Check if window exists and hasn't expired
  const windowRecord = await prisma.pointsLedger.findFirst({
    where: { eventType: 'FIRST_READER_WINDOW_OPENED', sourceId: chapterId },
    orderBy: { createdAt: 'desc' },
  })

  if (!windowRecord) {
    return { success: false, reason: 'No first reader window for this chapter' }
  }

  const metadata = windowRecord.metadata as any
  const expiresAt = metadata?.expiresAt ? new Date(metadata.expiresAt) : null
  if (!expiresAt || Date.now() > expiresAt.getTime()) {
    return { success: false, reason: 'First reader window has expired' }
  }

  // Check qualification: >= 60s dwell and >= 50% scroll
  if (dwellMs < 60_000) {
    return { success: false, reason: 'Minimum reading time not met (60s required)' }
  }
  if (scrollPercent < 50) {
    return { success: false, reason: 'Minimum scroll progress not met (50% required)' }
  }

  // Award the achievement and bonus points
  const achievement = await awardAchievement(userId, 'first_reader', chapterId)
  if (achievement) {
    await awardPoints(userId, POINTS_EVENT_TYPE.FIRST_READ, 15, chapterId)
  }

  return { success: true }
}
