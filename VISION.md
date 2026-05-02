# Chapturs — Product Vision

> Last updated: May 1, 2026
> *"Creator-first webnovel platform. Dual Reader/Creator hubs."*

---

## The Problem

Webnovel platforms force creators and readers into separate experiences. Creators write in isolation with no tools for worldbuilding consistency or audience discovery. Readers browse fragmented catalogs without context about story connections, character arcs, or author intent. Existing platforms treat content as disposable — there's no mechanism to build lasting creative universes across multiple authors.

## The Solution

Chapturs is a **creator-first webnovel platform** that unifies reading and creation under one roof. It combines:
- **Discovery-first UX** (TikTok-style infinite scroll, card-heavy layouts) with **publishing-grade tools** (rich editor, worldbuilding systems, quality assessment)
- **Dual hubs**: a Reader Hub for discovery and consumption, and a Creator Hub for writing, managing, and monetizing content
- A **Living World system** that lets multiple authors contribute to shared canonical universes with AI-maintained lore consistency

## Brand Identity

The visual identity is dark-capable, content-forward, driven by a blue-to-violet brand gradient (`#2563EB` → `#7C3AED`) that signals creativity and momentum without overwhelming the fiction being read. The UI should feel like a well-designed reading app, not a social network.

**Personality**: Creative, trustworthy, modern. Not corporate. Not edgy.

---

## Core Pillars

### 1. Discovery-First Reading Experience

The homepage is a **discovery engine**, not a catalog. Stories surface through:
- Infinite scroll feed with community-genre cold-start seeding (cookie-based)
- "New and Promising" horizontal strip for recent works above the main feed
- Smart recommendation cascade: author picks → collaborative signals → reader-to-reader co-completion → semantic LLM tags → trending → popular fallback
- Browse page with genre, status, update frequency filters
- Trending page with time-based ranking (this week / this month / all time)

**Design principle**: Cover art dominates cards. The brand gradient appears only on primary CTAs and hero surfaces — never diluted across repeated elements.

### 2. Creator Tools That Scale With Ambition

The Creator Hub provides a complete writing and management stack:
- **Rich editor** (TipTap-based) with FontFamily extension, document upload/paste support, chapter locking for collaboration
- **Quality Assessment** via LLM scoring across 6 dimensions (Writing Quality, Storytelling, Characterization, World-Building, Engagement, Originality), generating discovery tags and visibility boosts
- **Character profiles & glossary systems** with auto-highlighting in reader view
- **Series grouping** — bundle multiple works into volumes with one-click subscription
- **Collaborative editing** — co-author invites with role-based permissions (owner/editor/contributor) and revenue share configuration
- **Content validation** — maturity checks, image safety via Google Cloud Vision, duplicate detection pipeline

### 3. Living World / Writers Room (Phase 2+)

A collaborative fiction layer where curated writers contribute to a single canonical shared universe:
- **Lore Web**: Every story deposits lore into a shared canon graph (characters, locations, events, factions)
- **Bounded History**: Two immutable anchors (The Beginning + The End) prevent narrative explosion while allowing prequels, present-day stories, and far-future narratives
- **AI Lore Master**: Contradiction detection, lore extraction, natural language queries about the canon graph
- **World Council**: Small group of founding creators with veto power on canon disputes
- **Spider Web Model**: Directed citation network where every fact knows its source chapter

*Launch threshold: 500+ daily readers before opening to all platform writers.*

### 4. Community-Powered Content Ecosystem

Readers contribute beyond consumption:
- **Fan translations** with community voting (auto-promote at quality threshold)
- **Reader suggestions** — highlight text in reader → suggest typo/wording fix → creator moderation queue
- **Fan art submissions** with voting and curator approval
- **Audiobook submissions** by community narrators
- **Tier 3 deal proposals** for advanced fan contributions

### 5. Creator Monetization

Multi-layer revenue model:
- **Premium subscriptions** (Stripe integration, currently `premium_enabled: false`)
- **Ad support system** with reader-configurable ad density levels (normal / boosted / video)
- **Creator payouts** — full payout state machine + admin UI + email notifications
- **Founding Creator Programme** — 70% rev share for 12 months + founding badge + direct dev access

---

## Platform Architecture

### Reader Hub
- Responsive discovery feed (mobile: 1 col, tablet: 2 col, desktop: 3 col)
- Chapter reader with translation support (10 languages), maturity gate interstitials
- Reading statistics and progress tracking
- Library management (bookmarks, follows, subscriptions)
- In-app notification center (60s polling)

### Creator Hub
- Dashboard with analytics and earnings
- Work management (create, edit, publish, collaborate)
- Chapter editor with rich text, font families, document import
- Character/glossary/worldbuilding tools
- Moderation queue for reader suggestions and comments
- Series manager UI at `/creator/series`

### Admin Panel
- User management, content moderation, validation rules
- Community referral link generation
- Contest management
- Payout processing
- Stripe event logging
- Living World admin console

---

## Technical Foundation

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15 (App Router) | Turbopack dev, standalone output, Node.js 20.x |
| Language | TypeScript 5 | Strict mode enabled |
| Styling | Tailwind CSS 3.4 | Dark mode first-class, Inter variable font |
| Database | PostgreSQL (Supabase) | Prisma ORM, 2,375-line schema |
| Auth | NextAuth v5 | Google/GitHub/Discord OAuth, JWT sessions |
| Storage | Cloudflare R2 | Images, covers, fan art |
| AI/LLM | OpenRouter SDK | `openai` package only — no groq-sdk |
| Email | Resend API | Direct HTTP integration |
| Payments | Stripe v19 | Webhook idempotency + event logging |
| Monitoring | Sentry (free tier) | DSN via GitHub Secrets, graceful no-op locally |
| Real-time | Pusher | WebSocket notifications and presence |
| Cache | Redis (raw fetch) | No @upstash/redis SDK dependency |

