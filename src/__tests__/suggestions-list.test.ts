import { describe, it, expect, beforeAll, jest } from '@jest/globals'
import { createMocks } from 'node-mocks-http'

jest.mock('@/lib/database/PrismaService')
jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/resolveDbUserId', () => ({ resolveDbUserId: jest.fn() }))

import { GET } from '@/app/api/works/[id]/sections/[sectionId]/suggestions/route'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

describe('/api/works/[id]/sections/[sectionId]/suggestions - GET', () => {
  const mockSession = { user: { id: 'user1', email: 'test@example.com' } }
  const workId = 'work1'
  const sectionId = 'section1'
  const dbUserId = 'user1'

  beforeAll(() => {
    ;(auth as jest.Mock).mockResolvedValue(mockSession)
    ;(resolveDbUserId as jest.Mock).mockResolvedValue(dbUserId)
  })

  it('should return 401 when user is not authenticated', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce(null)

    const { req, res } = createMocks({ method: 'GET' })

    await GET(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 403 when user does not have edit permission', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: 'otherUser' },
      collaborators: [],
    })

    const { req, res } = createMocks({ method: 'GET' })

    await GET(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(403)
  })

  it('should list pending suggestions with default pagination', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
      collaborators: [],
    })

    const suggestions = [
      {
        id: 'sug1',
        sectionId,
        proposedContent: 'content1',
        status: 'pending',
        proposer: { username: 'user2' },
        createdAt: new Date(),
      },
      {
        id: 'sug2',
        sectionId,
        proposedContent: 'content2',
        status: 'pending',
        proposer: { username: 'user3' },
        createdAt: new Date(),
      },
    ]

    ;(prisma.sectionEditSuggestion.findMany as jest.Mock).mockResolvedValueOnce(suggestions)

    const { req, res } = createMocks({ method: 'GET' })

    await GET(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.length).toBe(2)
  })

  it('should filter by status parameter', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
      collaborators: [],
    })

    const suggestions = [
      {
        id: 'sug1',
        status: 'accepted',
        proposer: { username: 'user2' },
      },
    ]

    ;(prisma.sectionEditSuggestion.findMany as jest.Mock).mockResolvedValueOnce(suggestions)

    const { req, res } = createMocks({ method: 'GET', query: { status: 'accepted' } })

    await GET(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data[0].status).toBe('accepted')
  })

  it('should support pagination with take and skip', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
      collaborators: [],
    })

    const suggestion = { id: 'sug1', status: 'pending' }
    ;(prisma.sectionEditSuggestion.findMany as jest.Mock).mockResolvedValueOnce([suggestion])

    const { req, res } = createMocks({ method: 'GET', query: { take: '10', skip: '0' } })

    await GET(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(200)
    expect(prisma.sectionEditSuggestion.findMany as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 0,
      })
    )
  })

  it('should return empty array when no suggestions exist', async () => {
    ;(prisma.work.findUnique as jest.Mock).mockResolvedValueOnce({
      id: workId,
      author: { userId: dbUserId },
      collaborators: [],
    })

    ;(prisma.sectionEditSuggestion.findMany as jest.Mock).mockResolvedValueOnce([])

    const { req, res } = createMocks({ method: 'GET' })

    await GET(req as any, { params: Promise.resolve({ id: workId, sectionId }) })

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toEqual([])
  })
})
