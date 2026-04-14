/**
 * Unit tests for src/lib/achievements/points.ts
 *
 * The implementation is being created in parallel (Rusty / backend).
 * These tests define the behavioral contract — the implementation must satisfy them.
 *
 * Prisma is mocked so tests remain fast and isolated — no DB connection required.
 *
 * Assumptions about Prisma model names used inside points.ts:
 *   pointEvent       — idempotency log for awarded points (userId + eventType + sourceId)
 *   userAchievement  — awarded achievement records (userId + achievementKey)
 *   userPoints       — running point totals per user
 *   section          — chapters (used to count published chapters for founding-creator check)
 *
 * If Rusty uses different model names, update the mock and imports below.
 */

// ---------------------------------------------------------------------------
// Prisma mock — declared BEFORE any imports so jest.mock hoisting works
// ---------------------------------------------------------------------------
jest.mock('../lib/database/PrismaService', () => ({
  prisma: {
    pointEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    userAchievement: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    userPoints: {
      upsert: jest.fn(),
    },
    section: {
      count: jest.fn(),
    },
  },
}))

import {
  POINTS_EVENT_TYPE,
  awardPoints,
  awardAchievement,
  getUserLevel,
  checkAndAwardFoundingCreator,
} from '../lib/achievements/points'

// Access the mocked prisma after hoisting resolves
const { prisma } = require('../lib/database/PrismaService')

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user_test_001'
const CHAPTER_ID = 'chapter_test_001'

// ---------------------------------------------------------------------------
// POINTS_EVENT_TYPE
// ---------------------------------------------------------------------------

