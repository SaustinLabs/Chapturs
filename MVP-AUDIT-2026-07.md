# Chapturs MVP Readiness Audit

> Compiled: July 5, 2026
> Sources: TASKS.md (stale @ April 14), git log (through July 5), source code inspection, chapturs skill file
> **TASKS.md is stale.** Many items marked ⬜/🔶 were completed in May-June 2026 commits. This audit cross-references code, not just docs.

---

## SECTION 1: 100% COMPLETE — Ship-Ready

### Reader Experience
- **Homepage** — server-rendered, auth resolved before paint. HomeHero (unauthenticated) + HomeWelcome (authenticated with taste survey). InfiniteFeed hydrates after SSR.
- **Feed/Discovery** — StoryCards with cover art, genre badges (ui/Badge), status badges. FeedCard wrapper handles bookmark/like/subscribe. Per-card subscription check (N+1 — deferred, not blocking).
- **Browse** — URL-driven filters (genre, status, sort), cover-image grid, load-more.
- **Trending** — `/trending` with time filters, rank badges for top 3.
- **New & Promising** — horizontal scroll strip on homepage.
- **Onboarding** — 2-step: username + book taste via Google Books API. Middleware-based redirect (no popup). `hasSetUsername` JWT claim.
- **Empty states** — unauthenticated: genre quick-picks. Authenticated: TasteProfileSurvey modal.
- **Chapter reader** — TipTap-rendered prose blocks, glossary term highlighting (aliases work), character tooltips, reading settings drawer (font/theme/line-height/brightness), translation banner, mobile glossary bottom sheet.
- **Continuous scroll** — `?mode=scroll` URL param, IntersectionObserver infinite loading, URL updates on chapter boundary.
- **Feed back-navigation** — `src/lib/feedCache.ts` snapshots items+page+scroll on unmount, restores on mount. `staleTimes.dynamic: 30` in next.config.js.
- **SPA navigation** — zero `window.location.href`. Everything uses `router.push()` or `<Link>`.
- **SEO** — og:image + og:description per story/chapter. Canonical URLs on paginated pages. Sitemap includes all public routes.

### Creator Experience
- **Dashboard** — server-rendered, auth + Prisma prefetch, stats before paint.
- **Works management** — table layout, ui/Badge statuses, EmptyState, Skeleton loading.
- **Chapter editor** — TipTap with FontFamily extension (8 serif/sans/mono families), smart paste pipeline (Google Docs/Word HTML → ContentBlock[]), publishing flow entry picker (write/upload/paste).
- **Publish flow** — validates ALL sections, PrePublishChecklist with server-side checks, mature content confirmation modal, dry-run `/api/works/[id]/validate`.
- **Maturity gate** — `MaturityGate.tsx` interstitial for R/NC-17 works, localStorage consent.
- **AI-use disclosure** — `aiUseDisclosure` field on Work (none/assisted/generated), radio selector in edit page, badge on story page.
- **Series/Volumes** — CRUD APIs, SeriesManager UI, reader page at `/series/[id]`, series subscription, series badges on story pages.

### Glossary & Characters
- **Glossary** — chapter-aware definitions with versioning, hover tooltips, API for create/get by chapter. Aliases now stored AND matched in reader text (both SELECT and mapping fixed). CSS: subtle dotted underline, no hyperlink look.
- **Characters** — chapter-aware profiles with relationships, tooltip highlights, editor/sidebar integration, relationship management.

### Comments
- 3-level threading, likes, reports, moderation queue, pin/hide, rate limits (3/min), edit window (5 min). Dark mode. ui/Skeleton + ui/EmptyState.

### Translation System
- Real LLM translation via OpenRouter (`meta-llama/llama-3.1-8b-instruct`).
- Persisted to DB (upsert — no re-translate). Rate-limited (20 req/hr/IP). Chunked for >50 blocks.
- Translation banner with "Show original" one-tap revert. Reader suggestion form + star rating. Auto-promote community translations at ≥5 votes + ≥4.0 avg.
- Language preference from user profile, fallback to `navigator.language`.

