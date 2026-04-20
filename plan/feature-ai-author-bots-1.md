---
goal: Implement Phase 6 AI Author Bots with transparent labeling, safe generation pipeline, and controlled feed weighting
version: 1.0
date_created: 2026-04-19
last_updated: 2026-04-19
owner: Chapturs Platform Team
status: 'Planned'
tags: [feature, ai, content-generation, scheduling, feed-ranking]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan implements TASKS.md items 60 through 65 by creating a fully labeled AI author content pipeline, scheduled publishing flow, and progressive feed de-prioritization as human-authored inventory grows.

## 1. Requirements & Constraints

- **REQ-001**: Add explicit bot-author identity support (`isBot`) at user and author-profile level.
- **REQ-002**: Implement AI story outline generation pipeline via OpenRouter.
- **REQ-003**: Implement chapter generation using prior chapter context and continuity constraints.
- **REQ-004**: Implement scheduled automated publishing cadence for bot chapters.
- **REQ-005**: Implement feed weight decay for bot content as real creator content increases.
- **REQ-006**: Render clear AI author label in feed cards and story pages.
- **SEC-001**: Bot generation endpoints must be admin-only and protected against public invocation.
- **SEC-002**: Generated content must pass existing publish validation checks before going live.
- **CON-001**: Use OpenRouter only (no groq-sdk), with required headers and configured model IDs.
- **CON-002**: Ensure transparent labeling everywhere bots appear; no hidden AI-generated content paths.
- **GUD-001**: Keep generation side-effects idempotent to avoid duplicate chapter publication on retries.
- **PAT-001**: Place generation logic under `src/lib/ai-bots` and scheduling under `.github/workflows` or admin cron routes.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish bot identity model and admin control surface.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-001 | Extend `prisma/schema.prisma` `User` model with `isBot Boolean @default(false)` and `botProfileJson String?` (or normalized bot profile table) with migration in `prisma/migrations/*_add_bot_author_fields/migration.sql`. |  |  |
| TASK-002 | Add admin API `src/app/api/admin/bots/route.ts` for create/list bot authors and enforce admin session checks. |  |  |
| TASK-003 | Add bot management UI `src/app/admin/bots/page.tsx` with controls for target genres, cadence, and active/inactive toggles. |  |  |
| TASK-004 | Add guard utility `src/lib/ai-bots/permissions.ts` with deterministic `assertBotAdminAccess(session)` function reused by all bot routes. |  |  |
| TASK-005 | Add bot configuration validation schema `src/lib/ai-bots/config-schema.ts` (Zod) for cadence, max chapter length, and safety limits. |  |  |
| TASK-006 | Update seed workflow in `prisma/seed.ts` to optionally create one disabled test bot in non-production environments only. |  |  |

### Implementation Phase 2

- GOAL-002: Build deterministic outline and chapter generation pipeline with continuity safeguards.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-007 | Implement OpenRouter wrapper `src/lib/ai-bots/openrouter-client.ts` using model `meta-llama/llama-3.1-8b-instruct` for draft generation and optional `meta-llama/llama-3.3-70b-instruct` for refinement. |  |  |
| TASK-008 | Implement `generateStoryOutline(botId, promptSeed)` in `src/lib/ai-bots/outline-generator.ts` and persist outline metadata to work settings table or bot profile JSON. |  |  |
| TASK-009 | Implement `generateNextChapter(workId)` in `src/lib/ai-bots/chapter-generator.ts` with context window built from previous sections and continuity notes. |  |  |
| TASK-010 | Route generated chapter through existing validation flow by invoking logic in `src/app/api/works/publish/route.ts` or extracting shared validator service for reuse. |  |  |
| TASK-011 | Add generation orchestration route `src/app/api/admin/bots/generate/route.ts` supporting `outline`, `chapter`, and `dryRun` modes with idempotency key support. |  |  |
| TASK-012 | Persist generation audit records in new table `BotGenerationRun` (or equivalent) with status, token usage, and output references. |  |  |

### Implementation Phase 3

