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
      data: { userId, eventType, points, sourceId: sourceId ?? null, metadata },
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