### Achievement System (built June 2026)
- **Schema** — Achievement, UserAchievement, PointsLedger, LevelTier. 18 achievements + 5 tiers seeded.
- **Triggers wired:** chapter publish (10pts + founding_creator check + First! window), glossary entry (5pts + milestone check), character profile (milestone check), comment (3pts), featured comment (30pts + badge), first read (5pts).
- **First reader claim** — `POST /api/achievements/claim-first-reader`, ≥60s dwell + scroll qualification.
- **Milestones** — glossary (10/25/50/100 entries), characters (25/50/100), chapters (first, ten).
- **Profile** — AchievementsBlock with visibility toggle, FeaturedAchievements with 4-pin cap.
- All fire-and-forget (`.catch(() => {})`) — never blocks API responses.

### Design System (Phase 0)
- DESIGN.md (371 lines) — canonical design authority.
- `src/components/ui/` — Button (4 variants), Card (hover-lift), Badge (6 variants), Skeleton (3 shapes), EmptyState.
- Tailwind tokens wired — brand colors, typography scale, border radius, spacing, shadows.
- Zero type errors — `ignoreBuildErrors: true` removed. `eslint.ignoreDuringBuilds: true` still on.

### "Readers Also Enjoyed"
- Smart cascade: author picks → collaborative signals → reader-to-reader co-completion → semantic LLM Jaccard → trending → popular.
- `WorkSemanticProfile` + `AuthorRecommendation` schema. `/api/works/[id]/related` returns `reasonCode` + `reasonLabel`.
- Author-curated picks UI (max 4, auto-save). Recommendation refresh cron (`0 */6 * * *`).

### Infrastructure
- **Auth** — NextAuth v5 (Google OAuth), unified `@/auth` for API routes, `auth-edge` for middleware only.
- **Database** — Supabase PostgreSQL via Prisma. Session pooler for IPv4-only VPS/WSL2.
- **Deploy** — VPS (RackNerd 104.168.117.163) via GitHub Actions + PM2. Standalone output, zero Vercel.
- **Storage** — Cloudflare R2 presigned uploads.
- **Cache** — Upstash Redis (raw fetch — no SDK dependency).
- **Email** — Resend (welcome, rejection, notifications).
- **Error tracking** — Sentry SDK installed, graceful no-op if DSN unset.
- **Ads** — AdSense slots rendering, adblock false-positive fixed.
- **Prisma** — singleton via PrismaService. Zero `new PrismaClient()` outside it.

### Legal/Policy
- DMCA page (`/dmca`) with takedown + counter-notice.
- Terms of Service with AI-generated content rules (Section 5).
- Privacy policy with GDPR/CCPA — `DELETE /api/user/account` cascade delete, Danger Zone UI.
- Age verification — MaturityGate interstitial.

---

## SECTION 2: NEEDS WORK — Pre-Launch Blockers & High-Impact Gaps

### 🔴 BLOCKING: `prisma db push` on production (TASKS.MD #3)
**What:** Schema has `CommunityLink.signupCount` + `User.communityRef` that aren't pushed to the production DB.
**Risk:** Community referral link tracking is broken until this runs. Feature is wired in code — just needs the DB columns.
**Fix:** `npx prisma db push` on VPS. One command. Do this before anything else.

