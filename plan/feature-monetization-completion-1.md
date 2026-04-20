---
goal: Complete monetization rollout with verified Stripe webhook flow and production-ready creator payout operations
version: 1.0
date_created: 2026-04-19
last_updated: 2026-04-20
owner: Chapturs Platform Team
status: 'Planned'
tags: [feature, monetization, stripe, payouts, operations]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan implements the remaining monetization tasks in TASKS.md (67 and 68) and operationalizes task 66 by adding deterministic Stripe verification, payout controls, and launch guardrails.

## 1. Requirements & Constraints

- **REQ-001**: Validate Stripe checkout and webhook flows end-to-end in a reproducible staging runbook.
- **REQ-002**: Implement creator payout request and processing flow with auditable states.
- **REQ-003**: Preserve runtime monetization feature flags from SiteSettings (`premium_enabled`, `creator_payouts`).
- **REQ-004**: Ensure creator earnings and payout history remain consistent between API and UI surfaces.
- **SEC-001**: Verify Stripe signatures on all webhook events before processing.
- **SEC-002**: Restrict payout processing endpoints to admin role and enforce idempotent processing.
- **SEC-003**: Prevent payout request abuse through minimum threshold and payout status locks.
- **CON-001**: Existing routes in `src/app/api/stripe/checkout/route.ts` and `src/app/api/stripe/webhook/route.ts` must remain backward compatible.
- **CON-002**: Deployment target is VPS via `.github/workflows/deploy-vps.yml`; no Vercel-only assumptions.
- **GUD-001**: Payment and payout failures must be observable through structured logs and operator-visible statuses.
- **PAT-001**: Use `src/lib/payment.ts` `PaymentService` for Stripe interactions to keep route handlers thin.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Finalize Stripe transaction correctness and observability.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-001 | Add webhook event audit table `StripeEventLog` in `prisma/schema.prisma` with unique `eventId`, `eventType`, `processedAt`, and `status` fields; create migration `prisma/migrations/*_add_stripe_event_log/migration.sql`. | ✅ | 2026-04-20 |
| TASK-002 | Refactor `src/app/api/stripe/webhook/route.ts` to write every validated event to `StripeEventLog` before business mutation and skip duplicates by `eventId`. | ✅ | 2026-04-20 |
| TASK-003 | Add event handlers for `invoice.payment_failed` and `customer.subscription.updated` in webhook route with explicit user premium-state transitions. | ✅ | 2026-04-20 |
| TASK-004 | Add structured logger helper `src/lib/observability/monetization-logger.ts` and replace ad hoc `console.error` calls in checkout and webhook routes. | ✅ | 2026-04-20 |
| TASK-005 | Add operator API `src/app/api/admin/stripe/events/route.ts` to list recent webhook events and failure reasons. | ✅ | 2026-04-20 |
| TASK-006 | Add staging verification script `scripts/verify-stripe-webhook.ps1` documenting and automating local stripe CLI trigger sequence. | ✅ | 2026-04-20 |

### Implementation Phase 2

- GOAL-002: Complete creator payout request and processing lifecycle.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-007 | Add creator payout-request route `src/app/api/creator/payouts/request/route.ts` with checks for `creator_payouts` enabled and minimum threshold. | ✅ | 2026-04-20 |
| TASK-008 | Extend `Payout` model in `prisma/schema.prisma` with `requestedById`, `requestedAt`, `processedById`, `processedAt`, `failureReason`, and idempotency token fields. | ✅ | 2026-04-20 |
| TASK-009 | Refactor `src/app/api/admin/payouts/route.ts` to support deterministic two-step processing: `approve` then `complete|fail`, with transactional balance adjustments. | ✅ | 2026-04-20 |
| TASK-010 | Add admin payout operations UI `src/app/admin/payouts/page.tsx` with filters by status and bulk process action guarded by confirmation. | ✅ | 2026-04-20 |
| TASK-011 | Update creator monetization UI in `src/app/creator/monetization/MonetizationContent.tsx` and/or `src/components/CreatorMonetizationHub.tsx` to include payout request button and status timeline. | ✅ | 2026-04-20 |
| TASK-012 | Add payout notification hooks (fire-and-forget) in `src/lib/email.ts` for payout approved/failed/completed states. | ✅ | 2026-04-20 |

