# Monetization Launch Checklist

Use this before flipping `premium_enabled` to `true` in Admin → Settings.

## 1. Secrets & Environment

- [ ] `STRIPE_SECRET_KEY` set in GitHub Actions Secrets (prod key, not test)
- [ ] `STRIPE_PUBLISHABLE_KEY` set in GitHub Actions Secrets
- [ ] `STRIPE_WEBHOOK_SECRET` set in GitHub Actions Secrets (from Stripe Dashboard → Webhooks)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` confirmed in `.env.production` on VPS
- [ ] `ADMIN_SCHEDULER_SECRET` set in GitHub Actions Secrets (used by recommendation-refresh cron)

## 2. Stripe Dashboard Configuration

- [ ] Webhook endpoint registered: `https://chapturs.com/api/stripe/webhook`
- [ ] Webhook events enabled: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] At least one active Product + Price created in Stripe Dashboard for the subscription tier
- [ ] Product price IDs match what the checkout route expects (check `/api/stripe/checkout/route.ts`)

## 3. Local Webhook Verification

Run before deploying:

```powershell
# Install Stripe CLI if not already installed
# https://stripe.com/docs/stripe-cli

# Forward to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

Or use the provided PowerShell verification script:

```powershell
.\scripts\verify-stripe-webhook.ps1
```

## 4. Database State

- [ ] `prisma db push` run on production (or migration applied) — confirms `StripeEventLog`, payout audit fields, and `SiteSettings` rows exist
- [ ] SiteSettings row exists: `{ group: 'monetization', key: 'premium_enabled', value: 'false' }` (will flip to `'true'` at go-live)
- [ ] Confirm no orphaned `PayoutRequest` rows in state `processing` from failed runs

## 5. Admin Panel Checks

- [ ] Admin → Settings → Monetization: `premium_enabled` visible and set to `false`
- [ ] Admin → Payouts: page loads, shows empty queue or existing requests
- [ ] Admin → Stripe Events: page loads, shows recent `StripeEventLog` entries after test webhooks

## 6. Creator Side Checks

- [ ] Creator Hub → dashboard shows earnings section (even if $0)
- [ ] Creator can submit payout request without error (will be queued for admin)

## 7. Rollback Steps

If something goes wrong after go-live:

1. **Disable checkout immediately**: Admin → Settings → set `premium_enabled` to `false`. No redeploy needed — takes effect on next request.
2. **Disable webhook**: Stripe Dashboard → Webhooks → Disable endpoint. Prevents new events from being processed.
3. **Handle in-flight checkouts**: Query `StripeEventLog` for recent events with `status = 'pending'` and re-process or refund manually via Stripe Dashboard.
4. **Payout rollback**: Any `PayoutRequest` in `approved` or `processing` state can be moved to `failed` via Admin → Payouts → Fail button. Email notification is sent to creator.

## 8. Go-Live Sequence

1. Verify all checklist items above.
2. Run Stripe CLI forward + trigger test events. Confirm `StripeEventLog` entries appear.
3. Deploy current `main` to VPS (push to main or trigger deploy workflow manually).
4. Admin → Settings → set `premium_enabled = true`.
5. Perform one live test checkout with a real Stripe test-mode card.
6. Confirm webhook event appears in Admin → Stripe Events.
7. Announce to creators.
