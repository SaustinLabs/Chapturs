# Chapturs — Master Task List
> Last updated: April 7, 2026  
> **Legend:** ✅ Done · 🔶 Partial / in progress · ⬜ Not started

---

## 🔴 Immediate / Blocking (do these now)

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Run bootstrap flow: sign in → `/admin/bootstrap` → enter PIN → sign out → sign back in | ⬜ | Deploy `0363768` must finish first |
| 2 | Verify `RESEND_API_KEY` + `EMAIL_FROM` are in GitHub Secrets | ✅ | Confirmed set by user |
| 3 | Run `npx prisma db push` on the production DB | ⬜ | Schema has `CommunityLink.signupCount` + `User.communityRef` that aren't pushed yet |
| 4 | Set up Admin → Settings → Email Addresses in the admin panel | ⬜ | New email group defaults to `@chapturs.com` values but needs to be confirmed/customised after first deploy |
| 108 | Add `GOOGLE_BOOKS_API_KEY`, `GOOGLE_CLOUD_VISION_API_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` to GitHub Secrets + VPS env | ⬜ | Documented in `.env.example`; Vision + reCAPTCHA code is live but keys must be set for them to activate |

---

## 🟠 Pre-Launch Essentials

### Infrastructure
| # | Task | Status | Notes |
|---|---|---|---|
| 5 | Cloudflare Email Routing for all inboxes | ✅ | Done by user |
| 6 | Confirm domain DNS is healthy (R2, Resend DKIM, CF email routing coexist) | ⬜ | Worth a quick audit |
| 7 | Test welcome email end-to-end with a fresh signup | ⬜ | New code — verify Resend actually fires |
| 8 | Test chapter rejection email end-to-end | ⬜ | New code — requires a moderation queue item |

### Legal & Content Policy
| # | Task | Status | Notes |
|---|---|---|---|
| 9 | Write a dedicated DMCA policy page (`/dmca`) | ✅ | `/app/dmca/page.tsx` — full takedown + counter-notice procedure, links `dmca@chapturs.com` |
| 10 | Review Terms of Service — ensure it mentions AI-generated content rules | ⬜ | With AI author bots planned, terms should cover this now |
| 10a | AI-use disclosure framework for authors | ✅ | `aiUseDisclosure` field on Work schema (none/assisted/generated); radio selector in creator work edit page; disclosure badge on story page |
| 11 | Age verification / parental advisory for mature-rated works | ✅ | `MaturityGate.tsx` — full-screen interstitial for R/NC-17 works; localStorage consent; wraps StoryPageClient in story page |
| 12 | Privacy policy audit — confirm GDPR/CCPA delete-account flow works | ✅ | `DELETE /api/user/account` with cascade delete; Danger Zone section in Reader Settings with typed confirmation modal |

### SEO & Discoverability
| # | Task | Status | Notes |
|---|---|---|---|
| 13 | Audit sitemap.ts — confirm all public story/author pages are included | ✅ | Added /trending, /search, /about/roadmap, /features, /contact, /dmca to static routes; dynamic story + user profile routes already present |
| 14 | Per-story `og:image` meta tags using cover art | ✅ | Fixed `resolveCoverSrc` bug in story layout — was passing wrong args, now returns correct absolute URL |
| 15 | Per-chapter `og:description` using chapter hook / first paragraph | ✅ | Chapter layout also fixed — og:image now works for chapter social shares |
| 16 | Canonical URLs on paginated/filtered pages | ✅ | /browse and /trending extracted to server wrappers (BrowsePageClient, TrendingPageClient) that export metadata with canonical alternates |

---

## 🟡 Phase 2 — Growth Tools (active sprint)

### Feed & Discovery
| # | Task | Status | Notes |
|---|---|---|---|
| 17 | Feed reads `community_genres` cookie for cold-start seeding | ✅ | Cookie read in feed API; genre-matching works floated to top for guest visitors arriving via community links |
| 18 | Browse page: filter by genre, tags, completion status, update frequency | ✅ | URL-driven `/browse` — genre pills, status/sort pills, cover-image grid, load-more; no search query required |
| 19 | "New and Promising" section on homepage | ✅ | `NewAndPromisingSection.tsx` — horizontal scroll strip of recent works above InfiniteFeed |
| 20 | Trending page | ✅ | `/trending` — popular works sorted by viewCount; time filters (this week / this month / all time); rank badges for top 3; Trending added to sidebar nav |
| 105 | New user onboarding page with book taste discovery | ✅ | `/onboarding` — 2-step: username setup + book taste search via Google Books API (free, no key); extracted genres saved to `UserProfile.genreAffinities`; middleware-based redirect replaces annoying `UsernameGuard` popup; `hasSetUsername` JWT claim controls redirect lifecycle |