### Deployment
- **VPS** (not Vercel) with auto-update via GitHub Actions runner
- Standalone output mode — zero-dependency deployment
- PM2 process manager, Nginx reverse proxy
- Secrets stored in GitHub Secrets, synced to VPS on deploy

---

## Growth Strategy

### Cold Start
- Google Books API integration for new user taste discovery (free tier, no key required)
- Community referral links with genre-based cold-start seeding
- "New and Promising" section surfaces recent works above the main feed
- Quality Assessment visibility boosts for high-scoring first chapters

### Creator Acquisition
- Founding Creator Programme targeting mid-tier writers on RoyalRoad/Wattpad (1k–8k followers)
- 70% revenue share for 12 months + founding badge + direct dev access
- Community link generation for target communities (RoyalRoad LitRPG, Wattpad Romance, etc.)

### Content Seeding (Future)
- Project Gutenberg public domain import pipeline (spec written at `docs/source/plans/gutenberg-import-pipeline.md`)
- AI-generated glossary entries and character profiles for imported works
- External AI storytelling runtime concept (separate builder agent for automated content generation)

---

## What's Live vs. Planned

### ✅ Live / Implemented
- Discovery feed with infinite scroll + genre cookie seeding
- Browse page with filters, trending page, search
- Rich chapter editor with collaboration features (locking, activity log, revenue share)
- Quality Assessment system (6-dimension LLM scoring, discovery tags, visibility boosts)
- Character profiles and glossary systems
- Series grouping and subscription
- Smart recommendation cascade ("Readers Also Enjoyed")
- Living World / Writers Room schema + APIs + UI panels
- Achievement system with points ledger, 5 level tiers, 11 achievements
- Fan translations with community voting (auto-promote at threshold)
- Reader suggestions → creator moderation queue
- Premium subscription infrastructure (Stripe, currently disabled)
- Ad support system with density controls
- Creator payout flow (state machine + admin UI, pending staging tests)
- DMCA policy page, AI content disclosure framework
- Maturity gate interstitial for R/NC-17 works
- Delete account cascade flow
- In-app notification center (60s polling)
- Onboarding with taste discovery survey
- Playwright mobile smoke test suite
- Gutenberg import pipeline implementation (`src/lib/gutenberg-import/` — 8 files + `src/app/api/admin/import/gutenberg/route.ts`)
- Admin component: `GutenbergImportForm.tsx`
- Admin page: `/admin/import/page.tsx` for Gutenberg import UI

### 🔶 Partial / In Progress
- AdSense rendering in production (false-positive adblock detection fixed)
- Sentry activation on VPS push (SDK installed + configured)
- `/features` page copy/status sync with TASKS.md

### ⬜ Not Started / Planned
| - Content hash storage for duplicate detection (code TODO at `ContentValidationService.ts:269`) |
| - AI Author Bots (Phase 6) — bot author records, chapter generation pipeline, scheduling |
| - Vector-indexed lore store (pgvector or Pinecone) |
| - TranslatorProfile hub UI |
| - Release cadence UX for beta publishing |
| - Founder program policy doc for point values + award rules |

---

## Success Metrics

| Metric | Target | Current Status |
|--------|--------|----------------|
| Daily active readers | 500+ (Writers Room launch threshold) | Pre-launch |
| Published works | 100+ (content seeding complete) | Seed content needed |
| Creator retention | 70% monthly active creators | N/A — pre-launch |
| Translation quality score | >4.0 avg rating (auto-promote threshold) | System live, awaiting users |
| Recommendation CTR | Track via `WorkSemanticProfile` engagement signals | Cascade system live |

---

## Document History

- **May 1, 2026**: Eighth-pass audit — re-verified all "Live / Implemented" items against codebase state; confirmed accuracy of status sections ✅
- **May 1, 2026**: Ninth-pass audit — re-verified all "Live / Implemented" items against codebase state; Gutenberg import pipeline files confirmed at 8 (not 11); dual `collaborationPatchValidation.js`/`.ts` noted; no status discrepancies ✅
- **May 1, 2026**: Fourth-pass audit — re-verified all "Live / Implemented" items against codebase state; confirmed accuracy of status sections ✅
- **May 1, 2026**: Third-pass audit — corrected Audiobook APIs from "(2 routes)" → "(3 routes)", Reader APIs from "(2 routes)" → "(3 routes); added 14 undocumented lib modules and 7 subdirectories to CODEBASE_MAP.md; updated Gutenberg Import Pipeline status to "implementation complete"; fixed `.squad/wisdom.md` reference in WORKERS.md
- **May 1, 2026**: Second-pass audit — verified all "Live / Implemented" items against codebase state; confirmed accuracy of status sections; noted test API routes and corrected profile/blocks count to 12
- **May 1, 2026**: Automated audit — verified all "Live / Implemented" items against codebase state; confirmed accuracy of status sections
- **April 28, 2026**: Created — synthesized from DESIGN.md, WRITERS_ROOM_VISION.md, MEMORY.md, TASKS.md, and actual codebase state
- **Previous**: No dedicated VISION.md existed; vision was scattered across multiple documents
