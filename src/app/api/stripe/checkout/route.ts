export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PaymentService } from '@/lib/payment'
import { getPremiumEnabled } from '@/lib/settings'
import { logMonetizationError, logMonetizationInfo } from '@/lib/observability/monetization-logger'

export async function POST(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    logMonetizationInfo('stripe_checkout_unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const premiumEnabled = await getPremiumEnabled()
  if (!premiumEnabled) {
    logMonetizationInfo('stripe_checkout_rejected_feature_disabled', { userId: session.user.id })
    return NextResponse.json({ error: 'Premium subscriptions are not available yet' }, { status: 503 })
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    logMonetizationError('stripe_checkout_misconfigured', { userId: session.user.id })
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  try {
    const { url } = await PaymentService.createCheckoutSession(session.user.id)
    logMonetizationInfo('stripe_checkout_session_created', { userId: session.user.id })
    return NextResponse.json({ url })
  } catch (error) {
    logMonetizationError('stripe_checkout_failed', {
      userId: session.user.id,
      error: error instanceof Error ? error.message : 'Unknown checkout error',
    })
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
