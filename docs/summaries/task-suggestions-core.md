# Task Suggestions (Core, Ops, and Docs)

This document proposes scoped, high-leverage tasks based on the existing archive. Each item references current docs and includes a small acceptance checklist.

## 1. Pick a Canonical Database Track
Reason: Docs conflict between PlanetScale/MySQL and Supabase/Postgres. This will confuse future readers and implementations.
Reference: docs/source/database/DATABASE_COMPARISON.md, docs/source/ops/VERCEL_DEPLOYMENT_GUIDE.md, docs/source/database/DATABASE_INTEGRATION.md
Acceptance:
- One DB track is designated primary.
- The non-primary track is either archived or clearly labeled historical.
- .github/copilot-instructions.md points to the primary track only.

## 2. Rotate and Centralize Secrets Guidance
Reason: The archive previously contained real credentials. Even after scrubbing, treat those keys as compromised.
Reference: docs/summaries/security-sensitive.md, docs/source/ops/VERCEL_ENV_SETUP.md, docs/source/fixes/VERCEL_SERVER_ERROR_FIX.md
Acceptance:
- R2 keys and AUTH_SECRET are rotated.
- Docs use placeholders only.
- A short "Secrets Handling" doc exists explaining rotation policy.

## 3. Remove or Gate Diagnostic Endpoints
Reason: Creator-works fix endpoints are explicitly temporary and expose sensitive data.
Reference: docs/source/fixes/PR_SUMMARY.md, docs/source/fixes/QUICK_START_FIX.md
Acceptance:
- Debug endpoints are removed or behind an admin-only gate.
- A note in docs explains the change and migration path.

## 4. Resolve Cron Strategy for Background Jobs
Reason: Vercel Hobby plan limits conflict with current cron expectations.
Reference: docs/source/ops/VERCEL_CRON_LIMITATIONS.md, docs/source/features/QUALITY_ASSESSMENT_SYSTEM.md
Acceptance:
- One strategy chosen: on-demand triggers, external cron, or Pro plan.
- Implementation and docs match the chosen strategy.

## 5. Add a Docs Link-Lint Script
Reason: Many docs reference other docs by filename. Links can drift as files move.
Reference: docs/INDEX.md, docs/summaries/source-index.md
Acceptance:
- A simple script checks for broken docs references.
- A short "How to run" note is added to docs/INDEX.md.

## 6. Build a Timeline Summary from In-File Dates
Reason: File timestamps are not reliable. Several docs include actual dates in content.
Reference: docs/summaries/source-index.md
Acceptance:
- A new doc `docs/summaries/timeline.md` summarizes key dated events.
- At least 10 milestones with dates and source references.
