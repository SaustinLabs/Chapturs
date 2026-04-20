---
goal: Orchestrate full multi-agent buildout across ecosystem expansion, living world, AI bots, and monetization
version: 1.0
date_created: 2026-04-19
last_updated: 2026-04-20
owner: Chapturs Platform Team
status: 'Planned'
tags: [architecture, process, rollout, multi-agent, orchestration]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This master plan defines the execution order, gating, and integration checkpoints for four implementation plans so AI agents can build in parallel where safe, avoid schema conflicts, and ship coherent user-facing outcomes.

## 1. Requirements & Constraints

- **REQ-001**: Execute existing plan specifications in a deterministic dependency order.
- **REQ-002**: Allow parallel implementation only where schema, API, and UI surfaces do not conflict.
- **REQ-003**: Enforce release gates for database migrations, security checks, and end-to-end tests before phase progression.
- **REQ-004**: Maintain task/status synchronization between internal and public roadmap surfaces on each shipped scope.
- **REQ-005**: Produce handoff artifacts at each phase boundary for subsequent AI agents.
- **SEC-001**: All new admin and scheduler endpoints must have role checks and secret validation before production enablement.
- **SEC-002**: All payment and payout paths must pass idempotency and audit-log validation before launch.
- **OPS-001**: Any plan introducing scheduled jobs must include failure alerting and replay-safe execution.
- **CON-001**: Deployment target is VPS through existing GitHub workflow pipeline.
- **CON-002**: OpenRouter remains the only LLM provider and must use required request headers.
- **GUD-001**: Keep each phase mergeable independently; no long-lived mega-branch.
- **PAT-001**: Use branch naming `plan/<PLAN_ID>/phase-<N>` and PR naming `PLAN_ID-PHASE-N` for traceability.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish shared foundations and unblock highest-risk cross-cutting dependencies.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-001 | Adopt `plan/feature-monetization-completion-1.md` Phase 1 first to harden Stripe idempotency/audit patterns reused by scheduler-style workflows. | ✅ | 2026-04-20 |
| TASK-002 | Adopt `plan/feature-ecosystem-expansion-1.md` TASK-001 first to resolve canonical suggestion data model before any new suggestion UI/API additions. | ✅ | 2026-04-20 |
| TASK-003 | Create integration contract doc `docs/architecture/plan-contracts.md` defining shared enums (`reasonCode`, suggestion statuses, scheduler run states). | ✅ | 2026-04-20 |
| TASK-004 | Create migration queue manifest `docs/architecture/migration-order.md` with strict order for schema-changing tasks across all plans. | ✅ | 2026-04-20 |
| TASK-005 | Define environment variable matrix `docs/operations/env-matrix.md` for monetization, AI bots, and living-world services with required/prod-only flags. | ✅ | 2026-04-20 |
| TASK-006 | Create CI gate checklist `docs/operations/release-gates.md` consumed by agents before marking any phase complete. | ✅ | 2026-04-20 |

### Implementation Phase 2

- GOAL-002: Execute schema and core backend layers across all plans with conflict-free sequencing.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-007 | Run all Prisma model additions in this exact order: monetization event/audit fields -> ecosystem series models -> living world models -> AI bot identity/run models. |  |  |
| TASK-008 | Generate and validate migration SQL for each plan in isolated PRs; forbid overlapping edits to `prisma/schema.prisma` in parallel branches. |  |  |
| TASK-009 | Implement core backend APIs per plan after each schema merge: monetization APIs, ecosystem APIs, living world APIs, then AI bot admin APIs. |  |  |
| TASK-010 | Add shared authorization helper module `src/lib/auth/feature-access.ts` to centralize admin/collaborator/world-council checks. | ✅ | 2026-04-20 |
| TASK-011 | Add shared scheduler execution helper `src/lib/scheduler/run-lock.ts` for replay-safe cron-triggered endpoints. | ✅ | 2026-04-20 |
| TASK-012 | Add shared observability layer for new endpoints in `src/lib/observability` and require structured logs for all scheduler/payment/world mutation operations. |  |  |

### Implementation Phase 3

- GOAL-003: Execute user-facing UI/UX surfaces and background automation with staged activation.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-013 | Ship ecosystem UI tranche first: reader suggestion popover, creator suggestion queue, series manager, recommendation reason labels. |  |  |
| TASK-014 | Ship monetization UI tranche second: creator payout request/status timeline and admin payout operations panel. |  |  |
| TASK-015 | Ship living world creator tranche third: writers room console, canon graph tooling, contradiction review workflows. |  |  |
| TASK-016 | Ship living world reader tranche fourth: world atlas, lore index, timeline page, and story/feed living-world badges. |  |  |
| TASK-017 | Ship AI bot UI tranche fifth: admin bot control panel and mandatory AI labels on feed/story surfaces. |  |  |
| TASK-018 | Enable scheduled jobs in order: recommendation refresh -> payout ops support jobs (if needed) -> living-world scan jobs -> AI bot publisher. |  |  |

