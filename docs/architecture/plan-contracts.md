# Buildout Plan Contracts

Date: 2026-04-20
Owner: Platform Team
Applies to:
- `plan/architecture-buildout-master-1.md`
- `plan/feature-monetization-completion-1.md`
- `plan/feature-ecosystem-expansion-1.md`
- `plan/feature-writers-room-living-world-1.md`
- `plan/feature-ai-author-bots-1.md`

## 1. Shared Enum Contracts

### 1.1 Recommendation Reason Codes

Canonical values:
- `author_pick`
- `collab_signal`
- `reader_to_reader`
- `semantic`
- `trending`
- `popular`

Contract:
- APIs returning related-work recommendations must include one of the above values.
- UI label text may vary, but data value must remain stable.

### 1.2 Suggestion Statuses

Canonical values:
- `pending`
- `approved`
- `rejected`

Contract:
- Reader suggestions (`EditSuggestion`) and section collaboration suggestions (`SectionEditSuggestion`) must expose compatible moderation-state semantics.
- State transitions allowed: `pending -> approved` and `pending -> rejected` only.

### 1.3 Scheduler Run States

Canonical values:
- `queued`
- `running`
- `completed`
- `failed`
- `skipped`

Contract:
- Any scheduled pipeline (recommendation refresh, living-world scans, AI bot publish) must emit one of these states to structured logs and run records.

## 2. Cross-Cutting Operational Contracts

### 2.1 Idempotency

- Any webhook- or scheduler-triggered write path must define an idempotency key.
- Replays must be safe and result in `skipped` state when duplicate key is detected.

### 2.2 Authorization

- Admin routes require admin session checks.
- Creator moderation routes require work ownership or collaborator permission.
- World-governance mutation routes require world founder/council/admin checks.

### 2.3 Observability

- Structured logs required for all payment webhooks, scheduler runs, and world-governance mutations.
- Logs must include actor (system/user), entity id, operation, status, and error message where relevant.

## 3. Interface Stability Rules

1. Existing response keys may be extended but not removed without explicit migration note.
2. Public API behavior changes must include backward-compatible defaults.
3. Any contract changes require updates to this file and affected plan tasks in same PR.

## 4. Mobile and UX Constraints

1. No separate mobile code paths.
2. New UI surfaces must reuse responsive layout patterns already present.
3. Reader-facing status labels should be concise and non-technical.

## 5. LLM Provider Contract

1. OpenRouter only.
2. Required headers on LLM calls:
   - `HTTP-Referer: https://chapturs.com`
   - `X-Title: Chapturs`
3. Models must align with project conventions in `.github/copilot-instructions.md`.