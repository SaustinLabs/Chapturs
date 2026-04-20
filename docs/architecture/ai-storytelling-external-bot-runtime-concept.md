# External AI Storytelling Runtime Concept

Date: 2026-04-20
Owner: Platform Team
Related plans:
- plan/feature-ai-author-bots-1.md
- plan/architecture-buildout-master-1.md

## 1) Intent

Define a robust, external-runner architecture for AI story bots that:
1. Sleeps most of the time.
2. Wakes on schedule.
3. Generates exactly one chapter run per activation window.
4. Self-critiques and continuity-checks output.
5. Updates a long-horizon story plan artifact.
6. Publishes (or queues) safely.
7. Returns to sleep.

This document is designed as an implementation contract for a separate autonomous builder agent (for example Hermes Agent or OpenClaw).

## 2) Core Outcome

Each bot run must leave behind auditable artifacts:
1. Generated chapter draft.
2. Critique and quality analysis.
3. Continuity delta against canon and prior chapters.
4. Updated future-story planning document.
5. Run metadata (token use, latency, status, failure detail).

No run is considered complete unless all artifacts are persisted.

## 3) External Runtime Model

The runtime is intentionally outside the main web app process.

### Components

1. Bot Orchestrator Daemon
- Long-running service.
- Maintains wake schedule.
- Acquires per-work run lease before generating.

2. Scheduler Trigger Layer
- Time-based wake-up (cron or interval timers).
- Optional event-based trigger (manual admin push, backlog catch-up, urgent continuation).

3. Story Context Assembler
- Pulls recent chapters, character state, canon facts, unresolved plot threads, and style constraints.
- Produces a bounded context pack for LLM input.

4. Generation Worker
- Creates outline fragment for next chapter and draft chapter content.
- Uses OpenRouter models only, with required headers.

5. Critic and Continuity Worker
- Scores draft for continuity, pacing, clarity, and policy safety.
- Produces structured issue list and recommendation actions.

6. Plan Doc Updater
- Updates a future-story plan file (the bot brain) with:
  - newly committed canon facts,
  - deferred hooks,
  - open threads,
  - next chapter target intent.

7. Publisher Adapter
- Pushes approved content to Chapturs through admin-protected endpoints.
- Uses idempotency keys and run IDs.

8. Run Ledger
- Persists run statuses and metrics.
- Supports replay-safe semantics and postmortem debugging.

## 4) Bot Run State Machine

Canonical states (align with plan contracts):
1. queued
2. running
3. completed
4. failed
5. skipped

Transitions:
1. queued -> running: lease acquired.
2. running -> completed: all artifacts persisted and publish path returned success.
3. running -> failed: unrecoverable error or retry budget exhausted.
4. running -> skipped: duplicate run window, idempotency hit, or safety gate rejection with no retry.

## 5) Per-Run Lifecycle

1. Wake
- Scheduler invokes run candidate selection.

2. Lease
- Acquire lock for botId + workId + timeWindow.
- If lease denied, mark skipped (duplicate protection).

3. Context snapshot
- Fetch previous chapter window (for example last 3 to 8 chapters).
- Fetch canon summary and open story goals.
- Fetch bot persona and style constraints.

4. Draft generation
- Produce chapter candidate and short synopsis.

5. Quality analysis
- Critique candidate with explicit scoring rubric.
- If below threshold: revise loop up to bounded attempts.

6. Continuity analysis
- Extract proposed canon deltas.
- Detect contradictions against known canon.

7. Plan update
- Update future-story planning doc with accepted deltas and next-step hooks.

8. Publish or queue
- If all checks pass, publish chapter.
- Else queue for human moderation with full analysis packet.

9. Persist run ledger
- Save run result, token/cost metrics, timing, and final status.

10. Sleep
- Release lock and return idle until next schedule.

## 6) Required Data Artifacts

For each bot/work pair, maintain a stable workspace tree:

1. bot-workspace/{botId}/{workId}/story-plan.md
- Living future-story plan.

2. bot-workspace/{botId}/{workId}/canon-ledger.json
- Structured canon entities and facts.

3. bot-workspace/{botId}/{workId}/run-history/{runId}.json
- Full run metadata and step outputs.

4. bot-workspace/{botId}/{workId}/chapter-drafts/{runId}.md
- Raw or revised chapter draft.

