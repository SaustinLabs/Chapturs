# Chapturs — Master Task List
> Last updated: April 5, 2026  
> **Legend:** ✅ Done · 🔶 Partial / in progress · ⬜ Not started

---

## 🔴 Immediate / Blocking (do these now)

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Run bootstrap flow: sign in → `/admin/bootstrap` → enter PIN → sign out → sign back in | ⬜ | Deploy `0363768` must finish first |
| 2 | Verify `RESEND_API_KEY` + `EMAIL_FROM` are in GitHub Secrets | ⬜ | Without these, all transactional emails are silently dropped |
| 3 | Run `npx prisma db push` on the production DB | ⬜ | Schema has `CommunityLink.signupCount` + `User.communityRef` that aren't pushed yet |
| 4 | Set up Admin → Settings → Email Addresses in the admin panel | ⬜ | New email group defaults to `@chapturs.com` values but needs to be confirmed/customised after first deploy |

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
| 9 | Write a dedicated DMCA policy page (`/dmca`) | ⬜ | `dmca@` address now exists, but there's no formal policy page — legally expected |
| 10 | Review Terms of Service — ensure it mentions AI-generated content rules | ⬜ | With AI author bots planned, terms should cover this now |
| 11 | Age verification / parental advisory for mature-rated works | ⬜ | Maturity rating field exists, no reader-side gate |
| 12 | Privacy policy audit — confirm GDPR/CCPA delete-account flow works | ⬜ | Delete account doesn't appear to be wired up end-to-end |

### SEO & Discoverability
| # | Task | Status | Notes |
|---|---|---|---|
| 13 | Audit sitemap.ts — confirm all public story/author pages are included | 🔶 | File exists, unknown if comprehensive |
| 14 | Per-story `og:image` meta tags using cover art | ✅ | Fixed `resolveCoverSrc` bug in story layout — was passing wrong args, now returns correct absolute URL |
| 15 | Per-chapter `og:description` using chapter hook / first paragraph | ✅ | Chapter layout also fixed — og:image now works for chapter social shares |
| 16 | Canonical URLs on paginated/filtered pages | ⬜ | Feed has filters that may create duplicate URL issues |

---

## 🟡 Phase 2 — Growth Tools (active sprint)

### Feed & Discovery
| # | Task | Status | Notes |
|---|---|---|---|
| 17 | Feed reads `community_genres` cookie for cold-start seeding | ✅ | Cookie read in feed API; genre-matching works floated to top for guest visitors arriving via community links |
| 18 | Browse page: filter by genre, tags, completion status, update frequency | ⬜ | Search exists, no browse/filter experience |
| 19 | "New and Promising" section on homepage | ⬜ | For AI-scored strong chapters by new creators — easy retention win |
| 20 | Trending page | ⬜ | Beyond the feed — dedicated trending works list |

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

### Notifications
| # | Task | Status | Notes |
|---|---|---|---|
| 27 | In-app notification centre (bell icon, unread count) | 🔶 | Schema exists, UI needs building |
| 28 | Weekly email digest of activity on followed works | ⬜ | Requires batching logic / cron job |
| 29 | Web push notifications (service worker) | ⬜ | Nice-to-have, after in-app centre |

---

## 🟡 Known Code TODOs

These are literal `// TODO` comments in the codebase:

| # | File | Issue | Status |
|---|---|---|---|
| 30 | `src/lib/r2-usage.ts:227` | Admin alert when R2 storage budget threshold hit | ⬜ |
| 31 | `src/lib/ContentValidationService.ts:269` | Store content hashes for duplicate detection | ⬜ |
| 32 | `src/lib/ContentValidationService.ts:463` | Integrate image safety API (currently no-op) | ⬜ |
| 33 | `src/lib/analytics/view-counter.ts:187` | Add `viewCount` field to Section model in Prisma schema | ⬜ |
| 34 | `src/app/api/works/publish/route.ts:226` | Wire content validation checks into publish flow | ⬜ |
| 80 | `src/app/api/user/taste-profile/route.ts` | `workCount < 12` gate suppresses onboarding survey on sparse platform — lower threshold or remove it once seeded content is in place | ⬜ |

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
| 49 | "Readers Also Enjoyed" block on story pages | ⬜ |

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
| 70 | `/features` page — update screenshots/copy to reflect current state | ⬜ |
| 71 | Landing page (`/`) — review copy for current feature set | ⬜ |
| 72 | Empty states: new user sees an onboarding prompt instead of a blank feed | ✅ | Authenticated empty feed now launches TasteProfileSurvey modal; guests get genre quick-pick buttons |
| 73 | Mobile layout audit across all main flows (feed, reader, editor) | ⬜ |
| 74 | Error boundary messaging — make user-facing errors friendlier | ⬜ |
| 75 | Loading skeleton coverage — any page missing a skeleton while data loads | ⬜ |

---

## 📊 Analytics & Monitoring

| # | Task | Status |
|---|---|---|
| 76 | Set up uptime monitoring (UptimeRobot / Better Uptime — free tier) | ⬜ |
| 77 | Error reporting (Sentry free tier) — currently errors only go to console | ⬜ |
| 78 | Review VPS resource usage — RAM / disk / CPU headroom before traffic | ⬜ |
| 79 | Log rotation on PM2 — ensure server logs don't fill the disk | ⬜ |

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
| Contact page reads live from SiteSettings |
| DMCA contact address added |
| Welcome email on first sign-up |
| Chapter rejection email wired to moderation queue |
| Community referral links system |
| Signup tracking with 30s polling |
| FEATURE_ROADMAP.md refreshed |
| Cloudflare Email Routing (done by you) |
