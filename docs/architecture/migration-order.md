# Migration Order Manifest

Date: 2026-04-20
Owner: Platform Team
Source Plan: `plan/architecture-buildout-master-1.md` (Phase 1 `TASK-004`, Phase 2 `TASK-007`)

## Rule Set

1. Only one active schema PR may modify `prisma/schema.prisma` at a time.
2. Every schema PR must include generated migration SQL under `prisma/migrations/*/migration.sql`.
3. No feature API/UI PR may depend on unapplied schema from another open PR.
4. Rebase on `main` before generating migration SQL to avoid drift.

## Ordered Queue

### Step 1: Monetization audit/idempotency schema

Plan reference:
- `plan/feature-monetization-completion-1.md` Phase 1 `TASK-001`

Expected additions:
- `StripeEventLog` (or equivalent persistent webhook event audit model)
- Any payout audit metadata fields required by Phase 2 of monetization plan

### Step 2: Ecosystem series/volume schema

Plan reference:
- `plan/feature-ecosystem-expansion-1.md` Phase 2 `TASK-007` and `TASK-008`

Expected additions:
- `Series`
- `SeriesVolume`
- `SeriesWork`
- `Work` relation updates

### Step 3: Writers Room / Living World schema

Plan reference:
- `plan/feature-writers-room-living-world-1.md` Phase 1 `TASK-001` and `TASK-002`

Expected additions:
- `LivingWorld`
- `CanonEntry`
- `CanonCharacter`
- `LoreContradictionFlag`
- `WorldCouncilVote`
- Work/world relation field(s)

### Step 4: AI Author Bots schema

Plan reference:
- `plan/feature-ai-author-bots-1.md` Phase 1 `TASK-001`
- `plan/feature-ai-author-bots-1.md` Phase 2 `TASK-012`

Expected additions:
- Bot identity fields (`isBot`, bot config/profile fields)
- Bot generation run tracking model

## Validation Checklist Per Step

1. `npx prisma generate` succeeds.
2. Migration SQL is deterministic and scoped only to current step.
3. No unintended table/column drop in generated SQL.
4. Local API compile succeeds against new schema.
5. Step-specific tests pass.

## Rollback Strategy

1. If migration fails pre-deploy, revert migration PR and regenerate from clean main.
2. If migration fails post-deploy, apply emergency SQL fix only for non-destructive issues, then backfill migration history.
3. Never continue to next queue step until previous step is healthy in production.