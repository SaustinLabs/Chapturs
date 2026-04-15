import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { createMocks } from 'node-mocks-http'

// Mock Prisma
jest.mock('@/lib/database/PrismaService')
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))
jest.mock('@/lib/resolveDbUserId', () => ({
  resolveDbUserId: jest.fn(),
}))

import { POST } from '@/app/api/works/[id]/sections/[sectionId]/suggestions/route'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

describe('/api/works/[id]/sections/[sectionId]/suggestions - POST', () => {
  const mockSession = { user: { id: 'user1', name: 'Test User', email: 'test@example.com' } }
  const workId = 'work1'
  const sectionId = 'section1'
  const dbUserId = 'user1'

  beforeAll(() => {
    ;(auth as jest.Mock).mockResolvedValue(mockSession)
    ;(resolveDbUserId as jest.Mock).mockResolvedValue(dbUserId)
  })

  it('should return 401 when user is not authenticated', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce(null)

    const { req, res } = createMocks({
      method: 'POST',
      body: { proposedContent: 'new content' },
    })

    await POST(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 403 when user cannot edit', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: 'otherUser' },
      collaborators: [],
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: { proposedContent: 'new content' },
    })

    await POST(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(403)
  })

  it('should return 400 when proposedContent is missing', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
      collaborators: [],
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    })

    await POST(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 403 when user has publish permission (proposers should not have publish)', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: 'otherUser' },
      collaborators: [
        {
          permissions: JSON.stringify({ canEdit: true, canPublish: true }),
        },
      ],
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: { proposedContent: 'new content' },
    })

    await POST(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(403)
  })

  it('should create suggestion when user has edit but not publish permission', async () => {
    const suggestionsData = {
      id: 'suggestion1',
      workId,
      sectionId,
      proposedById: dbUserId,
      proposedContent: 'new content',
      proposerComment: 'This looks better',
      status: 'pending',
      createdAt: new Date(),
      proposer: { id: dbUserId, username: 'testuser', displayName: 'Test User' },
    }

    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: 'otherUser' },
      collaborators: [
        {
          permissions: JSON.stringify({ canEdit: true, canPublish: false }),
        },
      ],
    })

    ;(prisma.sectionEditSuggestion.create as jest.Mock).mockResolvedValueOnce(suggestionsData)

    const { req, res } = createMocks({
      method: 'POST',
      body: { proposedContent: 'new content', proposerComment: 'This looks better' },
    })

    await POST(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(201)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.id).toBe('suggestion1')
    expect(jsonData.status).toBe('pending')
  })

  it('should allow author to propose suggestions', async () => {
    const suggestionsData = {
      id: 'suggestion1',
      workId,
      sectionId,
      proposedById: dbUserId,
      proposedContent: 'new content',
      status: 'pending',
      createdAt: new Date(),
      proposer: { id: dbUserId, username: 'author', displayName: 'Author' },
    }

    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
      collaborators: [],
    })

    ;(prisma.sectionEditSuggestion.create as jest.Mock).mockResolvedValueOnce(suggestionsData)

    const { req, res } = createMocks({
      method: 'POST',
      body: { proposedContent: 'new content' },
    })

    await POST(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(201)
  })
})
