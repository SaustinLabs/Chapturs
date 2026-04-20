---
goal: Complete Phase 4 Ecosystem Expansion with reader suggestions, series architecture, and recommendation surfaces
version: 1.0
date_created: 2026-04-19
last_updated: 2026-04-20 (Phase 2 complete)
owner: Chapturs Platform Team
status: 'Planned'
tags: [feature, ecosystem, recommendations, series, reader-feedback]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan implements TASKS.md items 44, 45, 46, 47, 48, and 49b by extending existing edit-suggestion and recommendation systems into complete reader and creator workflows with deterministic API, UI, and scheduled signal updates.

## 1. Requirements & Constraints

- **REQ-001**: Implement reader highlight and typo suggestion flow on story reading surfaces using existing `EditSuggestion` or `SectionEditSuggestion` persistence.
- **REQ-002**: Implement creator accept/reject moderation queue for reader suggestions.
- **REQ-003**: Implement first-class Series and Volume grouping for works.
- **REQ-004**: Implement series-level subscription behavior that subscribes a user to all works in a series.
- **REQ-005**: Implement reader-to-reader recommendation capture for completed reads.
- **REQ-006**: Implement story page recommendation block fed by collaborative signals and fallback logic.
- **SEC-001**: All write operations must enforce authenticated user checks and ownership/permission authorization.
- **SEC-002**: Admin-trigger and scheduler endpoints must require admin role and secret-based request validation.
- **CON-001**: Preserve existing API contracts in `src/app/api/works/[id]/related/route.ts` and avoid breaking current `Readers Also Enjoyed` behavior.
- **CON-002**: Do not introduce separate mobile code paths; maintain responsive behavior in existing components.
- **GUD-001**: Reuse existing models and routes where available before adding new tables.
- **PAT-001**: Use Next.js App Router route handlers under `src/app/api` and Prisma service logic in `src/lib`.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Finalize reader suggestion and creator moderation workflows for typo/wording improvements.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-001 | Audit and unify suggestion models in `prisma/schema.prisma` (`EditSuggestion` vs `SectionEditSuggestion`) and declare single canonical flow for reader suggestions. | ✅ | 2026-04-20 |
| TASK-002 | Implement shared service `src/lib/suggestions/suggestion-permissions.ts` with deterministic guards: `canSubmitSuggestion`, `canModerateSuggestion`, `canApplySuggestion`. | ✅ | 2026-04-20 |
| TASK-003 | Extend `src/app/api/edit-suggestions/route.ts` to enforce canonical status transitions (`pending -> approved/rejected`) with strict enum validation. | ✅ | 2026-04-20 |
| TASK-004 | Add creator moderation endpoint `src/app/api/creator/suggestions/queue/route.ts` returning paginated pending suggestions grouped by work and section. | ✅ | 2026-04-20 |
| TASK-005 | Add creator moderation UI `src/components/CreatorSuggestionQueue.tsx` and integrate into creator hub route `src/app/creator/page.tsx` or `src/app/creator/works/[id]/page.tsx`. | ✅ | 2026-04-20 |
| TASK-006 | Add reader highlight and submit UI component `src/components/ReaderSuggestionPopover.tsx` integrated into chapter block renderer in `src/components/ChapterBlockRenderer.tsx`. |  |  |

### Implementation Phase 2

- GOAL-002: Implement series/volume data model and series-level subscription behavior.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-007 | Add Prisma models to `prisma/schema.prisma`: `Series`, `SeriesVolume`, and `SeriesWork` with indexes on `(seriesId, orderIndex)` and `(workId)`; generate migration SQL in a new `prisma/migrations/*_add_series_volume_system/migration.sql`. | ✅ | 2026-04-20 |
| TASK-008 | Extend `Work` model in `prisma/schema.prisma` with optional `seriesMemberships` relation via `SeriesWork`. | ✅ | 2026-04-20 |
| TASK-009 | Add API CRUD routes `src/app/api/series/route.ts`, `src/app/api/series/[seriesId]/route.ts`, and membership route `src/app/api/series/[seriesId]/works/route.ts`. | ✅ | 2026-04-20 |
| TASK-010 | Add creator UI `src/components/SeriesManager.tsx` for create/update series, define volume order, and attach/detach works. | ✅ | 2026-04-20 |
| TASK-011 | Add series subscription route `src/app/api/series/[seriesId]/subscribe/route.ts` implementing bulk work-subscribe idempotently. | ✅ | 2026-04-20 |
| TASK-012 | Add series display surfaces: `src/app/series/[seriesId]/page.tsx` and story-page linkage in `src/app/story/[id]/page.tsx`. | ✅ | 2026-04-20 |

### Implementation Phase 3

