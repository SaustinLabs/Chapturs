# Squad Decisions

## Active Decisions

### 2026-04-14: Stack & Deployment
**Decision:** Chapturs is a Next.js 15 App Router app deployed to a VPS (NOT Vercel) via GitHub Actions. Supabase PostgreSQL is the database. All secrets live in GitHub Secrets and are written to `.env.production` on the VPS at deploy time.
**Rationale:** VPS gives full control over the runtime and avoids Vercel edge limitations.
**Applies to:** All agents — never suggest Vercel deployment or Vercel env vars.

### 2026-04-14: LLM Provider
**Decision:** All LLM calls use **OpenRouter** (`OPENROUTER_API_KEY`), OpenAI-compatible SDK, base URL `https://openrouter.ai/api/v1`. Always add headers `{ 'HTTP-Referer': 'https://chapturs.com', 'X-Title': 'Chapturs' }`. Quality assessment model: `meta-llama/llama-3.3-70b-instruct`. Quick tasks: `meta-llama/llama-3.1-8b-instruct`.
**Rule:** Never add `groq-sdk` as a dependency. Never call Groq directly.

### 2026-04-14: Image Storage
**Decision:** All images/covers use Cloudflare R2 via `src/lib/r2.ts`. Proxy via `/api/proxy-image` for base64 fallback. Remote patterns are configured in `next.config.js`.
**Rule:** Use `<Image />` from Next.js with configured `remotePatterns`. Never store images in `public/`.

### 2026-04-14: Auth Strategy
**Decision:** NextAuth v5 with JWT strategy (`auth.ts` for Node.js, `src/auth-edge.ts` for middleware). OAuth providers: Google, GitHub, Discord. Admin guarded at BOTH middleware AND server layout (`src/app/admin/layout.tsx`) for defence-in-depth.
**Rule:** Never remove the double guard. Never use database sessions.

### 2026-04-14: Email (Resend)
**Decision:** Email uses direct Resend HTTP API in `src/lib/email.ts` — no npm package. All email calls are fire-and-forget (`.catch(() => {})`). FROM address is an env var.
**Rule:** Never install resend npm package. Never block requests on email sending.

### 2026-04-14: Quality Assessment
**Decision:** LLM quality assessment runs on FIRST CHAPTER ONLY for new users. Cumulative review at milestones 5/10/20/50 chapters. Validation calls go through `/api/quality-assessment/`.
**Rule:** Do not apply QA to every chapter — only first chapter + milestones.

### 2026-04-14: Task Tracking
**Decision:** `TASKS.md` in the repo root is the single source of truth. When a feature ships, mark it ✅ in TASKS.md and update `src/app/about/roadmap/page.tsx` + `src/app/features/page.tsx` in the same commit.
**Rule:** Always check TASKS.md before building a feature. Always update it after shipping.

### 2026-04-14: Site Settings
**Decision:** Runtime configuration lives in the `SiteSettings` Prisma table — admin-editable without redeploy. Groups: general, content, features, monetization, email.
**Rule:** Use SiteSettings for any value that ops might want to tune without a deploy.

### 2026-04-14: Monetization (Stripe)
**Decision:** Stripe integration exists but `premium_enabled` is currently false. Keys are set in secrets. Do not enable without complete end-to-end test.
**Applies to:** Task #66 — flip flag only after staging test.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
- TASKS.md is the master task list — always check before building


# Decision: Gutenberg Import Pipeline Architecture

**Author:** Danny  
**Date:** 2026-04-14  
**Status:** Accepted  
**Implements:** TASKS.md #21 · #22 · #23  
**Spec:** `docs/source/plans/gutenberg-import-pipeline.md`

---

## Decision

Implement a Project Gutenberg import pipeline as a single admin-only endpoint (`POST /api/admin/import/gutenberg`) backed by a service module at `src/lib/gutenberg-import/`. The pipeline is synchronous (no background job queue for v1), idempotent on the Gutenberg book ID stored as a tag, and uses a single shared "bot author" User/Author record (`chapturs_classics`) for all public domain works.

## Rationale

