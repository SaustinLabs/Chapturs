2026-04-14: Implemented suggestion API routes + Prisma migration
# Project Context

- **Owner:** stonecoldsam
- **Project:** Chapturs — webnovel platform (Next.js 15 App Router, TypeScript, Prisma, Supabase PostgreSQL)
- **Stack:** Next.js API routes, Prisma ORM, NextAuth v5, OpenRouter, Cloudflare R2, Resend, Supabase
- **Deploy:** VPS via GitHub Actions (NOT Vercel). Secrets in GitHub Secrets.
- **Created:** 2026-04-14

## Core Context

I'm Rusty, the Backend Dev on Chapturs. I own all API routes, Prisma, auth, LLM integration, and email.

**Critical patterns I follow:**
- LLM: OpenRouter only (`https://openrouter.ai/api/v1`). Never groq-sdk. Headers always include HTTP-Referer + X-Title.
- Email: `src/lib/email.ts` direct HTTP, fire-and-forget. Never install resend npm package.
- Prisma: `db push` in deploy workflow — not `migrate deploy`.
- New env vars: `.env.example` + deploy workflow secrets block.
- QA: First chapter only + milestones (5/10/20/50). Never every save.
- Translations: Cached to `FanTranslation` (upsert) after first LLM fetch.
- Admin guard: Both `middleware.ts` AND `src/app/admin/layout.tsx`. Never remove either.

**Key API routes I work in:**
- `src/app/api/works/` — work CRUD, publish flow, validation
- `src/app/api/quality-assessment/` — LLM content validation
- `src/app/api/chapter/` — chapter content + translation
- `src/app/api/admin/` — admin panel
- `src/app/api/user/` — auth, profile, settings

## Learnings

📌 Team hired on 2026-04-14. Universe: Ocean's Eleven. Working with Danny (Lead), Linus (Frontend), Basher (Tester).

### Session 2 — 2026-04-14 (Tasks #96, #97, #49b, #77, #66 prep)

**Schema extension pattern:**
- New models go at the end of `prisma/schema.prisma` after all existing models.
- Relation fields added to User model just before `@@map("users")`.
- `prisma db push` (not migrate deploy) applies schema changes on VPS deploy.

**Idempotent points pipeline:**
- Dedup key for `PointsLedger`: `userId + eventType + sourceId`. When sourceId is omitted the entry acts as a one-time per-user-per-eventType gate.
- `awardAchievement` uses Prisma `upsert` on the `@@unique([userId, achievementId])` constraint — cleanest way to make it a no-op on duplicate calls.
- `checkAndAwardFoundingCreator` counts `Section.status = 'published'` platform-wide; gate is ≤ 100. Idempotent because `awardAchievement` deduplicates.

**Admin trigger pattern:**
- Admin-only routes: check `session?.user?.role === 'admin'` (strict — not moderator).
- `computeCollaborativeSignals(workId)` runs per-work; batch over all published/ongoing works and let the MIN_CO_READS guard inside the function do the filtering.

**Sentry setup:**
- Three config files (client/server/edge) are identical in this setup — each entry point (browser, Node.js, edge runtime) imports its own file.
- `enabled: !!process.env.SENTRY_DSN` ensures zero-overhead no-op locally when DSN is absent — no try/catch needed.
- `withSentryConfig` wrapper in `next.config.js` handles source map upload and tunnel; `silent: true` suppresses noisy build output.
- `@sentry/nextjs: "^9"` added to package.json; `SENTRY_DSN=` (empty) added to `.env.example`.

**SiteSettings helper:**
- `src/lib/settings.ts` is the canonical place for typed SiteSettings helpers.
- `getPremiumEnabled()` reads `premium_enabled` key from SiteSettings (already seeded in `monetization` group by the settings init route).
- Stripe checkout route now gates on `getPremiumEnabled()` before touching Stripe env vars — flipping the flag in Admin → Settings activates the flow with no redeploy.

**Passive audit finds:**
- `groq-sdk@^1.1.1` is in `package.json` dependencies — violates architecture rule (OpenRouter only). Added TASKS.md item #114 to remove it.