### 🟠 HIGH PRIORITY: Gutenberg import pipeline — needs to be RUN (TASKS.MD #21-23)
**Code state:** Complete. 6 files in `src/lib/gutenberg-import/` + `POST /api/admin/import/gutenberg` admin route.
**What's missing:** Nobody has actually POSTed to the endpoint on production. The pipeline exists but the platform has zero seed content.
**Recommended import list:** Dracula (#345), Pride and Prejudice (#1342), Count of Monte Cristo (#1184), Frankenstein (#84), Sherlock Holmes (#1661).
**Known issue:** Some imported chapters have title/content corruption (Frankenstein, Holmes). Fix script exists at `references/gutenberg-title-fix.js`.
**Cost:** ~$2.50 total in OpenRouter credits (5 works × ~$0.50 each with Claude Sonnet 4 for quality).
**Why this matters:** A content platform launching with zero content is a graveyard. Import these before anyone visits.

### 🟠 HIGH PRIORITY: Stripe monetization — gated behind boolean (TASKS.MD #66-68)
**Code state:** Complete. Checkout flow, webhooks, payout state machine, admin UI — all built and tested.
**What's missing:** `premium_enabled: false` in SiteSettings. The 78-line monetization launch checklist (`docs/operations/monetization-launch-checklist.md`) has not been executed.
**Steps to activate:**
1. Verify Stripe secrets in GitHub Actions (prod keys, not test)
2. Configure webhook endpoint in Stripe Dashboard
3. Create Product + Price in Stripe
4. Run Stripe CLI verification locally
5. Flip `premium_enabled` to `true` in Admin → Settings
**Risk:** Zero redeploy needed — it's a feature flag. But the checklist must be executed before launch.

### 🟠 HIGH PRIORITY: Email verification (TASKS.MD #7-8)
**What:** Welcome email and chapter rejection email exist in code but have never been tested end-to-end.
**Risk:** First signups get no welcome email. First moderation action sends no rejection notice. Terrible first impression.
**Fix:** Create a test account → verify Resend fires. Create a moderation queue item → verify rejection email.

### 🟡 MEDIUM: API keys for auxiliary services (TASKS.MD #108)
**What:** `GOOGLE_BOOKS_API_KEY`, `GOOGLE_CLOUD_VISION_API_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` not in GitHub Secrets.
**Impact:**
- Google Books API: onboarding book search is degraded (Google Books API works without a key at reduced rate — may be OK for low-traffic launch)
- Cloud Vision: image moderation is no-op (falls back to URL-only check)
- reCAPTCHA: no bot protection on forms
**Priority:** Vision + reCAPTCHA are security/trust features — ship without them if needed, but add before traffic grows.

### 🟡 MEDIUM: DNS health check (TASKS.MD #6)
**What:** Verify R2, Resend DKIM, Cloudflare email routing coexist without conflict.
**Risk:** Low. No known issues. Precautionary audit.

### 🟡 MEDIUM: Typo suggestion popover polish (TASKS.MD #44)
**What:** Reader highlight → suggest typo route exists and is hardened, but needs ChapterBlockRenderer-native popover wiring for a clean UX.
**Impact:** Feature works (submission endpoint works), just not as smooth as it should be. Not a launch blocker.

---

## SECTION 3: CAN WAIT — Post-MVP / Growth Phase

### Monetization Operations
- **Weekly email digest** (TASKS.MD #28) — requires cron batching logic. Nice for retention, not launch-critical.
- **Web push notifications** (TASKS.MD #29) — service worker, browser permissions. Skip for MVP.

### Collaborative Editor (Phase 3 — remaining)
- Change suggestion mode (TASKS.MD #40) — propose edit → accept/reject
- Version history with per-author attribution (TASKS.MD #41)
- Real-time co-editing, WebSocket/cursor presence (TASKS.MD #42-43)
- **Note:** Chapter locking, role-based permissions, activity log, and co-author invite are already done. These 4 items are the "real-time" layer on top.

### Living World (Phase 5 — remaining)
- Vector-indexed lore store (TASKS.MD #54) — postgres LIKE fallback exists
- **Note:** Everything else in Phase 5 is complete: schema, APIs, World Definition UI, Lore Master AI, Canon Graph, World Council, World Atlas, Lore Index, Timeline View, feed badges. This is a working system.

### AI Author Bots (Phase 6)
- Entirely unstarted. This is structural filler for cold-start — deprioritized if human content exists.

### Operational Hygiene
- VPS resource audit (TASKS.MD #78) — check RAM/disk/CPU headroom
- Log rotation on PM2 (TASKS.MD #79) — prevent disk fill
- Uptime monitoring (TASKS.MD #76) — UptimeRobot free tier
- Content hash duplicate detection (TASKS.MD #31)
- Loading skeleton coverage for remaining pages (TASKS.MD #75)

### Business/Marketing
- Founding Creator outreach — identify targets, draft pitch, generate referral links (TASKS.MD #24-26)
- Release cadence UX (TASKS.MD #106)
- Founder program policy doc (TASKS.MD #107)
- Landing page copy review (TASKS.MD #71)
- `/features` + `/about/roadmap` sync with current state (TASKS.MD #70, #109)

---

## SECTION 4: MVP LAUNCH CHECKLIST (Minimum Viable)

Do these **before** showing the platform to anyone outside the team:

| # | Task | Effort | Blocks |
|---|------|--------|--------|
| 1 | `prisma db push` on production DB | 5 minutes | Community referral tracking |
| 2 | Run Gutenberg import for 5 works | 30 minutes (API calls) | Platform has content |
| 3 | Fix Gutenberg title corruption (Frankenstein, Holmes) | 15 minutes | Reader experience on 2/5 imports |
| 4 | Test welcome email end-to-end | 10 minutes | New user first impression |
| 5 | DNS health check (R2/Resend/CF) | 10 minutes | Precautionary |
| 6 | Verify OAuth login flow works on production | 5 minutes | Can't sign up |
| 7 | Verify chapter publish → read flow end-to-end | 15 minutes | Core loop |
| 8 | Add `GOOGLE_BOOKS_API_KEY` to GitHub Secrets | 5 minutes | Onboarding search (nice-to-have) |

**Total effort:** ~90 minutes of ops work. No code changes needed for items 1-6.

### Optional for MVP (add before wider launch):
| # | Task | Effort |
|---|------|--------|
| 9 | Stripe monetization go-live (per checklist) | 1-2 hours |
| 10 | Google Cloud Vision API key | 5 minutes |
| 11 | reCAPTCHA keys | 10 minutes |
| 12 | Landing page copy refresh | 30 minutes |

---

## SECTION 5: SPRINT PRIORITIES

### Sprint 1 (This Week): Launch Readiness
1. `prisma db push` on production
2. Import 5 Gutenberg works + fix title corruption
3. Test welcome email + chapter rejection email
4. Smoke test: signup → browse → read → create → publish
5. Google Books API key

### Sprint 2 (Next): Content & Monetization
1. Stripe go-live (execute monetization checklist)
2. Founding Creator outreach (identify 5-10 targets, draft pitch)
3. `/features` + `/about/roadmap` update
4. Landing page copy review

### Sprint 3: Polish & Operations
1. Typo suggestion popover polish
2. VPS resource audit + log rotation
3. Uptime monitoring
4. Weekly email digest (cron)

### Backlog (Post-Launch)
1. Real-time collaborative editing (Phase 3 remaining)
2. AI Author Bots (Phase 6)
3. Web push notifications
4. Vector-indexed lore store

---

## SECTION 6: WHAT THE PLATFORM ACTUALLY DOES RIGHT NOW

**A visitor can:**
- Land on a server-rendered homepage with hero + feed
- Browse works by genre/status/sort
- See trending works with time filters
- Read chapters with glossary tooltips, character tooltips, font/theme settings
- See translations with community suggestions + ratings
- See "Readers Also Enjoyed" recommendations
- View series, author profiles, achievement blocks
- Navigate entirely via SPA (no page reloads)
- Get a mature-content gate for R/NC-17 works
- Onboard with username + book taste survey
- See DMCA, Terms (AI rules), Privacy (GDPR delete)
- (If logged in) comment, like, bookmark, subscribe

**A creator can:**
- Server-rendered dashboard with stats
- Manage works (table with status badges)
- Write chapters in TipTap with font families + smart paste
- Publish with validation + maturity confirmation
- Manage glossary entries + character profiles
- Manage series/volumes
- Invite collaborators with role-based permissions
- Chapter locking (database-backed, survives restarts)
- Accept/reject reader edit suggestions
- Track achievement progress (points, milestones, badges)
- AI-use disclosure on works

**What's gated (code exists, flag off):**
- Stripe subscriptions (premium_enabled: false)
- Payouts to creators

**What's missing (no content):**
- No works exist on the platform (Gutenberg pipeline not yet run)

---

## BOTTOM LINE

The platform is **feature-complete for MVP**. The 4-phase overhaul (May-June 2026) cleaned up the frontend. The achievement system (June 2026) wired gamification. Every core user journey exists in code.

The gap is **operations, not development.** Nobody has:
1. Pushed the latest schema to production DB
2. Seeded content via the Gutenberg pipeline
3. Verified emails actually fire
4. Flipped the Stripe feature flag

This is ~90 minutes of ops work from being launchable. After that, the limiting factor is content and users, not missing features.