- **Synchronous over async (v1):** A Next.js Node.js route with `maxDuration = 120` is simpler than a job queue for a feature used a handful of times by one admin. Move to background queue (v2) only if import volume warrants it.
- **Bot user over synthetic authors:** Creating one Author record per historical author (Stoker, Dumas, etc.) would pollute the Author table and complicate subscription/follow flows with accounts that can never log in. A single `chapturs_classics` bot author keeps it clean.
- **Idempotency via tags:** The `Work.tags` JSON array is already searchable via `contains`. Storing `gutenberg:{id}` there avoids adding a new schema field and requires no migration.
- **OpenRouter `llama-3.1-8b-instruct` for glossary/characters:** Consistent with the platform LLM policy for quick tasks. Quality is sufficient for extracting named entities from literary texts.
- **Content format `{ blocks: [{ type: 'prose', text }] }`:** Aligns with `extractTextFromChaptDoc` in `assessment-sync.ts`. The older import route format (bare array) is inconsistent with the QA pipeline reader.

## Constraints Applied

- LLM: OpenRouter only (`meta-llama/llama-3.1-8b-instruct` for quick tasks)
- Images: Cloudflare R2 via `src/lib/r2.ts`
- Auth: Double-guard on admin route (session + role check in route handler; layout guard in admin tree)
- Deploy: Node.js runtime, not edge; `maxDuration = 120`
- No new npm packages; no new env vars beyond what already exists

## Affected Files

- **New:** `src/lib/gutenberg-import/` (7 modules)
- **New:** `src/app/api/admin/import/gutenberg/route.ts`
- **New:** `src/components/admin/GutenbergImportForm.tsx`
- **New:** `src/app/admin/import/page.tsx`
- **Updated:** `TASKS.md` rows #21, #22, #23 ↁE🔶

## Follow-on Actions

1. Assign implementation to Rusty (Backend).
2. Assign UI form to Linus (Frontend).
3. Assign smoke test + regression to Basher.
4. After 5 works are imported successfully, mark #21/#22/#23 ✁E
# Decision: Achievements & Points Schema

**Date:** 2026-04-14  
**Author:** Rusty (Backend Dev)  
**Tasks:** #96, #97, #100

## What was decided

Four new Prisma models added to support the Founding Creators Programme and future gamification:

| Model | Purpose |
|---|---|
| `Achievement` | Definition catalogue  Ekeyed by string slug (e.g. `founding_creator`) |
| `UserAchievement` | Award junction  E`@@unique([userId, achievementId])` enforces one award per user |
| `PointsLedger` | Append-only event log  Ededup key is `(userId, eventType, sourceId)` |
| `LevelTier` | Level thresholds  Elooked up by `minPoints ≤ totalPoints ORDER BY DESC` |

## Why this shape

- **Append-only ledger** over a single `totalPoints` counter: forensically auditable, easy to rebalance past awards by retroactively adding correction entries, immune to race conditions on concurrent updates.
- **String `eventType`** over a DB enum: allows adding new event types without a schema migration.
- **String `tier`/`category` on Achievement** over enums: same reasoning  Eadmin can add new tiers (e.g. "legendary") without a code change.
- **`isActive` flag on Achievement**: lets us soft-disable awards without deleting records.
- **`sourceId` on both `UserAchievement` and `PointsLedger`**: ties the award back to the triggering entity (chapterId, workId, etc.) for audit + dedup.

## Idempotency contract

`awardPoints(userId, eventType, points, sourceId?)`:
- If `sourceId` provided ↁEdedup on `(userId, eventType, sourceId)`.
- If `sourceId` omitted ↁEdedup on `(userId, eventType, sourceId=null)`  Etreats it as a one-time per-user-per-type event.

`awardAchievement(userId, achievementKey, sourceId?)`:
- Prisma `upsert` on `@@unique([userId, achievementId])`.
- Calls `awardPoints` for `achievement.pointValue` using `achievementId` as sourceId  Eso points are also idempotent.

## Points API

`GET /api/achievements/[userId]` returns:
- **Owner** (session.user.id === userId): all achievements + full stats.
- **Anyone else / guest**: featured achievements only + featured-only stats.

## Still needed

