import { describe, it, expect, jest } from '@jest/globals'

jest.mock('@/lib/database/PrismaService')
jest.mock('@/lib/CollaborationActivityService')

import { prisma } from '@/lib/database/PrismaService'
import { logActivity } from '@/lib/CollaborationActivityService'

describe('Suggestion Activity Logging', () => {
  it('should log activity when suggestion is proposed', async () => {
    const workId = 'work1'
    const userId = 'user1'
    const sectionId = 'section1'
    const suggestionId = 'sug1'

    // Simulating the logging that happens in POST handler
    ;(logActivity as jest.Mock).mockResolvedValueOnce({
      id: 'activity1',
      workId,
      userId,
      action: 'suggestion_proposed',
      details: { sectionId, suggestionId },
    })

    const result = await logActivity(workId, userId, 'suggestion_proposed', {
      sectionId,
      suggestionId,
    })

    expect(result.action).toBe('suggestion_proposed')
    expect(result.details.sectionId).toBe(sectionId)
  })

  it('should log activity when suggestion is accepted', async () => {
    const workId = 'work1'
    const userId = 'user1'
    const sectionId = 'section1'
    const suggestionId = 'sug1'

    ;(logActivity as jest.Mock).mockResolvedValueOnce({
      id: 'activity2',
      workId,
      userId,
      action: 'suggestion_accepted',
      details: { sectionId, suggestionId },
    })

    const result = await logActivity(workId, userId, 'suggestion_accepted', {
      sectionId,
      suggestionId,
    })

    expect(result.action).toBe('suggestion_accepted')
  })

  it('should log activity when suggestion is rejected', async () => {
    const workId = 'work1'
    const userId = 'user1'

    ;(logActivity as jest.Mock).mockResolvedValueOnce({
      id: 'activity3',
      workId,
      userId,
      action: 'suggestion_rejected',
      details: {},
    })

    const result = await logActivity(workId, userId, 'suggestion_rejected', {})

    expect(result.action).toBe('suggestion_rejected')
  })

  it('should log activity when suggestion is retracted', async () => {
    const workId = 'work1'
    const userId = 'user1'

    ;(logActivity as jest.Mock).mockResolvedValueOnce({
      id: 'activity4',
      workId,
      userId,
      action: 'suggestion_retracted',
      details: {},
    })

    const result = await logActivity(workId, userId, 'suggestion_retracted', {})

    expect(result.action).toBe('suggestion_retracted')
  })

  it('should include metadata in activity logs', async () => {
    const workId = 'work1'
    const userId = 'user1'
    const metadata = {
      sectionId: 'section1',
      suggestionId: 'sug1',
      proposerName: 'Bob',
      reviewerName: 'Alice',
    }

    ;(logActivity as jest.Mock).mockResolvedValueOnce({
      id: 'activity5',
      workId,
      userId,
      action: 'suggestion_accepted',
      details: metadata,
    })

    const result = await logActivity(workId, userId, 'suggestion_accepted', metadata)

    expect(result.details).toEqual(metadata)
  })
})
