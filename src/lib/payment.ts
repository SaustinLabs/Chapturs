import Stripe from 'stripe'

const BASE_URL = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'https://chapturs.com'

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export class PaymentService {
  static async createCheckoutSession(userId: string): Promise<{ url: string }> {
    const stripe = getStripe()
    if (!process.env.STRIPE_PRICE_ID) {
      throw new Error('STRIPE_PRICE_ID is not configured')
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: `${BASE_URL}/profile?premium=success`,
      cancel_url: `${BASE_URL}/profile?premium=canceled`,
      metadata: { userId },
    })

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL')
    }
    return { url: session.url }
  }

  static async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    const stripe = getStripe()
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
  }
}