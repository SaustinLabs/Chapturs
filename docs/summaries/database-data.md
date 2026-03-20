# Database & Data Summary

**Schema & API Map**
- Source: docs/source/database/API_DATABASE_MAP.md (Last Updated: September 17, 2025). Core Prisma models (User, Author, Work, Section, interactions), API endpoint map, service methods, and upload integration points.

**Database Provider Decisions**
- Source: docs/source/database/DATABASE_COMPARISON.md. Compares PlanetScale, Supabase, Neon, Railway, Vercel Postgres for write-heavy workloads; recommends Supabase free tier for no write limits and built-in auth/storage.

**Integration Guides**
- Source: docs/source/database/DATABASE_INTEGRATION.md and DATABASE_INTEGRATION_OLD.md. Supabase + Upstash setup, env var requirements, Prisma schema guidance, and migration strategy. (The main doc is noisy/unstructured but contains step-by-step setup info.)
- Source: docs/source/database/SETUP_DATABASE.md. Step-by-step for local `.env.local`, `npx prisma generate`, `npx prisma db push`, and verification in Supabase.
- Source: docs/source/database/SUPABASE_CONNECTION_STRINGS.md. Exact location of pooled vs direct connection strings; guidance on URL-encoding passwords.

**Migrations & Data Moves**
- Source: docs/source/database/PRISMA_MIGRATION_SUMMARY.md. Prisma migration/type cleanup summary.
- Source: docs/source/database/SUPABASE_MIGRATION_SUMMARY.md. Supabase + write optimization summary.
- Source: docs/source/database/DASHBOARD_REAL_DATA_MIGRATION.md. Creator dashboard migration from mock to real data.
- Source: docs/source/database/CHARACTER_SYSTEM_MIGRATION.md. Migration for character profile tables (fixes 500 error).

**Operational Notes**
- Env vars frequently referenced: `DATABASE_URL`, `DIRECT_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- Common commands: `npx prisma db push`, `npx prisma migrate deploy`, `npx prisma studio`.

**Consistency Warning**
- Some docs assume PlanetScale/MySQL; others assume Supabase/Postgres. Decide a single database target and update or archive the other track.