### Content Seeding
| # | Task | Status | Notes |
|---|---|---|---|
| 21 | Import 3–5 public domain works from Project Gutenberg | ⬜ | Feature demo content — cover art, AI glossary, character profiles. Suggested: *The Count of Monte Cristo*, *Dracula*, *Twenty Thousand Leagues Under the Sea* |
| 22 | Generate AI glossary entries for imported works | ⬜ | Use existing Groq integration |
| 23 | Generate character profiles for imported works | ⬜ | Use existing character profile system |

### Outreach
| # | Task | Status | Notes |
|---|---|---|---|
| 24 | Founding Creator Programme — identify 5–10 mid-tier targets on RoyalRoad/Wattpad | ⬜ | 1k–8k followers frustrated with current platforms |
| 25 | Draft the founding creator pitch email | ⬜ | 70% rev share for 12 months + founding badge + direct dev access |
| 26 | Generate community referral links for target communities (RoyalRoad LitRPG, Wattpad Romance etc.) | ⬜ | Use admin community links panel |

### Founding Creators Program (Beta)
| # | Task | Status | Notes |
|---|---|---|---|
| 96 | Achievements MVP schema + points ledger (`Achievement`, `UserAchievement`, `PointsLedger`, `LevelTier`) | ⬜ | Keep values configurable for fast tuning during beta |
| 97 | Points event pipeline (`POINTS_EVENT_TYPE`) for reader/author/contributor triggers | ⬜ | Idempotent writes; include anti-abuse guards and per-event caps |
| 98 | Profile "Achievements / Level" block with user visibility toggle | ⬜ | Add to profile block system with hide/show support |
| 99 | Pin featured achievements in profile block | ⬜ | User selects featured badges; cap pinned items for clean layout |
| 100 | Founding Creator cohort badge (first 100 publishing authors) | ⬜ | Trigger on first chapter that goes live (not draft/save); store award timestamp + chapterId |
| 101 | "First!" reader window + anti-farm qualification | ⬜ | Chapter goes live -> 5 minute award window. Reader must qualify (>=60s dwell + basic scroll/progress signal) before award; all qualified readers in window receive badge/points |
| 102 | Author glossary achievement milestones (entry count + evolving definitions) | ⬜ | Count distinct glossary entries/instances over story progression |
| 103 | Author character index achievement milestones | ⬜ | Milestones like 25/50/100 character entries |
| 104 | High-impact contribution points: translations, audiobooks, fan-art, featured placements | ⬜ | Launch with existing contribution types; feature bonus rules can be phased |
| 105 | Publishing flow options in editor: upload document / paste document / continue writing | ✅ | Entry picker shown on new chapters: Write from scratch / Upload document / Paste text. Paste converts plain text to prose blocks and loads into editor. |
| 106 | Define release cadence UX (scheduled vs metadata-only) for beta publishing | ⬜ | Decide strict scheduling later if needed |
| 107 | Founder program policy doc for exact point values + award rules | ⬜ | Source-of-truth + public docs; values must be admin-editable in runtime settings to rebalance meta shifts |

### Notifications
| # | Task | Status | Notes |
|---|---|---|---|
| 27 | In-app notification centre (bell icon, unread count) | ✅ | Bell on desktop sidebar + mobile bottom nav Alerts tab; full `/notifications` page; per-notification mark-as-read; 60s polling |
| 28 | Weekly email digest of activity on followed works | ⬜ | Requires batching logic / cron job |
| 29 | Web push notifications (service worker) | ⬜ | Nice-to-have, after in-app centre |

---

## 🟡 Known Code TODOs

These are literal `// TODO` comments in the codebase:

