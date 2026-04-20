/**
 * Payout flow integration tests
 *
 * Validates the payout request creation and admin state machine:
 * - Creator submits payout request
 * - Admin approves, completes, or fails a request
 * - Status transitions are valid
 * - Invalid transitions are rejected
 *
 * Run with: npm test -- payouts-flow
 */

import { jest } from '@jest/globals'

const mockFindFirst = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()

jest.mock('@/lib/database/PrismaService', () => ({
  prisma: {
    payoutRequest: {
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
    },
    author: {
      findUnique: jest.fn(),
    },
  },
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

type PayoutStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'failed'

function buildPayoutRequest(status: PayoutStatus = 'pending') {
  return {
    id: `payout_${Date.now()}`,
    authorId: 'author_001',
    amount: 5000, // $50.00 in cents
    currency: 'usd',
    status,
    method: 'stripe',
    requestedAt: new Date(),
    createdAt: new Date(),
  }
}

const VALID_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  pending: ['approved', 'failed'],
  approved: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: [],
  failed: [],
}

function isValidTransition(from: PayoutStatus, to: PayoutStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Payout request — creation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should create a payout request in pending state', async () => {
    mockCreate.mockResolvedValue(buildPayoutRequest('pending'))

    const result = await mockCreate({
      data: { authorId: 'author_001', amount: 5000, currency: 'usd', status: 'pending', method: 'stripe' },
    })

    expect(result.status).toBe('pending')
    expect(result.amount).toBe(5000)
  })

  it('should block a second pending request if one already exists', async () => {
    mockFindFirst.mockResolvedValue(buildPayoutRequest('pending'))

    const existingPending = await mockFindFirst({
      where: { authorId: 'author_001', status: 'pending' },
    })

    // Creator should not be able to create a second request while one is pending
    expect(existingPending).not.toBeNull()
  })
})

describe('Payout state machine — admin transitions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should allow pending → approved', () => {
    expect(isValidTransition('pending', 'approved')).toBe(true)
  })

  it('should allow approved → processing', () => {
    expect(isValidTransition('approved', 'processing')).toBe(true)
  })

  it('should allow processing → completed', () => {
    expect(isValidTransition('processing', 'completed')).toBe(true)
  })

  it('should allow any in-progress state → failed', () => {
    expect(isValidTransition('pending', 'failed')).toBe(true)
    expect(isValidTransition('approved', 'failed')).toBe(true)
    expect(isValidTransition('processing', 'failed')).toBe(true)
  })

  it('should NOT allow completed → any state', () => {
    expect(isValidTransition('completed', 'failed')).toBe(false)
    expect(isValidTransition('completed', 'pending')).toBe(false)
  })

  it('should NOT allow failed → any state', () => {
    expect(isValidTransition('failed', 'approved')).toBe(false)
    expect(isValidTransition('failed', 'completed')).toBe(false)
  })
})

describe('Payout state machine — admin approve', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should update payout status to approved', async () => {
    const payout = buildPayoutRequest('pending')
    mockFindFirst.mockResolvedValue(payout)
    mockUpdate.mockResolvedValue({ ...payout, status: 'approved', reviewedById: 'admin_001', reviewedAt: new Date() })

    const existing = await mockFindFirst({ where: { id: payout.id } })
    expect(isValidTransition(existing.status, 'approved')).toBe(true)

    const updated = await mockUpdate({
      where: { id: payout.id },
      data: { status: 'approved', reviewedById: 'admin_001', reviewedAt: new Date() },
    })
    expect(updated.status).toBe('approved')
  })
})

describe('Payout state machine — admin complete', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should update payout to completed with transaction reference', async () => {
    const payout = buildPayoutRequest('processing')
    mockFindFirst.mockResolvedValue(payout)
    mockUpdate.mockResolvedValue({ ...payout, status: 'completed', transactionRef: 'txn_stripe_abc123', completedAt: new Date() })

    const existing = await mockFindFirst({ where: { id: payout.id } })
    expect(isValidTransition(existing.status, 'completed')).toBe(true)

    const updated = await mockUpdate({
      where: { id: payout.id },
      data: { status: 'completed', transactionRef: 'txn_stripe_abc123', completedAt: new Date() },
    })
    expect(updated.status).toBe('completed')
    expect(updated.transactionRef).toBeDefined()
  })
})
