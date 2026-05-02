# Chapturs.com Project Archive

This repository is the project archive for **Chapturs.com**. It contains both the live application source code and structured product/technical documentation.

## Quick Start

| Document | Purpose |
|----------|---------|
| [VISION.md](VISION.md) | Product vision, core pillars, growth strategy |
| [DESIGN.md](DESIGN.md) | Design system tokens, components, color palette |
| [CODEBASE_MAP.md](CODEBASE_MAP.md) | Complete map of pages, API routes, components, libraries |
| [WORKERS.md](WORKERS.md) | Agents, cron jobs, AI workers, deployment pipeline |
| [TASKS.md](TASKS.md) | Master task list with status tracking |

## What This Repo Is
- The **live application** — a Next.js 15 App Router project deployed to VPS via GitHub Actions
- A structured archive of product/technical documentation, decisions, and feature plans
- A historical record of implementation notes, fixes, and deployment playbooks
- A convenient single place to track progress on Chapturs.com

## What This Repo Is Not
- A maintained build target for local development (requires VPS environment)
- Guaranteed to run or deploy without additional work (needs secrets + DB connection)

## Documentation (Start Here)
- [VISION.md](VISION.md) — Product vision and growth strategy
- [DESIGN.md](DESIGN.md) — Design system tokens, components, color palette
- [CODEBASE_MAP.md](CODEBASE_MAP.md) — Complete map of pages, API routes, components, libraries
- [WORKERS.md](WORKERS.md) — Agents, cron jobs, AI workers, deployment pipeline
- [TASKS.md](TASKS.md) — Master task list with status tracking

## Documentation Index (`docs/`)
- [docs/INDEX.md](docs/INDEX.md) — Master documentation index and navigation guide
All source documents live under `docs/source/` organized by category:
- **features/** — Feature specifications (character profiles, comments, editor, glossary, etc.)
- **implementations/** — Implementation details and release notes
- **plans/** — Strategic plans (Gutenberg import pipeline)
- **fixes/** — Bug fix documentation
- **ops/** — Operations runbooks
- **database/** — Schema docs, migration summaries, integration guides
- **testing/** — Test documentation
- **visuals/** — Visual design documents

Summaries and indexes live under `docs/summaries/`:
- [feature-systems.md](docs/summaries/feature-systems.md)
- [bugs-fixes.md](docs/summaries/bugs-fixes.md)
- [deployment-ops.md](docs/summaries/deployment-ops.md)
- [database-data.md](docs/summaries/database-data.md)
- [roadmap-ideas.md](docs/summaries/roadmap-ideas.md)
- [testing-qa.md](docs/summaries/testing-qa.md)
- [security-sensitive.md](docs/summaries/security-sensitive.md)
- [methods-paths.md](docs/summaries/methods-paths.md)
- [visuals.md](docs/summaries/visuals.md)
- [source-index.md](docs/summaries/source-index.md)

### Architecture Docs (`docs/architecture/`)
- `ai-storytelling-external-bot-runtime-concept.md` — External AI bot architecture contract
- `migration-order.md` — Migration ordering guide
- `phase1-adoption-audit.md` — Phase 1 adoption audit
- `plan-contracts.md` — Plan contracts

### Operations Docs (`docs/operations/`)
- `env-matrix.md` — Environment variable reference matrix
- `monetization-launch-checklist.md` — Monetization go-live checklist
- `release-gates.md` — Release gate criteria

### Security Docs (`docs/security/`)
- `SECURITY_AUDIT_2026-04-04.md` — Security audit report from April 4, 2026

## Organization
All source documents live under:
- `docs/source/features/` — Feature specifications
- `docs/source/implementations/` — Implementation details
- `docs/source/plans/` — Strategic plans
- `docs/source/fixes/` — Bug fix documentation
- `docs/source/ops/` — Operations runbooks
- `docs/source/database/` — Database schema docs
- `docs/source/testing/` — Test documentation

## Notes
- Many documents include dates inside the files; filesystem timestamps may not reflect real chronology
- Some legacy docs reference old filenames; use `docs/summaries/source-index.md` to locate current paths
- CODEBASE_MAP.md and WORKERS.md were created April 28, 2026 as part of autonomous documentation audit
|- **May 1, 2026**: Comprehensive sixth-pass audit — all counts verified accurate (76 pages, 173 API routes, 159 components, 71 lib modules, 89 Prisma models); page count corrected from "75" → "76"; lib module counts clarified; audiobook APIs confirmed at 3 routes ✅
|- **May 1, 2026**: Ninth-pass audit — documentation index verified; `docs/` contains 110 total files across 6 categories (features/, implementations/, plans/, fixes/, ops/, database/); all referenced files exist; CODEBASE_MAP.md and WORKERS.md updated with ninth-pass corrections ✅

- **May 1, 2026**: Tenth-pass audit — lib total corrected from "71" → "72", non-test from "68" → "69"; TASKS.md Gutenberg file count corrected from "11" → "8"; all documentation files verified against live codebase ✅

If you're looking for the actual live product, visit **Chapturs.com**.
