---
goal: Implement Phase 5 Writers Room and Living World platform features
version: 1.0
date_created: 2026-04-19
last_updated: 2026-04-19
owner: Chapturs Platform Team
status: 'Planned'
tags: [feature, worldbuilding, writers-room, lore, ai]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan implements TASKS.md items 50 through 59 by adding the complete data model, writer tooling, canon governance, and reader-facing world exploration surfaces for shared universes.

## 1. Requirements & Constraints

- **REQ-001**: Add Prisma models `LivingWorld`, `CanonEntry`, `CanonCharacter`, `LoreContradictionFlag`, and `WorldCouncilVote` with relations to `Work`, `Section`, and `User`.
- **REQ-002**: Implement creator/founder world definition workflow for setting world origin, world endpoint, and canonical entities.
- **REQ-003**: Implement Lore Master AI assistant for query answering and contradiction detection using OpenRouter.
- **REQ-004**: Implement canon graph with source chapter references and traversable relation edges.
- **REQ-005**: Implement vector-indexed lore retrieval for semantic world queries.
- **REQ-006**: Implement World Council moderation and voting with veto capability.
- **REQ-007**: Implement reader-facing World Atlas, Lore Index, Timeline View, and feed/story badges for Living World affiliation.
- **SEC-001**: Restrict world mutation APIs to authorized world founders/collaborators and admins.
- **SEC-002**: Restrict World Council vote and veto actions to explicit council role members.
- **CON-001**: Use OpenRouter API with required headers `HTTP-Referer: https://chapturs.com` and `X-Title: Chapturs`.
- **CON-002**: Preserve App Router conventions and existing responsive layout patterns.
- **GUD-001**: All async side-effects (notifications/email) must remain non-blocking.
- **PAT-001**: Place domain services in `src/lib/living-world` and route handlers under `src/app/api/living-world`.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish database and service foundations for Living World data and canon governance.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-001 | Extend `prisma/schema.prisma` with models `LivingWorld`, `CanonEntry`, `CanonCharacter`, `LoreContradictionFlag`, and `WorldCouncilVote`, including `@@index` and uniqueness constraints for world-scoped slugs and canonical names. |  |  |
| TASK-002 | Add migration `prisma/migrations/*_add_living_world_models/migration.sql` and include nullable relations from `Work` to `LivingWorld` (e.g., `livingWorldId`). |  |  |
| TASK-003 | Create service `src/lib/living-world/world-repository.ts` with deterministic CRUD functions: `createWorld`, `updateWorld`, `attachWorkToWorld`, `listWorldWorks`. |  |  |
| TASK-004 | Create service `src/lib/living-world/canon-repository.ts` with canonical operations: `createCanonEntry`, `updateCanonEntry`, `flagContradiction`, `resolveContradiction`. |  |  |
| TASK-005 | Create API routes `src/app/api/living-world/route.ts` and `src/app/api/living-world/[worldId]/route.ts` for world CRUD with role guards. |  |  |
| TASK-006 | Create API routes for canon and disputes: `src/app/api/living-world/[worldId]/canon/route.ts`, `src/app/api/living-world/[worldId]/contradictions/route.ts`, and `src/app/api/living-world/[worldId]/votes/route.ts`. |  |  |

### Implementation Phase 2

- GOAL-002: Deliver creator-facing Writers Room tools and Lore Master AI workflows.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-007 | Add Writers Room creator page `src/app/creator/living-world/[worldId]/page.tsx` and primary orchestrator component `src/components/living-world/WritersRoomConsole.tsx`. |  |  |
| TASK-008 | Build world-definition UI in `src/components/living-world/WorldDefinitionForm.tsx` to set The Beginning, The End, and canonical character seeds. |  |  |
| TASK-009 | Build canon graph component `src/components/living-world/CanonGraph.tsx` with node types (`fact`, `character`, `event`, `location`) and edge type (`supports`, `contradicts`, `depends_on`). |  |  |
| TASK-010 | Create OpenRouter client helper `src/lib/living-world/lore-master-client.ts` using model `meta-llama/llama-3.3-70b-instruct` and required headers. |  |  |
| TASK-011 | Implement `scanContradictions(worldId: string)` in `src/lib/living-world/contradiction-scanner.ts` using chapter source citations and writing flags into `LoreContradictionFlag`. |  |  |
| TASK-012 | Add writers-room AI route `src/app/api/living-world/[worldId]/lore-master/route.ts` supporting query mode and scan mode with bounded token budgets. |  |  |

