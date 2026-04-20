export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/database/PrismaService'
import { logMonetizationError, logMonetizationInfo, logMonetizationWarn } from '@/lib/observability/monetization-logger'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    logMonetizationError('stripe_webhook_misconfigured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    logMonetizationWarn('stripe_webhook_invalid_signature', {
      error: err instanceof Error ? err.message : 'Invalid signature',
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency guard: Stripe can retry the same event multiple times.
  const existing = await prisma.stripeEventLog.findUnique({
    where: { eventId: event.id },
    select: { id: true },
  })
  if (existing) {
    logMonetizationInfo('stripe_webhook_duplicate_skipped', { eventId: event.id, eventType: event.type })
    return NextResponse.json({ received: true, duplicate: true })
  }

  let logId: string | null = null
  try {
    const log = await prisma.stripeEventLog.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        status: 'running',
      },
      select: { id: true },
    })
    logId = log.id
  } catch (error) {
    // Race condition fallback: duplicate insert from parallel retry.
    const duplicate = await prisma.stripeEventLog.findUnique({
      where: { eventId: event.id },
      select: { id: true },
    })
    if (duplicate) {
      logMonetizationInfo('stripe_webhook_duplicate_race_skipped', {
        eventId: event.id,
        eventType: event.type,
      })
      return NextResponse.json({ received: true, duplicate: true })
    }
    logMonetizationError('stripe_webhook_event_log_create_failed', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Unknown log create failure',
    })
    return NextResponse.json({ error: 'Webhook event logging failed' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (userId && session.subscription) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPremium: true,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { isPremium: false, stripeSubscriptionId: null },
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const premiumStatuses = new Set(['active', 'trialing'])
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { isPremium: premiumStatuses.has(sub.status) },
        })
        break
      }

      case 'invoice.payment_failed': {
        // stripe v19: `subscription` moved to `parent.subscription_details.subscription`
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        if (invoice.subscription) {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { isPremium: false },
          })
        }
        break
      }
    }

    if (logId) {
      await prisma.stripeEventLog.update({
        where: { id: logId },
        data: {
          status: 'completed',
          processedAt: new Date(),
        },
      })
    }
    logMonetizationInfo('stripe_webhook_processed', { eventId: event.id, eventType: event.type })
  } catch (error) {
    if (logId) {
      await prisma.stripeEventLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          processedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown webhook error',
        },
      })
    }
    logMonetizationError('stripe_webhook_handler_failed', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Unknown webhook error',
    })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