- Seed `Achievement` rows for founding_creator, first_chapter, glossary milestones.
- Seed `LevelTier` rows (Newcomer ↁEApprentice ↁEJourneyman ↁE…).
- Wire `checkAndAwardFoundingCreator` into the publish route (#100).
- Build profile block UI (#98, #99).
# Decision: Sentry SDK Setup

**Date:** 2026-04-14  
**Author:** Rusty (Backend Dev)  
**Task:** #77

## What was done

- `@sentry/nextjs: "^9"` added to `package.json` dependencies.
- Three entry-point config files created: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- `next.config.js` wrapped with `withSentryConfig(nextConfig, { silent: true, org: "", project: "" })`.
- `SENTRY_DSN=` (empty) added to `.env.example` with instructions.
- **Not yet activated**  ESENTRY_DSN must be added to GitHub Secrets to turn it on.

## Why this approach

**Graceful no-op design:** `enabled: !!process.env.SENTRY_DSN` means:
- Local dev: DSN absent ↁESentry initialises but captures nothing. Zero overhead, no errors.
- Production with DSN set: full error capture.
- Production without DSN set: still a no-op  Esafe to deploy before the Sentry project is created.

**Three config files (not one):** Next.js has three distinct runtimes  Ebrowser (client bundle), Node.js (API routes/server components), and edge (middleware). Each needs its own Sentry init. The files are identical for now but can diverge (e.g., edge config may need `integrations: []` in future).

**`silent: true` on withSentryConfig:** Suppresses verbose source-map upload logs during `next build` on the VPS. `org: ""` and `project: ""` are placeholders  Efill in from Sentry dashboard when activating.

## Activation checklist

1. Create a Sentry project at https://sentry.io ↁENext.js.
2. Copy the DSN from Client Keys.
3. Add `SENTRY_DSN=<dsn>` to GitHub Secrets.
4. Fill in `org` and `project` in `next.config.js` for source map uploads.
5. Mark task #77 ✁Ein TASKS.md.
# Decision: Achievements UI  EFrontend Contracts for Rusty

**Date:** 2026-04-14  
**Author:** Linus  
**Status:** Awaiting Rusty to implement API endpoints

---

## What shipped (UI side)

| File | Purpose |
|------|---------|
| `src/types/achievements.ts` | Shared types: `Achievement`, `UserAchievement`, `AchievementsResponse`, `AchievementTier`, `AchievementCategory` |
| `src/components/AchievementBadge.tsx` | Atomic badge  Ecircular, tier-coloured ring, CSS tooltip |
| `src/components/FeaturedAchievements.tsx` | Featured (lg, pinned row) + all-achievements (sm grid) with pin/unpin |
| `src/components/AchievementsBlock.tsx` | Profile section  Efetches achievements, shows level, loading skeleton, visibility toggle |
| `src/app/profile/[username]/page.tsx` | Wired: `<AchievementsBlock userId={user.id} isOwnProfile={isOwner} />` added below `ProfileLayout` |

---

## API contracts Rusty needs to implement

### GET `/api/achievements/[userId]`
Returns:
```json
{
  "achievements": [UserAchievement],
  "totalPoints": 1200,
  "level": { "level": 3, "title": "Storyteller", "badge": "📖", "minPoints": 1000 },
  "stats": { "total": 12, "featured": 2 }
}
```

### PATCH `/api/achievements/[userId]/featured`
Body: `{ "achievementId": "<id>", "isFeatured": true }`  
Response: `{ "ok": true }`  
Auth: session user must match `userId`.  
Constraint: max 4 featured at once  Ereject or auto-unfeature the oldest if exceeded.

### PATCH `/api/achievements/[userId]/visibility`
Body: `{ "visible": true }`  
Response: `{ "ok": true }`  
Auth: session user must match `userId`.  
Note: `visible` should persist to `UserProfile` or a new `achievementsVisible` field  Ecoordinate with schema owner.

---

## Design decisions

- **Tier colours:** bronze=`ring-amber-600`, silver=`ring-gray-400`, gold=`ring-yellow-400`, platinum=`ring-purple-400`
- **Size grid:** sm=8ÁE, md=12ÁE2, lg=16ÁE6 (Tailwind units)
- **Featured cap:** 4 pinned max  Eenforced client-side; API should also enforce
- **Visibility toggle:** optimistic update with revert on failure  Eno page reload needed
- **Empty state:** "No achievements yet  Estart writing!"  Eshown when `achievements.length === 0`
- **Tooltip:** CSS-only via Tailwind `group-hover:opacity-100`  Eno JS state required
# Security Review: Achievements System

**Reviewer:** Basher (Tester)  
**Date:** 2026-04-14  
**Target:** `src/lib/achievements/points.ts` + related API routes  
**Severity legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low

---

## Concerns for Rusty to Address

### 1. 🟠 Anti-abuse: `awardPoints` sourceId must be server-controlled  Enever trust the client

The idempotency check (`userId + eventType + sourceId`) only works as an anti-double-count measure if `sourceId` is a **server-generated identifier** (e.g. a chapter DB ID, a comment DB ID). If the points-award endpoint is ever reachable from the browser, a bad actor could:
- Fabricate arbitrary `sourceId` values to bypass idempotency and spam point events, or
- Replay authenticated requests with new `sourceId` values to farm points indefinitely.

**Recommendation:**
- Points-award functions (`awardPoints`, `awardAchievement`) must be **called only from server-side code** (API route handlers, server actions, queue processors). They must never be directly exposed as callable endpoints.
- `sourceId` must always be resolved from a trusted server-side context (e.g. `chapterId` comes from the DB query result that triggered the event, not from the request body).
- Add a comment at the top of `points.ts` making this constraint explicit.

---

### 2. 🟠 Race condition: `checkAndAwardFoundingCreator` at the 100-chapter threshold

`checkAndAwardFoundingCreator` counts published chapters and awards the badge if the count is ≤ 100. Under concurrent load (e.g. multiple authors publishing near-simultaneously when the platform is approaching 100 total chapters), the count-and-award sequence is not atomic. Multiple requests could each read a count of 100 and each proceed to award the badge.

**Recommendation:**
- Wrap the count + `userAchievement.create` in a **DB transaction** (`prisma.$transaction`).
- Use a unique constraint on `(userId, achievementKey)` in the `userAchievement` table so that even if the race wins, the DB-level constraint prevents a duplicate record. Handle the unique-violation error silently (idempotent no-op).
- Example pattern:
  ```typescript
  await prisma.$transaction(async (tx) => {
    const count = await tx.section.count({ where: { status: 'published' } })
    if (count > 100) return
    await tx.userAchievement.create({ ... }) // DB unique constraint catches the race
  })
  ```

---

### 3. 🟡 Featured achievements cap must be enforced server-side

`AchievementsBlock` sends `PATCH /api/achievements/[userId]/featured` with `{ achievementId, isFeatured: true }`. The cap of 4 featured achievements is currently enforced client-side in `FeaturedAchievements.tsx` (the pin button is hidden when `featured.length >= 4`).

A user bypassing the UI (curl, DevTools, etc.) could issue PATCH requests to feature more than 4 achievements.

**Recommendation:**
- The `/api/achievements/[userId]/featured` handler (Rusty: to be implemented) must count the user's currently featured achievements **before** performing the update:
  ```typescript
  const featuredCount = await prisma.userAchievement.count({
    where: { userId, isFeatured: true },
  })
  if (isFeatured && featuredCount >= 4) {
    return Response.json({ error: 'Featured cap reached (max 4)' }, { status: 400 })
  }
  ```
- The client-side guard stays as a UX convenience; the server guard is the real enforcement.

---

### 4. 🟡 Points rate-limiting: chapter-publish events if deletion is ever allowed

If a user can publish and then soft-delete or unpublish a chapter and republish it (now or in a future sprint), they could repeatedly trigger `CHAPTER_PUBLISH` point events. The `sourceId`-based idempotency prevents this **only if** the same chapter ID is reused after republishment.

If deletion creates a new section record with a new ID, or if unpublish + re-publish resets the `sourceId`, the idempotency fails and each republish awards fresh points.

**Recommendation:**
- Before awarding chapter-publish points, verify that the section's `status` is `published` in the DB (server-side check, not from request body).
- If soft-deletes are introduced: also check that the section has not been previously awarded points by querying `pointEvent` for `(userId, CHAPTER_PUBLISH, sectionId)` regardless of deletion state.
- Consider a time-window cooldown for high-frequency event types if sourceId-based idempotency is insufficient.

---

## Summary

| # | Concern | Severity | Owner |
|---|---------|----------|-------|
| 1 | `awardPoints` must be server-only; never trust client sourceId | 🟠 High | Rusty |
| 2 | `checkAndAwardFoundingCreator` race condition at 100-chapter threshold | 🟠 High | Rusty |
| 3 | Featured achievements cap (max 4) must be enforced server-side | 🟡 Medium | Rusty |
| 4 | Chapter-publish point farming via delete/republish cycle | 🟡 Medium | Rusty |

---

*Filed by Basher  E2026-04-14. No action needed from Danny or Linus until Rusty reviews.*
