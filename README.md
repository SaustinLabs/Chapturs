# Chapturs.com — Live Application Archive

This repository contains both the **live production codebase** and a structured archive of product/technical documentation, decisions, and feature plans for **Chapturs.com**.

## What This Repo Is
- A live Next.js 15 application (App Router) with 172 API routes across 40+ route groups
- Prisma ORM on PostgreSQL with 89 models in the schema (`prisma/schema.prisma`)
- Production deployment infrastructure (VPS + Vercel, PM2, Cloudflare)
- Structured archive of product/technical documentation, decisions, and feature plans
- Historical record of implementation notes, fixes, and deployment playbooks

## What This Repo Is Not
- A monolithic application — it's a working Next.js app with separate concerns (API routes, pages, components, libraries)
- Guaranteed to run locally without proper `.env` configuration (database URL, auth secrets, etc.)

## Documentation (Start Here)
- `VISION.md` — Project charter and core principles
- `DESIGN.md` — Full design system spec (colors, typography, components)
- `CODEBASE_MAP.md` — Detailed architecture map of routes/models/services
- `TASKS.md` — Active development tasks and priorities
- `WORKERS.md` — Worker instructions for autonomous development

## Documentation Index
All source documents live under:
- `docs/source/features/` — Feature documentation
- `docs/source/implementations/` — Implementation notes
- `docs/source/plans/` — Architecture plans and contracts
- `docs/source/fixes/` — Bug fix records
- `docs/source/ops/` — Operations guides
- `docs/source/database/` — Database schema and migration docs
- `docs/source/testing/` — Testing documentation

Summaries and indexes live under:
- `docs/summaries/`
- `docs/architecture/` — Architecture contracts and plans
- `docs/operations/` — Operations guides (env matrix, release gates)
- `docs/security/` — Security audit records

## Quick Stats
|| Metric | Count ||
|--------|-------||
| API Routes | 172 ||
| Prisma Models | 89 ||
| Schema Lines | 2375 ||
| Source Files (src/) | 511 ||
| Components | 158 ||
| Libraries | 66 ||

## Notes
- Many documents include dates inside the files; filesystem timestamps may not reflect real chronology.
- Some legacy docs reference old filenames; use `docs/INDEX.md` to locate current paths.
- `.env.local` contains database connection strings and auth secrets — never commit this file.

If you're looking for the actual live product, visit **Chapturs.com**.
