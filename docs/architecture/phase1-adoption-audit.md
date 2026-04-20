# Phase 1 Adoption Audit

Date: 2026-04-20
Scope: Master Plan Phase 1 `TASK-001` and `TASK-002`

## TASK-001: Monetization Phase 1 Adopted First

Decision:
- Monetization reliability patterns are the first cross-cutting implementation concern and are adopted before schema-heavy feature work.

Source:
- `plan/feature-monetization-completion-1.md` Phase 1 (`TASK-001`..`TASK-006`)

Adopted reusable pattern set:
1. Webhook idempotency by external event key (`eventId`) with duplicate-skip semantics.
2. Persistent event audit trail for replay/debug and compliance visibility.
3. Structured logging contract for operational observability.
4. Explicit failure-state handling (for example `invoice.payment_failed`) as first-class behavior.

Phase-2/3 systems required to inherit these patterns:
- Recommendation scheduler refresh endpoints.
- Living World contradiction scan scheduler.
- AI bot scheduler and generation runs.

## TASK-002: Canonical Reader Suggestion Model Decision

Decision:
- Canonical reader suggestion model is `EditSuggestion`.
- `SectionEditSuggestion` remains collaboration/editorial proposal workflow for creator/co-author editing and must not be used for reader typo queue semantics.

Rationale:
1. `EditSuggestion` is already aligned with reader interactions (`blockId`, text deltas, simple moderation states).
2. `SectionEditSuggestion` is tied to section-level collaborative editing and versioning.
3. Preserving domain separation reduces migration risk and avoids accidental permission crossover.

Reader suggestion flow contract:
1. Create: `POST /api/edit-suggestions`
2. Queue fetch: `GET /api/edit-suggestions?workId=&sectionId=&status=pending`
3. Moderate: `PATCH /api/edit-suggestions` or `/api/edit-suggestions/[id]/approve|reject`

Status vocabulary (canonical):
- `pending`
- `approved`
- `rejected`

Guardrails:
1. Creator moderation must enforce work ownership/collaborator permissions.
2. Reader cannot self-approve suggestion.
3. Suggestion transitions are one-way from `pending`.

## Completion Notes

- This audit intentionally defines contracts and ordering only.
- Schema/API implementation proceeds in Master Plan Phase 2 after Phase 1 gating artifacts are complete.