| # | File | Issue | Status |
|---|---|---|---|
| 30 | `src/lib/r2-usage.ts:227` | Admin alert when R2 storage budget threshold hit | ⬜ |
| 31 | `src/lib/ContentValidationService.ts:269` | Store content hashes for duplicate detection | ⬜ |
| 32 | `src/lib/ContentValidationService.ts:463` | Integrate image safety API (currently no-op) | ✅ | Google Cloud Vision SafeSearch — flags adult/violence/racy LIKELY+ images; graceful fallback to URL check if key absent |
| 33 | `src/lib/analytics/view-counter.ts:187` | Add `viewCount` field to Section model in Prisma schema | ⬜ |
| 34 | `src/app/api/works/publish/route.ts:226` | Wire content validation checks into publish flow | ⬜ |
| 80 | `src/app/api/user/taste-profile/route.ts` | `workCount < 12` gate suppresses onboarding survey on sparse platform — lower threshold or remove it once seeded content is in place | ✅ | Lowered to `workCount < 3` — survey now fires with minimal seeded content |

---

## 🔵 Phase 3 — Collaborative Editor

Schema (`WorkCollaborator`, `CollaborationActivity`) is in the DB. Only the UI and business logic are missing.

| # | Task | Status |
|---|---|---|
| 35 | Co-author invite by username UI | ⬜ |
| 36 | Role-based permissions (owner / editor / contributor) | ⬜ |
| 37 | Revenue share config per collaborator | ⬜ |
| 38 | Collaboration activity log per work | ⬜ |
| 39 | Chapter locking (prevent simultaneous edits) | ⬜ |
| 40 | Change suggestion mode (propose edit → accept/reject) | ⬜ |
| 41 | Version history with per-author attribution | ⬜ |
| 42 | Real-time co-editing (WebSocket / Pusher / Ably) | ⬜ |
| 43 | Live cursor presence | ⬜ |

---

## 🔵 Phase 4 — Ecosystem Expansion

| # | Task | Status |
|---|---|---|
| 44 | Reader highlight → suggest typo/wording fix | ⬜ |
| 45 | Creator accept/reject queue for reader suggestions | ⬜ |
| 46 | Series and Volumes grouping | ⬜ |
| 47 | Series subscription (one click covers all works in a set) | ⬜ |
| 48 | Reader-to-reader recommendation ("finished X → also loved Y") | ⬜ |
| 49 | "Readers Also Enjoyed" block on story pages | ✅ | Smart cascade: author picks → collaborative signals → semantic LLM Jaccard → trending → popular. `WorkSemanticProfile` + `AuthorRecommendation` schema, `similarity.ts` service, `/api/works/[id]/related`. |
| 49a | Author-curated "Readers Also Enjoyed" picks — Creator Hub UI | ✅ | Work-search autocomplete + pick list (max 4) added to `/creator/work/[id]/edit`. Auto-saves on add/remove. |
| 49b | Collaborative signal cron/trigger — periodically call `computeCollaborativeSignals` | ⬜ | Hook exists; needs a scheduled API route or admin trigger to run it for works with sufficient readership. |

---

## 🟣 Phase 5 — Writers Room / Living World

> Build only after 500+ daily readers.

| # | Task | Status |
|---|---|---|
| 50 | `LivingWorld`, `CanonEntry`, `CanonCharacter`, `LoreContradictionFlag`, `WorldCouncilVote` Prisma models | ⬜ |
| 51 | World definition UI (founder sets The Beginning + The End, canon characters) | ⬜ |
| 52 | Lore Master AI — Groq agent for writer queries + contradiction scanning | ⬜ |
| 53 | Canon graph (lore facts cite source chapters, spider-web model) | ⬜ |
| 54 | Vector-indexed lore store (pgvector or Pinecone) | ⬜ |
| 55 | World Council (admin group with veto on canon disputes) | ⬜ |
| 56 | World Atlas — browsable map for readers | ⬜ |
| 57 | Lore Index — cross-story character/location cards | ⬜ |
| 58 | Timeline View — all stories plotted on world history | ⬜ |
| 59 | Feed badge tagging stories as part of a Living World | ⬜ |

---

## 🟣 Phase 6 — AI Author Bots

> Structural filler for cold-start. Transparently labeled.

| # | Task | Status |
|---|---|---|
| 60 | Bot author DB record (`isBot: true` flag) | ⬜ |
| 61 | Story outline generation pipeline (Groq) | ⬜ |
| 62 | Chapter-by-chapter generation with prior chapter context | ⬜ |
| 63 | Scheduling / cron job for cadenced publishing | ⬜ |
| 64 | Feed weight decay as real content accumulates | ⬜ |
| 65 | "AI Author" label on story page and in feed | ⬜ |

