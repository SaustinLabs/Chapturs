jest.mock('@/lib/database/PrismaService', () => ({
  prisma: {
    pointsLedger: {
      findFirst: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    achievement: {
      findUnique: jest.fn(),
    },
    userAchievement: {
      upsert: jest.fn(),
    },
    levelTier: {
      findFirst: jest.fn(),
    },
    section: {
      count: jest.fn(),
    },
  },
}))

import {
  POINTS_EVENT_TYPE,
  awardAchievement,
  awardPoints,
  checkAndAwardFoundingCreator,
} from '../lib/achievements/points'

const { prisma } = jest.requireMock('@/lib/database/PrismaService') as {
  prisma: {
    pointsLedger: {
      findFirst: jest.Mock
      create: jest.Mock
      aggregate: jest.Mock
    }
    achievement: {
      findUnique: jest.Mock
    }
    userAchievement: {
      upsert: jest.Mock
    }
    levelTier: {
      findFirst: jest.Mock
    }
    section: {
      count: jest.Mock
    }
  }
}

describe('points pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    prisma.pointsLedger.findFirst.mockResolvedValue(null)
    prisma.pointsLedger.create.mockResolvedValue({ id: 'ledger_1' })
    prisma.pointsLedger.aggregate.mockResolvedValue({ _sum: { points: 10 } })

    prisma.achievement.findUnique.mockResolvedValue({
      id: 'ach_1',
      key: 'founding_creator',
      isActive: true,
      pointValue: 25,
    })
    prisma.userAchievement.upsert.mockResolvedValue({
      id: 'ua_1',
      userId: 'user_1',
      achievementId: 'ach_1',
      achievement: {
        id: 'ach_1',
        key: 'founding_creator',
      },
    })

    prisma.section.count.mockResolvedValue(50)
  })

  it('awardPoints is idempotent for same userId + eventType + sourceId', async () => {
    const userId = 'user_1'
    const eventType = POINTS_EVENT_TYPE.COMMENT
    const sourceId = 'comment_1'

    prisma.pointsLedger.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'ledger_existing' })

    await awardPoints(userId, eventType, 5, sourceId)
    await awardPoints(userId, eventType, 5, sourceId)

    expect(prisma.pointsLedger.create).toHaveBeenCalledTimes(1)
  })

  it('awardPoints returns updated total points for the user', async () => {
    prisma.pointsLedger.aggregate.mockResolvedValue({ _sum: { points: 42 } })

    const total = await awardPoints('user_1', POINTS_EVENT_TYPE.FIRST_READ, 1, 'chapter_1')

    expect(total).toBe(42)
  })

  it('awardAchievement skips inactive achievements', async () => {
    prisma.achievement.findUnique.mockResolvedValue({
      id: 'ach_inactive',
      key: 'founding_creator',
      isActive: false,
      pointValue: 25,
    })

    const result = await awardAchievement('user_1', 'founding_creator', 'chapter_1')

    expect(result).toBeNull()
    expect(prisma.userAchievement.upsert).not.toHaveBeenCalled()
    expect(prisma.pointsLedger.create).not.toHaveBeenCalled()
  })

  it('awardAchievement is idempotent across repeated calls (no duplicate points events)', async () => {
    prisma.pointsLedger.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing_achievement_points' })

    await awardAchievement('user_1', 'founding_creator', 'chapter_1')
    await awardAchievement('user_1', 'founding_creator', 'chapter_1')

    expect(prisma.userAchievement.upsert).toHaveBeenCalledTimes(2)
    expect(prisma.pointsLedger.create).toHaveBeenCalledTimes(1)
  })

  it('checkAndAwardFoundingCreator returns null when published chapter count is greater than 100', async () => {
    prisma.section.count.mockResolvedValue(101)

    const result = await checkAndAwardFoundingCreator('user_1', 'chapter_1')

    expect(result).toBeNull()
    expect(prisma.achievement.findUnique).not.toHaveBeenCalled()
  })

  it("checkAndAwardFoundingCreator awards 'founding_creator' when published chapter count is 100 or less", async () => {
    prisma.section.count.mockResolvedValue(100)

    await checkAndAwardFoundingCreator('user_1', 'chapter_1')

    expect(prisma.achievement.findUnique).toHaveBeenCalledWith({
      where: { key: 'founding_creator' },
    })
  })
})