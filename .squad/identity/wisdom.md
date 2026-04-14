---
last_updated: 2026-04-14T18:57:12.439Z
---

# Team Wisdom

Reusable patterns and heuristics learned through work. NOT transcripts — each entry is a distilled, actionable insight.

## Patterns

**Pattern:** All environment variables come from GitHub Secrets → written to `.env.production` at deploy time in `.github/workflows/deploy-vps.yml`. **Context:** When adding new features that need env vars, document them in `.env.example` AND add them to the deploy workflow secrets block.

**Pattern:** API routes that do heavy work (LLM calls, image processing) should be fire-and-forget where possible (`.catch(() => {})`). **Context:** Reader experience must never stall waiting for background AI work.

**Pattern:** Database migrations run via `prisma db push` in the deploy workflow — NOT `prisma migrate deploy`. **Context:** When adding Prisma schema fields, they go into `schema.prisma` directly and are applied on next deploy.

**Pattern:** The feed algorithm (`/api/feed`) uses `community_genres` cookie for cold-start genre preference. **Context:** Set this cookie in community join links.

**Pattern:** Admin auth is double-guarded: middleware (`middleware.ts`, edge) AND server layout (`src/app/admin/layout.tsx`, Node.js). **Context:** Never remove one guard — both are required for defence-in-depth.

**Pattern:** LLM translation is cached to `FanTranslation` table after first fetch (upsert on `(chapterId, languageCode, tier)`) to avoid re-translating on every read. **Context:** Check this table before calling OpenRouter.

**Pattern:** Cover images may be base64-encoded in DB. Use `resolveCoverSrc()` helper + the `/api/proxy-image` route. **Context:** Always use this helper when rendering cover art, never read the column directly.

**Pattern:** Quality assessment only runs on the FIRST chapter of a new work, plus milestones (5/10/20/50 chapters). **Context:** Do not trigger QA on every chapter save — it's intentionally gated.

**Pattern:** `TASKS.md` in repo root is the master task list. Check it before building any feature. Update it (same commit) after shipping. Public pages `/about/roadmap` and `/features` must stay in sync with TASKS.md state. **Context:** Applies to every feature task.