- GOAL-003: Add scheduled publishing, feed weight decay, and transparent AI labeling.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-013 | Add scheduler endpoint `src/app/api/admin/bots/scheduler/route.ts` that selects eligible bot works and generates/publishes at configured cadence. |  |  |
| TASK-014 | Add workflow `.github/workflows/ai-bot-publisher.yml` with cron `*/30 * * * *` invoking secured scheduler endpoint. |  |  |
| TASK-015 | Add feed-ranking weight function `computeBotWeightDecay` in `src/lib/feed/ranking.ts` or existing feed scoring file and integrate into feed API ranking path. |  |  |
| TASK-016 | Update feed card component (`src/components/InfiniteFeed.tsx` and related card component) to show immutable `AI Author` badge when `author.isBot` is true. |  |  |
| TASK-017 | Update story page rendering in `src/app/story/[id]/page.tsx` and `src/components/StoryPageClient.tsx` to display AI-origin disclosure block above chapter list. |  |  |
| TASK-018 | Add hard cap rule in scheduler to stop new bot publishes when real authored daily publishes exceed configurable threshold from SiteSettings. |  |  |

## 3. Alternatives

- **ALT-001**: Generate full novels in one shot; rejected due continuity quality risk and inability to moderate chapter-by-chapter.
- **ALT-002**: Allow unlabeled bot content in feed to maximize click-through; rejected due transparency and trust requirements.
- **ALT-003**: Keep scheduler fully manual; rejected because consistent cadence is required for cold-start inventory.

## 4. Dependencies

- **DEP-001**: Existing OpenRouter infrastructure and key management.
- **DEP-002**: Existing content publish validation logic in work publish route/services.
- **DEP-003**: Existing feed ranking pipeline for score adjustment integration.
- **DEP-004**: Existing GitHub Actions deployment and secret-injection workflow.

## 5. Files

- **FILE-001**: `TASKS.md` (status updates for tasks 60-65).
- **FILE-002**: `prisma/schema.prisma` (bot identity and run tracking fields/models).
- **FILE-003**: `src/lib/ai-bots/openrouter-client.ts` (new AI generation client).
- **FILE-004**: `src/lib/ai-bots/outline-generator.ts` (outline pipeline).
- **FILE-005**: `src/lib/ai-bots/chapter-generator.ts` (chapter pipeline).
- **FILE-006**: `src/app/api/admin/bots/route.ts` (admin bot management API).
- **FILE-007**: `src/app/api/admin/bots/generate/route.ts` (manual generation API).
- **FILE-008**: `src/app/api/admin/bots/scheduler/route.ts` (scheduled generation API).
- **FILE-009**: `.github/workflows/ai-bot-publisher.yml` (cron scheduler).
- **FILE-010**: `src/components/InfiniteFeed.tsx` (AI badge in feed).
- **FILE-011**: `src/app/story/[id]/page.tsx` (AI disclosure on story page).

## 6. Testing

- **TEST-001**: Schema migration test for `isBot` and generation-run persistence.
- **TEST-002**: Admin authorization tests for all bot management/generation endpoints.
- **TEST-003**: Unit tests for generation prompt assembly and continuity context selection.
- **TEST-004**: Integration tests verifying generated chapters pass publish validation or are rejected with explicit reasons.
- **TEST-005**: End-to-end bot publish cycle test: scheduler run -> draft generation -> publish -> feed and story labeling visible.
- **TEST-006**: Feed ranking regression tests confirming bot weight decays when human content density increases.

## 7. Risks & Assumptions

- **RISK-001**: LLM drift or hallucination can create canon inconsistencies if continuity constraints are weak.
- **RISK-002**: Scheduler retries can double-publish without idempotency keys and run-state locking.
- **ASSUMPTION-001**: Existing moderation and validation steps can be reused for bot-generated chapters.
- **ASSUMPTION-002**: Bot content volume is limited and intended only as temporary cold-start support.

## 8. Related Specifications / Further Reading

- TASK source: `TASKS.md` (Phase 6 tasks 60-65).
- Existing OpenRouter pattern: `src/lib/quality-assessment/llm-service.ts`.
- Existing feed surface: `src/components/InfiniteFeed.tsx`.