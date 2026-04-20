# Environment Variable Matrix

Date: 2026-04-20
Owner: Platform Team
Source Plan: `plan/architecture-buildout-master-1.md` Phase 1 `TASK-005`

## Usage

- `Required`: must exist for feature to work.
- `Prod-only`: required in production, optional in local development.
- `Feature`: subsystem primarily using the variable.

## Matrix

| Variable | Required | Prod-only | Feature | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | yes | yes | Core | Prisma and all APIs |
| `NEXTAUTH_SECRET` | yes | yes | Auth | Session/JWT integrity |
| `NEXTAUTH_URL` | yes | yes | Auth | Callback base URL |
| `OPENROUTER_API_KEY` | yes | yes | LLM (quality, living world, bots) | OpenRouter only |
| `HTTP_REFERER` (logical contract) | yes | yes | LLM | Enforced as header value `https://chapturs.com` |
| `X_TITLE` (logical contract) | yes | yes | LLM | Enforced as header value `Chapturs` |
| `STRIPE_SECRET_KEY` | yes | yes | Monetization | Checkout + webhook processing |
| `STRIPE_PRICE_ID` | yes | yes | Monetization | Checkout target price |
| `STRIPE_WEBHOOK_SECRET` | yes | yes | Monetization | Signature verification |
| `SENTRY_DSN` | no | recommended | Observability | Error tracking if configured |
| `GOOGLE_BOOKS_API_KEY` | no | no | Onboarding/taste discovery | Optional; no-key fallback exists |
| `GOOGLE_CLOUD_VISION_API_KEY` | no | recommended | Content safety | Enables image moderation checks |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | no | recommended | Abuse prevention | Public key for reCAPTCHA |
| `RECAPTCHA_SECRET_KEY` | no | recommended | Abuse prevention | Server-side verification |
| `CRON_SHARED_SECRET` (proposed) | yes (for scheduler routes) | yes | Scheduler security | Shared token for cron-triggered admin endpoints |

## Feature Flag Dependencies (SiteSettings)

| Setting Key | Subsystem | Default |
| --- | --- | --- |
| `premium_enabled` | Stripe premium checkout | `false` |
| `creator_payouts` | Creator payout requests/processing | `false` |

## Pre-Deploy Verification

1. Confirm required variables are present in GitHub Secrets.
2. Confirm deploy workflow writes variables into VPS runtime `.env.production`.
3. Confirm scheduler endpoints use `CRON_SHARED_SECRET` (or equivalent) and reject missing/invalid token.
4. Confirm production-only keys are not required for local test runs unless feature under test needs them.

## Unblock Checklist (if missing config)

1. Implement code paths with graceful `503` and explicit setup errors.
2. Add TODO entry in deployment checklist with variable name and owning service.
3. Continue non-secret-dependent implementation and tests.