---

## 💰 Monetization

| # | Task | Status | Notes |
|---|---|---|---|
| 66 | Enable Stripe integration (currently `premium_enabled: false`) | ⬜ | Stripe keys are in secrets, just need to flip the flag and test |
| 67 | Test Stripe webhook end-to-end on staging | ⬜ | `STRIPE_WEBHOOK_SECRET` is set but webhook flow is untested |
| 68 | Creator payout flow (currently disabled) | ⬜ | Revenue sharing schema exists, payout UX needs building |
| 69 | AdSense slots audit — confirm they're rendering in prod (not blank) | ✅ | Fixed false-positive adblock detection: removed proactive fetch probe (false positives on Firefox ETP / Brave Shields); now relies on Script onError callback |

---

## 🎨 UX / Polish

| # | Task | Status |
|---|---|---|
| 70 | `/features` page — update screenshots/copy to reflect current state | 🔶 | Copy/status sync pass started; continue tightening claims as features go live |
| 109 | Keep `/about/roadmap` + `/features` synced with `TASKS.md` on every shipped/started feature | 🔶 | Workflow now enforced in agent instructions; continue updating copy/status in same commit as feature work |
| 71 | Landing page (`/`) — review copy for current feature set | ⬜ |
| 72 | Empty states: new user sees an onboarding prompt instead of a blank feed | ✅ | Authenticated empty feed now launches TasteProfileSurvey modal; guests get genre quick-pick buttons |
| 73 | Mobile layout audit across all main flows (feed, reader, editor) | 🔶 | Fixed major blockers and added Playwright mobile smoke suite; remaining work is deeper manual QA for authenticated reader chapters on real device datasets |
| 74 | Error boundary messaging — make user-facing errors friendlier | ✅ | Global `error.tsx` and `ErrorBoundary` component already had good UI; fixed `StoryPageClient` to use a static friendly message instead of raw `err.message` (prevents "Failed to fetch" showing to readers) |
| 75 | Loading skeleton coverage — any page missing a skeleton while data loads | ⬜ |
| 95 | Feed back-navigation: instant restore via module-level snapshot cache | ✅ | `src/lib/feedCache.ts` stores items+page+scroll on unmount; InfiniteFeed restores on mount (after auth settles); `staleTimes.dynamic: 30` added to next.config.js for router-level caching; taste-profile onboarding clears the cache so the fresh personalised feed always loads |
| 82 | Add Playwright mobile smoke tests (feed/reader/editor) for regression checks | ✅ | Added `playwright.config.ts`, mobile smoke suite, and npm scripts (`test:e2e`, `test:e2e:mobile`) |
| 81 | Sidebar expand should overlay (no content reflow); verify reader alignment on desktop + mobile | ✅ | Implemented fixed content lane + sliding sidebar (no main-content reflow when expanding) |
| 108 | Rich text font-family support in editor toolbar (TipTap `FontFamily`) | ⬜ | Add curated families, persist in block content, keep default serif fallback |

---

## 📊 Analytics & Monitoring

| # | Task | Status |
|---|---|---|
| 76 | Set up uptime monitoring (UptimeRobot / Better Uptime — free tier) | ⬜ |
| 77 | Error reporting (Sentry free tier) — currently errors only go to console | ⬜ |
| 78 | Review VPS resource usage — RAM / disk / CPU headroom before traffic | ⬜ |
| 79 | Log rotation on PM2 — ensure server logs don't fill the disk | ⬜ |

---

## 🌍 Translation System

Schema models (`Translation`, `TranslationSuggestion`, `TranslatorProfile`, `TranslationVote`, `FanTranslation`) are in place. Chapter reader has a language-selector UI. The content API route (`/api/chapter/[workId]/[chapterId]/content`) is wired and calls real LLM via `translateBatch`.

### Phase 1 — MVP (in progress)