### Implementation Phase 3

- GOAL-003: Add launch controls, testing, and documentation for safe production activation.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-013 | Add launch checklist doc `docs/operations/monetization-launch-checklist.md` covering secrets, webhook endpoint config, and rollback steps. | ✅ | 2026-04-20 |
| TASK-014 | Add regression test suite for checkout and webhook flows in `src/__tests__/stripe-webhook.test.ts` and `src/__tests__/stripe-checkout.test.ts`. | ✅ | 2026-04-20 |
| TASK-015 | Add integration tests for payout request and admin processing in `src/__tests__/payouts-flow.test.ts`. | ✅ | 2026-04-20 |
| TASK-016 | Add task runner entry in `package.json` scripts for monetization verification (`verify:monetization`). | ✅ | 2026-04-20 |
| TASK-017 | Update public status pages `src/app/about/roadmap/page.tsx` and `src/app/features/page.tsx` to reflect true monetization rollout stage after deployment validation. | ✅ | 2026-04-20 |
| TASK-018 | Update `TASKS.md` statuses for tasks 66, 67, 68 within the same implementation commit. | ✅ | 2026-04-20 |

## 3. Alternatives

- **ALT-001**: Process payouts as immediate one-step mutation; rejected due missing auditability and higher failure-recovery risk.
- **ALT-002**: Keep webhook logs only in console output; rejected because operational debugging requires queryable persisted history.
- **ALT-003**: Activate payouts before request workflow exists; rejected because creator-facing control and transparency are required.

## 4. Dependencies

- **DEP-001**: Stripe environment variables: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
- **DEP-002**: Runtime settings route `src/app/api/admin/settings/route.ts` and helper `src/lib/settings.ts`.
- **DEP-003**: Existing `PaymentService` in `src/lib/payment.ts`.
- **DEP-004**: Existing creator earnings route `src/app/api/creator/earnings/route.ts` and payout model in Prisma schema.

## 5. Files

- **FILE-001**: `TASKS.md` (status updates for monetization tasks).
- **FILE-002**: `prisma/schema.prisma` (StripeEventLog and payout metadata fields).
- **FILE-003**: `src/app/api/stripe/webhook/route.ts` (idempotent event processing).
- **FILE-004**: `src/app/api/stripe/checkout/route.ts` (structured observability integration).
- **FILE-005**: `src/app/api/admin/payouts/route.ts` (stateful payout processing).
- **FILE-006**: `src/app/api/creator/payouts/request/route.ts` (new creator payout request API).
- **FILE-007**: `src/app/admin/payouts/page.tsx` (admin payout operations UI).
- **FILE-008**: `src/lib/payment.ts` (Stripe service logic extensions).
- **FILE-009**: `src/lib/observability/monetization-logger.ts` (new logger helper).
- **FILE-010**: `scripts/verify-stripe-webhook.ps1` (staging verification automation).

## 6. Testing

- **TEST-001**: Webhook signature verification and idempotency tests with duplicate event delivery.
- **TEST-002**: Checkout flow test asserting premium-enable gate and Stripe config failure behavior.
- **TEST-003**: Payout request authorization and threshold validation tests.
- **TEST-004**: Admin payout processing transaction test ensuring `pendingPayout` and `lifetimePayout` consistency.
- **TEST-005**: End-to-end monetization smoke test in staging using Stripe test mode and webhook replay.
- **TEST-006**: UI test confirming creator payout request visibility toggles correctly with `creator_payouts` setting.

## 7. Risks & Assumptions

- **RISK-001**: Webhook delivery retries can cause duplicate state transitions if event-id idempotency is not enforced.
- **RISK-002**: Incomplete payout audit data can create finance reconciliation gaps.
- **ASSUMPTION-001**: Existing `Payout` and earnings models can support requested metadata fields without major rework.
- **ASSUMPTION-002**: Stripe test mode and CLI replay are available for staging verification.

## 8. Related Specifications / Further Reading

- TASK source: `TASKS.md` (Monetization tasks 66-68).
- Existing checkout route: `src/app/api/stripe/checkout/route.ts`.
- Existing webhook route: `src/app/api/stripe/webhook/route.ts`.
- Existing payout APIs: `src/app/api/admin/payouts/route.ts`, `src/app/api/creator/earnings/route.ts`.