- GOAL-003: Productionize recommendation signal refresh and reader-to-reader recommendation capture.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-013 | Add completion-event route `src/app/api/works/[id]/complete/route.ts` to persist per-user completion events for recommendation training. | ✅ | 2026-04-20 |
| TASK-014 | Add service `src/lib/recommendations/reader-signals.ts` with function `computeReaderToReaderRecommendations(workId: string)` and integrate with existing `computeCollaborativeSignals` in `src/lib/recommendations/similarity.ts`. | ✅ | 2026-04-20 |
| TASK-015 | Extend admin trigger `src/app/api/admin/collaborative-signals/route.ts` to run both collaborative and reader-to-reader computations by work or full-batch. | ✅ | 2026-04-20 |
| TASK-016 | Add scheduled workflow `.github/workflows/recommendation-refresh.yml` with cron `0 */6 * * *` invoking secured admin endpoint. | ✅ | 2026-04-20 |
| TASK-017 | Update recommendation response contract in `src/app/api/works/[id]/related/route.ts` to include `reasonCode` values (`author_pick`, `collab_signal`, `reader_to_reader`, `semantic`, `trending`, `popular`). | ✅ | 2026-04-20 |
| TASK-018 | Update story page UI in `src/app/story/[id]/page.tsx` and/or `src/components/StoryPageClient.tsx` to expose reason labels for recommendation transparency. | ✅ | 2026-04-20 |

## 3. Alternatives

- **ALT-001**: Build an entirely new suggestion model for reader highlights; rejected because `EditSuggestion` and `SectionEditSuggestion` already exist and can be unified with lower migration risk.
- **ALT-002**: Run recommendation recompute only manually from admin panel; rejected because unattended refresh cadence is required for feed quality.
- **ALT-003**: Store series as JSON array on `Work`; rejected because normalized tables support ordering, querying, and subscriptions reliably.

## 4. Dependencies

- **DEP-001**: Prisma schema and migration workflow (`prisma/schema.prisma`, `npx prisma generate`, `npx prisma db push` or migration apply).
- **DEP-002**: Existing recommendation service in `src/lib/recommendations/similarity.ts`.
- **DEP-003**: Existing admin scheduling and deployment pipeline in `.github/workflows/deploy-vps.yml`.
- **DEP-004**: Existing auth/session helpers used by creator and admin APIs.

## 5. Files

- **FILE-001**: `TASKS.md` (status updates for tasks 44-49b after implementation).
- **FILE-002**: `prisma/schema.prisma` (series/volume models and relations).
- **FILE-003**: `src/app/api/edit-suggestions/route.ts` (canonical suggestion flow hardening).
- **FILE-004**: `src/app/api/creator/suggestions/queue/route.ts` (new creator moderation queue API).
- **FILE-005**: `src/app/api/series/route.ts` (new series create/list API).
- **FILE-006**: `src/app/api/series/[seriesId]/works/route.ts` (series membership API).
- **FILE-007**: `src/app/api/series/[seriesId]/subscribe/route.ts` (series-level subscription API).
- **FILE-008**: `src/app/api/works/[id]/related/route.ts` (recommendation reason metadata).
- **FILE-009**: `src/lib/recommendations/reader-signals.ts` (new reader-to-reader computation).
- **FILE-010**: `src/components/CreatorSuggestionQueue.tsx` (queue UI).
- **FILE-011**: `src/components/SeriesManager.tsx` (series management UI).
- **FILE-012**: `.github/workflows/recommendation-refresh.yml` (cron recompute).

## 6. Testing

- **TEST-001**: API integration tests for suggestion creation, moderation authorization, and status transitions in `src/app/api/edit-suggestions/route.ts`.
- **TEST-002**: API integration tests for series CRUD and series subscription idempotency.
- **TEST-003**: Unit tests for `computeReaderToReaderRecommendations` deterministic scoring and fallback behavior.
- **TEST-004**: End-to-end UI test: reader submits suggestion -> creator approves -> suggestion status updates in queue.
- **TEST-005**: End-to-end UI test: creator creates series/volume -> reader views series page -> subscribes once and receives all work subscriptions.
- **TEST-006**: Scheduler smoke test verifying `.github/workflows/recommendation-refresh.yml` invokes admin endpoint and logs successful execution.

## 7. Risks & Assumptions

- **RISK-001**: Existing duplicate suggestion pathways (`EditSuggestion` and `SectionEditSuggestion`) may cause inconsistent moderation states if not unified first.
- **RISK-002**: Recommendation refresh cadence may increase database load on large catalogs if batching is not constrained.
- **ASSUMPTION-001**: Existing subscription table and logic can support bulk insert for series subscription.
- **ASSUMPTION-002**: Existing admin endpoint authentication pattern can be reused for scheduled workflow calls.

## 8. Related Specifications / Further Reading

- TASK source: `TASKS.md` (Phase 4 tasks 44-49b).
- Existing recommendation implementation: `src/lib/recommendations/similarity.ts`.
- Existing related works API: `src/app/api/works/[id]/related/route.ts`.