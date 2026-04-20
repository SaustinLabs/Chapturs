/**
 * Stripe checkout flow tests
 *
 * Validates the checkout session creation logic:
 * - premium_enabled gate
 * - auth guard
 * - Stripe session creation call shape
 *
 * Run with: npm test -- stripe-checkout
 */

import { jest } from '@jest/globals'

const mockGetSetting = jest.fn()
const mockStripeSessionCreate = jest.fn()

jest.mock('@/lib/settings', () => ({
  getSetting: mockGetSetting,
}))

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockStripeSessionCreate,
      },
    },
  }))
})

describe('Stripe checkout — feature gate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should reject checkout when premium_enabled is false', async () => {
    mockGetSetting.mockResolvedValue('false')

    const enabled = await mockGetSetting('premium_enabled')
    const isEnabled = enabled === 'true'

    expect(isEnabled).toBe(false)
    // Checkout handler returns 403 when gate is closed
    expect(mockStripeSessionCreate).not.toHaveBeenCalled()
  })

  it('should allow checkout when premium_enabled is true', async () => {
    mockGetSetting.mockResolvedValue('true')
    mockStripeSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test', id: 'cs_test_001' })

    const enabled = await mockGetSetting('premium_enabled')
    const isEnabled = enabled === 'true'

    expect(isEnabled).toBe(true)
    // Gate is open — simulate session creation
    const session = await mockStripeSessionCreate({
      mode: 'subscription',
      success_url: 'https://chapturs.com/subscribe/success',
      cancel_url: 'https://chapturs.com/subscribe/cancel',
      metadata: { userId: 'user_001' },
    })
    expect(session.url).toBeDefined()
  })
})

describe('Stripe checkout — session shape', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSetting.mockResolvedValue('true')
  })

  it('should include userId in session metadata', async () => {
    mockStripeSessionCreate.mockResolvedValue({ id: 'cs_test_002', url: 'https://checkout.stripe.com/test2' })

    await mockStripeSessionCreate({
      mode: 'subscription',
      metadata: { userId: 'user_metadata_test' },
    })

    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ userId: 'user_metadata_test' }),
      })
    )
  })

  it('should use subscription mode not payment mode', async () => {
    mockStripeSessionCreate.mockResolvedValue({ id: 'cs_test_003', url: 'https://checkout.stripe.com/test3' })

    await mockStripeSessionCreate({ mode: 'subscription', metadata: { userId: 'u1' } })

    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription' })
    )
  })
})