### Implementation Phase 3

- GOAL-003: Deliver reader-facing Living World exploration and feed integration.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-013 | Create reader world page `src/app/worlds/[worldSlug]/page.tsx` with sections: World Atlas, Lore Index, Timeline View, Canon Disputes, and attached stories. |  |  |
| TASK-014 | Build components `src/components/living-world/WorldAtlas.tsx`, `src/components/living-world/LoreIndex.tsx`, and `src/components/living-world/TimelineView.tsx`. |  |  |
| TASK-015 | Implement vector retrieval service `src/lib/living-world/vector-search.ts`; use pgvector if extension is available, otherwise fallback to cosine on persisted embeddings in PostgreSQL JSON/array field. |  |  |
| TASK-016 | Add feed/story badge rendering by updating `src/components/InfiniteFeed.tsx` and `src/app/story/[id]/page.tsx` to show Living World affiliation when `work.livingWorldId` exists. |  |  |
| TASK-017 | Add World Council admin UI `src/app/admin/living-world/page.tsx` for council membership and veto operations. |  |  |
| TASK-018 | Add pagination and cache strategy for world pages to keep query cost bounded on large worlds. |  |  |

## 3. Alternatives

- **ALT-001**: Implement Living World as flat tags on works without canonical graph; rejected because contradiction resolution and source traceability require graph structure.
- **ALT-002**: Use external vector DB from day one; rejected because pgvector/postgres-first keeps operational complexity lower during initial rollout.
- **ALT-003**: Run contradiction scan only manually; rejected because recurring scans are required after new chapter publishes.

## 4. Dependencies

- **DEP-001**: Prisma schema migration lifecycle and production DB access.
- **DEP-002**: OpenRouter key and model usage policy from existing quality assessment integration.
- **DEP-003**: Existing work/section content retrieval APIs for source chapter citations.
- **DEP-004**: Existing role and admin authorization patterns in middleware and server checks.

## 5. Files

- **FILE-001**: `TASKS.md` (status updates for tasks 50-59 on completion).
- **FILE-002**: `prisma/schema.prisma` (Living World models and relations).
- **FILE-003**: `src/lib/living-world/world-repository.ts` (new world data access service).
- **FILE-004**: `src/lib/living-world/canon-repository.ts` (new canon data access service).
- **FILE-005**: `src/lib/living-world/lore-master-client.ts` (OpenRouter AI client wrapper).
- **FILE-006**: `src/lib/living-world/contradiction-scanner.ts` (AI-assisted contradiction detection).
- **FILE-007**: `src/lib/living-world/vector-search.ts` (semantic lore retrieval).
- **FILE-008**: `src/app/api/living-world/route.ts` (world API entrypoint).
- **FILE-009**: `src/app/api/living-world/[worldId]/lore-master/route.ts` (Lore Master API).
- **FILE-010**: `src/components/living-world/WritersRoomConsole.tsx` (creator console UI).
- **FILE-011**: `src/app/worlds/[worldSlug]/page.tsx` (reader world page).

## 6. Testing

- **TEST-001**: Schema migration tests ensuring all new models and relations are generated and queryable.
- **TEST-002**: API authorization tests for world mutation endpoints and World Council vote restrictions.
- **TEST-003**: Unit tests for contradiction scanner output normalization and duplicate-flag suppression.
- **TEST-004**: Integration test for Lore Master endpoint verifying required OpenRouter headers and model routing.
- **TEST-005**: End-to-end creator flow: create world -> attach work -> add canon entry -> raise contradiction -> council vote.
- **TEST-006**: End-to-end reader flow: open world page -> filter lore index -> open timeline event -> navigate to source chapter.

## 7. Risks & Assumptions

- **RISK-001**: Contradiction detection quality may vary by chapter writing style; low-confidence flags must be separated from hard conflicts.
- **RISK-002**: Canon graph rendering can degrade with large node counts unless virtualized or paged.
- **ASSUMPTION-001**: Shared universe features are activated only for works explicitly attached to a world.
- **ASSUMPTION-002**: Current auth system can represent World Council membership via role or settings-backed allowlist.

## 8. Related Specifications / Further Reading

- TASK source: `TASKS.md` (Phase 5 tasks 50-59).
- Existing architecture constraints: `.github/copilot-instructions.md`.
- Existing OpenRouter integration example: `src/lib/quality-assessment/llm-service.ts`.