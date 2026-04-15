import { describe, it, expect, beforeAll, jest } from '@jest/globals'
import { createMocks } from 'node-mocks-http'

jest.mock('@/lib/database/PrismaService')
jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/resolveDbUserId', () => ({ resolveDbUserId: jest.fn() }))

import { DELETE } from '@/app/api/works/[id]/sections/[sectionId]/suggestions/[suggestionId]/route'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

describe('/api/works/[id]/sections/[sectionId]/suggestions/[id] - DELETE', () => {
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

    const { req, res } = createMocks({ method: 'DELETE' })

    await DELETE(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 404 when suggestion does not exist', async () => {
    ;(prisma.sectionEditSuggestion.findUnique as jest.Mock).mockResolvedValueOnce(null)

    const { req, res } = createMocks({ method: 'DELETE' })

    await DELETE(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(404)
  })

  it('should return 403 when user is not the proposer', async () => {
    ;(prisma.sectionEditSuggestion.findUnique as jest.Mock).mockResolvedValueOnce({
      id: suggestionId,
      proposedById: 'otherUser',
      status: 'pending',
    })

    const { req, res } = createMocks({ method: 'DELETE' })

    await DELETE(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(403)
  })

  it('should return 400 when suggestion is not pending', async () => {
    ;(prisma.sectionEditSuggestion.findUnique as jest.Mock).mockResolvedValueOnce({
      id: suggestionId,
      proposedById: dbUserId,
      status: 'accepted',
    })

    const { req, res } = createMocks({ method: 'DELETE' })

    await DELETE(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(400)
  })

  it('should retract a pending suggestion owned by the user', async () => {
    ;(prisma.sectionEditSuggestion.findUnique as jest.Mock).mockResolvedValueOnce({
      id: suggestionId,
      proposedById: dbUserId,
      status: 'pending',
      workId,
    })

    ;(prisma.sectionEditSuggestion.update as jest.Mock).mockResolvedValueOnce({
      id: suggestionId,
      status: 'retracted',
    })

    const { req, res } = createMocks({ method: 'DELETE' })

    await DELETE(req as any, {
      params: Promise.resolve({ id: workId, sectionId, suggestionId }),
    })

    expect(res._getStatusCode()).toBe(204)
    expect(prisma.sectionEditSuggestion.update as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'retracted' },
      })
    )
  })
})
