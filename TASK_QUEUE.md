# Task Queue

## Active Tasks (assigned by auditor)
<!-- Format: [PRIORITY] TASK | ASSIGNED_TO | DESCRIPTION -->
- [HIGH] Implement per-task briefs from auditor | BOTH | Auditor generates focused, task-specific instructions that reference WORKERS.md for base conventions. Each brief includes: scope, files to touch, success criteria, and relevant design docs. Workers read the brief before starting work.
- [MEDIUM] Audit recommendation engine design doc | BOTH | Review chapturs_auto_translation_system_design.md and related docs for gaps or inconsistencies with VISION.md principles.
- [LOW] Create automated import pipeline prototype | ECHO | Build a minimal proof-of-concept for the universal story importer (Phase 1 of auto-translation system).

## Off-Limits Tasks (auditor must NOT assign these)
- Living World / Lore Master system — too complex, do not touch any living-world code
- AI story writer bots — leave alone until explicitly requested

## Completed Tasks (archived)
- [2026-04-27] Test worker pipeline — verified end-to-end flow
- [2026-04-27] Map Chapturs codebase structure — comprehensive CODEBASE_MAP.md created (local commit 38e8dd5, push to origin)
- [2026-04-27] Configure git credentials for Chapturs repo — token auth working, branch hermes/codebase-map pushed
