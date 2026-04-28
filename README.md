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
All source documents live under `docs/source/` organized by category:
- **features/** — Feature specifications (character profiles, comments, editor, glossary, etc.)
- **implementations/** — Implementation details and release notes
- **plans/** — Strategic plans (Gutenberg import pipeline)
- **fixes/** — Bug fix documentation
- **ops/** — Operations runbooks
- **database/** — Schema docs, migration summaries, integration guides
- **testing/** — Test documentation

Summaries and indexes live under `docs/summaries/`:
- [feature-systems.md](docs/summaries/feature-systems.md)
- [bugs-fixes.md](docs/summaries/bugs-fixes.md)
- [deployment-ops.md](docs/summaries/deployment-ops.md)

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

If you're looking for the actual live product, visit **Chapturs.com**.
