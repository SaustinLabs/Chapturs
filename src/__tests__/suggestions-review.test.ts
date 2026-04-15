import { describe, it, expect, beforeAll, jest } from '@jest/globals'
import { createMocks } from 'node-mocks-http'

jest.mock('@/lib/database/PrismaService')
jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/resolveDbUserId', () => ({ resolveDbUserId: jest.fn() }))
jest.mock('@/lib/chapterLockStore', () => ({
  chapterLockStore: {
    getChapterLock: jest.fn(),
    acquireChapterLock: jest.fn(),
  },
}))

import { PATCH } from '@/app/api/works/[id]/sections/[sectionId]/suggestions/[suggestionId]/route'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

describe('/api/works/[id]/sections/[sectionId]/suggestions/[id] - PATCH', () => {
  const mockSession = { user: { id: 'user1', email: 'test@example.com' } }
  const workId = 'work1'
  const sectionId = 'section1'
  const suggestionId = 'suggestion1'
  const dbUserId = 'user1'

  beforeAll(() => {
    ;(auth as jest.Mock).mockResolvedValue(mockSession)
    ;(resolveDbUserId as jest.Mock).mockResolvedValue(dbUserId)
  })

  it('should return 401 when user is not authenticated', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce(null)

    const { req, res } = createMocks({
      method: 'PATCH',
      body: { status: 'accepted' },
    })

    await PATCH(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 403 when user does not have publish permission', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: 'otherUser' },
      collaborators: [
        { userId: dbUserId, permissions: JSON.stringify({ canEdit: true, canPublish: false }) },
      ],
    })

    const { req, res } = createMocks({
      method: 'PATCH',
      body: { status: 'accepted' },
    })

    await PATCH(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(403)
  })

  it('should return 404 when suggestion does not exist', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
    })

    ;(prisma.sectionEditSuggestion.findUnique as jest.Mock).mockResolvedValueOnce(null)

    const { req, res } = createMocks({
      method: 'PATCH',
      body: { status: 'accepted' },
    })

    await PATCH(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(404)
  })

  it('should return 400 when suggestion is not pending', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
    })

    ;(prisma.sectionEditSuggestion.findUnique as jest.Mock).mockResolvedValueOnce({
      id: suggestionId,
      status: 'accepted',
    })

    const { req, res } = createMocks({
      method: 'PATCH',
      body: { status: 'rejected' },
    })

    await PATCH(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(400)
  })

  it('should accept a pending suggestion and update section content', async () => {
    const updatedSuggestion = {
      id: suggestionId,
      status: 'accepted',
      proposedContent: 'updated content',
      reviewedById: dbUserId,
      reviewedAt: new Date(),
    }

    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
    })

    ;(prisma.sectionEditSuggestion.findUnique as jest.Mock).mockResolvedValueOnce({
      id: suggestionId,
      status: 'pending',
      proposedContent: 'updated content',
    })

    ;(prisma.section.update as jest.Mock).mockResolvedValueOnce({
      id: sectionId,
      content: 'updated content',
    })

    ;(prisma.sectionEditSuggestion.update as jest.Mock).mockResolvedValueOnce(updatedSuggestion)

    const { req, res } = createMocks({
      method: 'PATCH',
      body: { status: 'accepted', authorComment: 'Looks good' },
    })

    await PATCH(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(200)
    expect(prisma.section.update as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: 'updated content',
        }),
      })
    )
  })

  it('should reject a pending suggestion without updating section content', async () => {
    const updatedSuggestion = {
      id: suggestionId,
      status: 'rejected',
      reviewedById: dbUserId,
      reviewedAt: new Date(),
    }

    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
    })

    ;(prisma.sectionEditSuggestion.findUnique as jest.Mock).mockResolvedValueOnce({
      id: suggestionId,
      status: 'pending',
    })

    ;(prisma.sectionEditSuggestion.update as jest.Mock).mockResolvedValueOnce(updatedSuggestion)

    const { req, res } = createMocks({
      method: 'PATCH',
      body: { status: 'rejected', authorComment: 'Needs revision' },
    })

    await PATCH(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(200)
    expect(prisma.section.update as jest.Mock).not.toHaveBeenCalled()
  })
})