5. bot-workspace/{botId}/{workId}/analysis/{runId}.json
- Critique scores, violations, continuity findings.

## 7) Continuity and Planning Contract

The story-plan file is the long-memory source for upcoming chapter intent.

Minimum required sections:
1. Story north star (theme and endpoint).
2. Current arc status.
3. Character states and unresolved promises.
4. Canon facts committed so far.
5. Hard constraints (must not violate).
6. Near-term chapter queue (next 3 to 5 goals).
7. Open risks and ambiguity notes.

Update rule:
- Every completed run must include a deterministic patch entry in the plan file with runId, timestamp, and rationale.

## 8) Prompt and Output Contract for External Builder Agent

The external agent should implement three deterministic prompt modes.

1. generate_chapter
- Input: context pack, story-plan excerpt, canon constraints, target beat.
- Output: chapter text + short beat summary.

2. critique_chapter
- Input: chapter draft + canon ledger + quality rubric.
- Output: numeric scores and actionable revision directives.

3. update_story_plan
- Input: accepted draft + critique summary + continuity diff.
- Output: plan patch with updated hooks and next targets.

All outputs should be machine-parseable JSON plus human-readable markdown where relevant.

## 9) Safety and Policy Gates

1. Auth and access
- Only admin-authorized runtime keys may call bot publish endpoints.

2. Idempotency
- Every run uses deterministic idempotency key:
  botId:workId:scheduleWindow

3. Replay safety
- Duplicate window requests must return skipped without side effects.

4. Quality floor
- Must pass configured minimum score thresholds before publish.

5. Policy checks
- Run existing content validation and moderation checks before go-live.

6. Transparency
- All bot-authored content must remain labeled AI Author.

## 10) Observability Requirements

Every run must emit structured logs with:
1. botId
2. workId
3. runId
4. operation
5. state
6. latencyMs
7. model
8. tokenUsage
9. errorMessage (if any)

Alerting triggers:
1. consecutive failures over threshold.
2. contradiction rate spike.
3. schedule lag beyond SLA.
4. publish rejection burst.

## 11) API Surface (Conceptual)

These endpoints are expected for integration (names can vary in implementation):

1. POST /api/admin/bots/runtime/lease
- Acquire run lease and idempotency check.

2. POST /api/admin/bots/runtime/context
- Fetch context snapshot package.

3. POST /api/admin/bots/runtime/report
- Persist run artifacts and state transitions.

4. POST /api/admin/bots/runtime/publish
- Publish approved chapter (or queue moderation).

5. GET /api/admin/bots/runtime/next
- Pull next scheduled candidate for processing.

All endpoints require admin role + secret/token validation.

## 12) Failure Handling

1. Transient LLM errors
- Retry with bounded exponential backoff.

2. Hard continuity conflict
- Mark failed or queued_for_review and include contradiction packet.

3. Publish endpoint failure
- Keep artifacts; do not discard run output; resume from publish stage with same runId.

4. Orchestrator crash mid-run
- Recover from run ledger on restart and continue idempotently.

## 13) Build Plan for Separate Agent

Phase A: Skeleton runtime
1. Daemon process with schedule tick.
2. Lease and run state machine.
3. Basic report pipeline.

Phase B: Content intelligence
1. Context assembler.
2. Generator and critic loops.
3. Plan updater.

Phase C: Production hardening
1. Retry, backoff, and dead-letter handling.
2. Metrics and alerting.
3. Security hardening and key rotation.

Phase D: Policy and quality
1. Validation integration.
2. Human-review fallback lane.
3. Regression suite for continuity and idempotency.

## 14) Acceptance Criteria

1. No duplicate chapter publish for same schedule window.
2. 100 percent of runs produce full artifact bundle.
3. Story-plan doc is updated after every completed run.
4. Failed runs are diagnosable from logs plus run-history artifacts.
5. AI labeling remains present in feed and story surfaces.
6. External runtime can be stopped/restarted without losing determinism.

## 15) Notes for Hermes Agent or OpenClaw Executor

1. Treat this document as the authoritative runtime contract.
2. Implement deterministic I/O first, then model quality loops.
3. Do not couple runtime process lifecycle to web server lifecycle.
4. Prefer explicit contracts, strict JSON payloads, and replay-safe behavior.
5. Keep model provider usage aligned with project OpenRouter constraints.
