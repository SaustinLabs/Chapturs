# Release Gates Checklist

Date: 2026-04-20
Owner: Platform Team
Source Plan: `plan/architecture-buildout-master-1.md` Phase 1 `TASK-006`

Use this checklist before marking any master-plan phase complete.

## Gate A: Scope and Plan Integrity

- [ ] Changes map to explicit task IDs in the active plan file.
- [ ] Active plan file task table updated with completion status/date for finished items.
- [ ] No out-of-scope schema/API changes included.

## Gate B: Security and Authorization

- [ ] New admin endpoints enforce admin role checks.
- [ ] New scheduler endpoints validate shared secret/token.
- [ ] New creator moderation endpoints enforce ownership/collaborator checks.
- [ ] Sensitive routes avoid leaking stack traces or internal errors to clients.

## Gate C: Data and Migration Safety

- [ ] Migration order follows `docs/architecture/migration-order.md`.
- [ ] `prisma/schema.prisma` changes are isolated to current queue step.
- [ ] `npx prisma generate` succeeds.
- [ ] Migration SQL reviewed for unintended destructive operations.

## Gate D: Reliability and Idempotency

- [ ] Webhook and scheduled write paths use idempotency keys or replay locks.
- [ ] Duplicate trigger handling is tested and produces safe no-op/skipped behavior.
- [ ] Structured logs include operation, status, and error details.

## Gate E: Validation and Testing

- [ ] Lint passes for changed scope.
- [ ] Build compiles for changed scope.
- [ ] Added/updated tests for changed behavior pass.
- [ ] Manual smoke tests executed for user-facing flows impacted.

## Gate F: Product Status Sync

- [ ] `TASKS.md` updated for shipped/status-changed work in same commit.
- [ ] Public status pages updated in same commit when feature status changed:
  - `src/app/about/roadmap/page.tsx`
  - `src/app/features/page.tsx`

## Gate G: Operational Readiness

- [ ] Required environment variables verified against `docs/operations/env-matrix.md`.
- [ ] Rollback note prepared for high-risk changes.
- [ ] Monitoring/logging path confirmed for newly introduced jobs or integrations.

## Signoff Block

- Phase: `__________`
- Reviewer: `__________`
- Date: `__________`
- Decision: `Go / No-Go`
- Notes: `______________________________________________`