### Implementation Phase 4

- GOAL-004: Validate integrated behavior, then activate features progressively in production.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-019 | Run cross-plan integration suite validating interactions: recommendations with series, AI labels with feed ranking, payouts with creator dashboards, world badges on stories. |  |  |
| TASK-020 | Execute rollback drills for high-risk systems: Stripe webhook failures, scheduler duplication, failed migrations, and bot over-publication. |  |  |
| TASK-021 | Launch feature flags progressively through SiteSettings groups with explicit ramp schedule and owner sign-off for each flag. |  |  |
| TASK-022 | Update `TASKS.md` and public pages (`src/app/about/roadmap/page.tsx`, `src/app/features/page.tsx`) in same release PR for every feature state change. |  |  |
| TASK-023 | Publish operational runbooks in `docs/operations` for on-call response to monetization, scheduler, and world-governance incidents. |  |  |
| TASK-024 | Produce final handoff artifact `docs/architecture/buildout-completion-report.md` summarizing shipped scope, outstanding risks, and follow-up tasks. |  |  |

## 3. Alternatives

- **ALT-001**: Execute all four plans independently without orchestration; rejected due schema merge collisions and conflicting release timing.
- **ALT-002**: Execute monetization last; rejected because payout and webhook reliability patterns are reusable for scheduler-heavy systems.
- **ALT-003**: Execute AI bots before ecosystem and living-world work; rejected because feed quality and labeling context should be established first.

## 4. Dependencies

- **DEP-001**: `plan/feature-ecosystem-expansion-1.md`.
- **DEP-002**: `plan/feature-writers-room-living-world-1.md`.
- **DEP-003**: `plan/feature-ai-author-bots-1.md`.
- **DEP-004**: `plan/feature-monetization-completion-1.md`.
- **DEP-005**: Existing deployment workflow `.github/workflows/deploy-vps.yml`.

## 5. Files

- **FILE-001**: `plan/feature-ecosystem-expansion-1.md` (dependent execution plan).
- **FILE-002**: `plan/feature-writers-room-living-world-1.md` (dependent execution plan).
- **FILE-003**: `plan/feature-ai-author-bots-1.md` (dependent execution plan).
- **FILE-004**: `plan/feature-monetization-completion-1.md` (dependent execution plan).
- **FILE-005**: `docs/architecture/plan-contracts.md` (shared contracts artifact).
- **FILE-006**: `docs/architecture/migration-order.md` (schema sequencing artifact).
- **FILE-007**: `docs/operations/release-gates.md` (phase gate checklist).
- **FILE-008**: `docs/operations/env-matrix.md` (environment configuration matrix).
- **FILE-009**: `docs/architecture/buildout-completion-report.md` (final handoff report).

## 6. Testing

- **TEST-001**: Cross-plan migration test in clean database environment using ordered migration manifest.
- **TEST-002**: Contract tests ensuring shared enums and response shapes remain consistent across affected APIs.
- **TEST-003**: End-to-end test for reader suggestion to recommendation visibility pipeline.
- **TEST-004**: End-to-end monetization test from checkout to webhook to creator earnings and payout request.
- **TEST-005**: End-to-end living-world test from world creation to canon entry to reader world page navigation.
- **TEST-006**: End-to-end AI bot test from scheduler trigger to labeled publish and decayed feed placement.

## 7. Risks & Assumptions

- **RISK-001**: Parallel schema work can cause repeated rebase conflicts and migration drift without strict sequencing.
- **RISK-002**: Scheduler-heavy subsystems can create duplicate writes if run locks/idempotency are inconsistent.
- **RISK-003**: Public roadmap drift can misrepresent feature status if TASKS and public pages are not updated atomically.
- **ASSUMPTION-001**: Multiple AI agents can be assigned isolated phase branches with enforced plan-contract compliance.
- **ASSUMPTION-002**: Feature flags in SiteSettings are available to support staged rollout for all large feature sets.

## 8. Related Specifications / Further Reading

- `plan/feature-ecosystem-expansion-1.md`
- `plan/feature-writers-room-living-world-1.md`
- `plan/feature-ai-author-bots-1.md`
- `plan/feature-monetization-completion-1.md`
- `TASKS.md`