| # | Task | Status | Notes |
|---|---|---|---|
| 83 | Real LLM translation in chapter content route | ✅ | `translateBatch` from `src/lib/translation.ts` wired into content route; uses `meta-llama/llama-3.1-8b-instruct` via OpenRouter |
| 84 | Fix `translation.ts` — remove broken `DescriptionTranslation` ref, correct model, batch API | ✅ | Rewrote: `translateOnDemand` + `translateBatch`, correct model, no broken Prisma calls |
| 85 | Add `preferredLanguage` field to User model + migrate | ✅ | Added `preferredLanguage String? @default("en")` to User model; migrated via `prisma db push` in deploy workflow |
| 86 | Pass `Accept-Language` / user preference as default `targetLanguage` in chapter page | ✅ | On mount: fetches user profile preference first, falls back to `navigator.language`; applies if in SUPPORTED_LANGUAGES |
| 87 | "Translated from X • Show original" banner in chapter reader | ✅ | Banner renders below chapter title when `targetLanguage !== 'en'`; one-tap revert resets language + detectedLanguage state |

### Phase 2 — Quality & Cost Controls

| # | Task | Status | Notes |
|---|---|---|---|
| 88 | Persist AI translations to DB (`FanTranslation` model, `TIER_1_OFFICIAL`) to avoid re-translating | ✅ | Fixed FK bug (`translatorId: null`); switched `create` → `upsert` on `(chapterId, languageCode, tier)` unique key; fire-and-forget `.catch()` so persist never blocks the response |
| 89 | Rate-limit translation requests per user/IP (e.g. 20 chapters/day for anon) | ✅ | In-memory sliding-window limiter (20 req/hr per IP) added to content route; purges stale entries every hour; sufficient until Redis is available |
| 90 | Chunk large chapters into ≤50 block batches before sending to LLM | ✅ | Added `translateBatchChunked` to `translation.ts`; auto-splits arrays >50 entries into sequential chunk calls; content route now uses this |

### Phase 3 — Community Translations (future)

| # | Task | Status | Notes |
|---|---|---|---|
| 91 | `TranslationSuggestion` submission UI — bilingual readers can propose better translations | ✅ | Inline suggestion form in chapter reader translation banner; POSTs to new `/api/fan-translations/[id]/suggest` endpoint |
| 92 | Voting UI for translation suggestions | ✅ | Star rating widget (1–5) in translation banner; POSTs to new `/api/fan-translations/[id]/rate`; resets on language change |
| 93 | Auto-promote community translation to canonical when votes > threshold | ✅ | Auto-promote fires in rate endpoint when ratingCount ≥ 5 and avgQuality ≥ 4.0; updates `section.defaultTranslationIdByLanguage` |
| 94 | `TranslatorProfile` hub — track translator reputation and language badges | ⬜ | Schema exists; needs UI in Creator Hub |

---

## ✅ Done (this session)

| Task |
|---|
| Admin security lockdown — middleware + server layout auth guard |
| Bootstrap PIN API + page |
| Admin settings + deploy workflow now include ADMIN_EMAIL + ADMIN_BOOTSTRAP_PIN |
| Email addresses consolidated into Admin → Settings → Email Addresses |
| og:image + og:description for story and chapter pages (tasks 14, 15) |
| community_genres cookie wired into feed cold-start (task 17) |
| New user empty state with genre quick-picks (task 72) |
| AdSense false-positive adblock detection fixed (task 69) |
| Sidebar expansion now overlays without reflow; reader content no longer shifts when opening sidebar (task 81) |
| Playwright mobile smoke tests added and passing for mobile home + creator editor (task 82) |
| Contact page reads live from SiteSettings |
| DMCA contact address added |
| Welcome email on first sign-up |
| Chapter rejection email wired to moderation queue |
| Community referral links system |
| Signup tracking with 30s polling |
| FEATURE_ROADMAP.md refreshed |
| "Readers Also Enjoyed" — smart similarity cascade: author picks → collaborative signals → semantic LLM tags → trending → popular fallback. WorkSemanticProfile + AuthorRecommendation schema, similarity service, `/api/works/[id]/related`, `/api/works/[id]/author-recommendations`. LLM now emits structured `semanticProfile` alongside QA assessment (zero extra cost). `ContentSimilarity` table auto-populated after every QA run. Author UI pending — see TASKS below. |
| Author-curated companion works API — `PUT /api/works/[id]/author-recommendations` (max 4, auth-gated to work owner) |
| Maturity gate (#11) — `MaturityGate.tsx` interstitial for R/NC-17 stories; localStorage consent; wired into `/story/[id]` |
| Delete account (#12) — `DELETE /api/user/account` cascade delete + Danger Zone UI in Reader Settings |
| Trending page (#20) — `/trending` with time filters, rank badges, sidebar nav link; `publishedWithinDays` param added to `/api/search` |