describe('POINTS_EVENT_TYPE', () => {
  it('is a non-empty object whose values are all strings', () => {
    expect(typeof POINTS_EVENT_TYPE).toBe('object')
    expect(POINTS_EVENT_TYPE).not.toBeNull()
    expect(Object.keys(POINTS_EVENT_TYPE).length).toBeGreaterThan(0)
    for (const val of Object.values(POINTS_EVENT_TYPE)) {
      expect(typeof val).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// awardPoints
// ---------------------------------------------------------------------------

describe('awardPoints', () => {
  // Use the first defined event type so the test is independent of key names
  let someEventType: string

  beforeAll(() => {
    someEventType = Object.values(POINTS_EVENT_TYPE)[0] as string
  })

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.pointEvent.create.mockResolvedValue({ id: 'pe_1', userId: USER_ID })
    prisma.userPoints.upsert.mockResolvedValue({ userId: USER_ID, totalPoints: 100 })
  })

  it('creates a point event on the happy path (no sourceId)', async () => {
    prisma.pointEvent.findFirst.mockResolvedValue(null) // No previous record

    await awardPoints(USER_ID, someEventType, 50)

    expect(prisma.pointEvent.create).toHaveBeenCalledTimes(1)
    expect(prisma.pointEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          eventType: someEventType,
          points: 50,
        }),
      })
    )
  })

  it('passes sourceId and metadata through to the created record when provided', async () => {
    prisma.pointEvent.findFirst.mockResolvedValue(null)

    const meta = { reason: 'test' }
    await awardPoints(USER_ID, someEventType, 50, CHAPTER_ID, meta)

    expect(prisma.pointEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          sourceId: CHAPTER_ID,
        }),
      })
    )
  })

  it('is idempotent — a duplicate call with the same sourceId does NOT create a second record', async () => {
    prisma.pointEvent.findFirst
      .mockResolvedValueOnce(null)              // first call — no existing record
      .mockResolvedValueOnce({ id: 'pe_1' })    // second call — deduplication hit

    await awardPoints(USER_ID, someEventType, 50, CHAPTER_ID)
    await awardPoints(USER_ID, someEventType, 50, CHAPTER_ID)

    expect(prisma.pointEvent.create).toHaveBeenCalledTimes(1)
  })

  it('updates the user point total after successfully awarding points', async () => {
    prisma.pointEvent.findFirst.mockResolvedValue(null)

    await awardPoints(USER_ID, someEventType, 75)

    expect(prisma.userPoints.upsert).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// awardAchievement
// ---------------------------------------------------------------------------

describe('awardAchievement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prisma.userAchievement.create.mockResolvedValue({ id: 'ua_1', userId: USER_ID })
    prisma.pointEvent.findFirst.mockResolvedValue(null)
    prisma.pointEvent.create.mockResolvedValue({ id: 'pe_ach' })
    prisma.userPoints.upsert.mockResolvedValue({ userId: USER_ID, totalPoints: 200 })
  })

  it('creates a userAchievement record on the happy path', async () => {
    prisma.userAchievement.findFirst.mockResolvedValue(null)

    await awardAchievement(USER_ID, 'first_chapter')

    expect(prisma.userAchievement.create).toHaveBeenCalledTimes(1)
    expect(prisma.userAchievement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          achievementKey: 'first_chapter',
        }),
      })
    )
  })

  it('also awards points as a by-product of granting the achievement', async () => {
    prisma.userAchievement.findFirst.mockResolvedValue(null)

    await awardAchievement(USER_ID, 'first_chapter')

    // Internal awardPoints call must have created at least one point event
    expect(prisma.pointEvent.create).toHaveBeenCalledTimes(1)
  })

  it('passes an optional sourceId to the created record when supplied', async () => {
    prisma.userAchievement.findFirst.mockResolvedValue(null)

    await awardAchievement(USER_ID, 'first_chapter', CHAPTER_ID)

    expect(prisma.userAchievement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceId: CHAPTER_ID,
        }),
      })
    )
  })

  it('is idempotent — second call with the same achievement key is a no-op', async () => {
    prisma.userAchievement.findFirst
      .mockResolvedValueOnce(null)                                    // first call — not yet awarded
      .mockResolvedValueOnce({ id: 'ua_1', achievementKey: 'first_chapter' }) // second call — already exists

    await awardAchievement(USER_ID, 'first_chapter')
    await awardAchievement(USER_ID, 'first_chapter')

    expect(prisma.userAchievement.create).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// getUserLevel  (pure function — no Prisma calls expected)
// ---------------------------------------------------------------------------

/**
 * Level tier boundaries assumed (adjust if Rusty uses different values):
 *
 *   null       :    0 points  (no tier achieved yet)
 *   Level 1+   :    1+ points (entry tier, e.g. "Newcomer" / "Bronze")
 *   Level 2+   :  500+ points (mid tier, e.g. "Silver")
 *   Level 3+   : 2000+ points (high tier, e.g. "Gold")
 *   Level 4+   : 10000+ points (top tier, e.g. "Platinum")
 */
describe('getUserLevel', () => {
  it('returns null for 0 total points (no tier reached)', () => {
    expect(getUserLevel(0)).toBeNull()
  })

  it('returns a non-null tier object for positive point values', () => {
    const tier = getUserLevel(100)
    expect(tier).not.toBeNull()
  })

  it('returned tier object has the expected shape (level, title, badge, minPoints)', () => {
    const tier = getUserLevel(100)
    expect(tier).toMatchObject({
      level: expect.any(Number),
      title: expect.any(String),
      badge: expect.any(String),
      minPoints: expect.any(Number),
    })
  })

  it('returns a higher level number for a higher point total', async () => {
    const low = await getUserLevel(100)
    const high = await getUserLevel(2000)
    expect(high).not.toBeNull()
    expect(low).not.toBeNull()
    expect((high as NonNullable<Awaited<ReturnType<typeof getUserLevel>>>).level)
      .toBeGreaterThan((low as NonNullable<Awaited<ReturnType<typeof getUserLevel>>>).level)
  })

  it('is deterministic — same input always returns an equivalent result', () => {
    expect(getUserLevel(500)).toEqual(getUserLevel(500))
  })

  it('handles very large point totals without throwing', () => {
    expect(() => getUserLevel(999999)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// checkAndAwardFoundingCreator
// ---------------------------------------------------------------------------

describe('checkAndAwardFoundingCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prisma.userAchievement.create.mockResolvedValue({ id: 'ua_fc', userId: USER_ID })
    // Achievement not previously granted
    prisma.userAchievement.findFirst.mockResolvedValue(null)
    prisma.pointEvent.findFirst.mockResolvedValue(null)
    prisma.pointEvent.create.mockResolvedValue({ id: 'pe_fc' })
    prisma.userPoints.upsert.mockResolvedValue({ userId: USER_ID, totalPoints: 500 })
  })

  it('awards the founding creator achievement when platform chapter count is well below 100', async () => {
    prisma.section.count.mockResolvedValue(42)

    await checkAndAwardFoundingCreator(USER_ID, CHAPTER_ID)

    expect(prisma.userAchievement.create).toHaveBeenCalledTimes(1)
  })

  it('awards the achievement at the exact boundary of 100 published chapters (≤100)', async () => {
    prisma.section.count.mockResolvedValue(100)

    await checkAndAwardFoundingCreator(USER_ID, CHAPTER_ID)

    expect(prisma.userAchievement.create).toHaveBeenCalledTimes(1)
  })

  it('does NOT award when the platform chapter count is 101 (just over the cap)', async () => {
    prisma.section.count.mockResolvedValue(101)

    await checkAndAwardFoundingCreator(USER_ID, CHAPTER_ID)

    expect(prisma.userAchievement.create).not.toHaveBeenCalled()
  })

  it('does NOT award when the platform chapter count is far above 100', async () => {
    prisma.section.count.mockResolvedValue(5000)

    await checkAndAwardFoundingCreator(USER_ID, CHAPTER_ID)

    expect(prisma.userAchievement.create).not.toHaveBeenCalled()
  })

  it('counts only published sections when evaluating the chapter threshold', async () => {
    prisma.section.count.mockResolvedValue(50)

    await checkAndAwardFoundingCreator(USER_ID, CHAPTER_ID)

    expect(prisma.section.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'published' }),
      })
    )
  })
})
