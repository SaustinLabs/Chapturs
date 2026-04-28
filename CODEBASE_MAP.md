# Chapturs — Codebase Map

> Last updated: April 28, 2026
> **Source of truth** for where every feature lives in the repository.

---

## Directory Structure Overview

```
Chapturs/
├── src/                          # Application source code (511 files)
│   ├── app/                      # Next.js App Router pages & API routes
│   │   ├── api/                  # 172 route files across 48 namespaces
│   │   └── [page]/               # 75 page components
│   ├── components/               # 155 .tsx component files
│   └── lib/                      # 66 library/utility modules
├── prisma/                       # Prisma schema + migrations + seed
├── docs/                         # Documentation source & summaries
├── scripts/                      # Deployment & utility scripts
├── __tests__/                    # Jest unit tests (13 test files)
├── tests/                        # Playwright E2E tests
└── nginx/                        # Nginx server configuration
```

---

## Pages (`src/app/[page]/`) — 75 pages

### Public Pages
| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Homepage / discovery feed |
| `/browse` | `app/browse/page.tsx` | Browse with genre/status/sort filters |
| `/trending` | `app/trending/page.tsx` | Trending works by time period |
| `/search` | `app/search/page.tsx` | Full-text search |
| `/about` | `app/about/page.tsx` | About page |
| `/about/roadmap` | `app/about/roadmap/page.tsx` | Public roadmap with stats |
| `/features` | `app/features/page.tsx` | Feature showcase |
| `/contact` | `app/contact/page.tsx` | Contact form (reads from SiteSettings) |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Terms of service + AI content rules |
| `/legal/privacy` | `app/legal/privacy/page.tsx` | Detailed privacy policy |
| `/legal/terms` | `app/legal/terms/page.tsx` | Detailed terms (includes section 4.4) |
| `/legal/creator-agreement` | `app/legal/creator-agreement/page.tsx` | Creator agreement |
| `/dmca` | `app/dmca/page.tsx` | DMCA takedown + counter-notice procedure |
| `/content-policy` | `app/content-policy/page.tsx` | Content policy page |
| `/contests` | `app/contests/page.tsx` | Writing contests listing |

### Auth & Onboarding
| Route | File | Description |
|-------|------|-------------|
| `/auth/signin` | `app/auth/signin/page.tsx` | Sign-in page (NextAuth) |
| `/onboarding` | `app/onboarding/page.tsx` | New user taste discovery (2-step: username + book search) |

### Story & Reader
| Route | File | Description |
|-------|------|-------------|
| `/story/[id]` | `app/story/[id]/page.tsx` | Story detail page |
| `/story/[id]/chapter/[chapterId]` | `app/story/[id]/chapter/[chapterId]/page.tsx` | Chapter reader with translation support |
| `/reader/settings` | `app/reader/settings/page.tsx` | Reader settings (maturity gate, delete account) |
| `/reader/stats` | `app/reader/stats/page.tsx` | Reading statistics |

### Profile & Library
| Route | File | Description |
|-------|------|-------------|
| `/profile/[username]` | `app/profile/[username]/page.tsx` | Author profile with achievements block |
| `/library` | `app/library/page.tsx` | User's bookmarked/followed works |
| `/subscriptions` | `app/subscriptions/page.tsx` | Subscription management |

### Series & Worlds
| Route | File | Description |
|-------|------|-------------|
| `/series/[seriesId]` | `app/series/[seriesId]/page.tsx` | Series detail page (multi-work grouping) |
| `/worlds/[worldSlug]` | `app/worlds/[worldSlug]/page.tsx` | Living World atlas / browsable map |

### Notifications & Moderation
| Route | File | Description |
|-------|------|-------------|
| `/notifications` | `app/notifications/page.tsx` | In-app notification center (bell icon, 60s polling) |
| `/moderation` | `app/moderation/page.tsx` | User moderation queue |

### Join / Community Links
| Route | File | Description |
|-------|------|-------------|
| `/join/[slug]` | `app/join/[slug]/page.tsx` | Community referral link landing page |

### Contributor Pages
| Route | File | Description |
|-------|------|-------------|
| `/contributor/[username]` | `app/contributor/[username]/page.tsx` | Contributor profile |
| `/contributor/board` | `app/contributor/board/page.tsx` | Fan content board |
| `/contributor/art-board` | `app/contributor/art-board/page.tsx` | Fan art submissions |
| `/contributor/dashboard` | `app/contributor/dashboard/page.tsx` | Contributor dashboard |

### Translations
| Route | File | Description |
|-------|------|-------------|
| `/translations` | `app/translations/page.tsx` | Translation hub |
| `/translations/review/[id]` | `app/translations/review/[id]/page.tsx` | Translation review page |

### Fan Content
| Route | File | Description |
|-------|------|-------------|
| `/fan-content` | `app/fan-content/page.tsx` | Fan content hub (audiobooks, art, translations) |

### Work Pages
| Route | File | Description |
|-------|------|-------------|
| `/work/[id]` | `app/work/[id]/page.tsx` | Work detail page |

---

## API Routes (`src/app/api/`) — 172 route files across 40+ namespaces

### Admin APIs (19 routes)
- `admin/bootstrap` — PIN-based admin role activation
- `admin/community-links` — Community referral link management
- `admin/contests` / `[id]` — Contest CRUD
- `admin/payouts` — Payout processing
- `admin/reports` — Content moderation (list + comment/[id]/action + content/[id]/action)
- `admin/settings` — Site settings (including premium_enabled, email addresses)
- `admin/stats` — Admin statistics dashboard
- `admin/stripe/events` — Stripe event log
- `admin/users` — User management
- `admin/validation-rules` / `invalidate` — Content validation rules + cache invalidation
- `admin/ad-revenue` — Ad revenue tracking

### Achievement APIs (3 routes)
- `achievements/[userId]` — Get user achievements/points
- `achievements/[userId]/featured` — Pin/unpin featured achievements (4-pin cap)
- `achievements/[userId]/visibility` — Toggle achievement visibility on profile

### Ad APIs (3 routes)
- `ads/impression` — Track ad impressions
- `ads/placements` / `[id]` — Ad placement management

### Analytics APIs (2 routes)
- `analytics/pageview` — Page view tracking
- `analytics/site-stats` — Site-wide statistics

### Auth APIs (5 routes)
- `auth/[...nextauth]` — NextAuth session provider
- `auth/check-username` — Username availability check
- `auth/current-user` — Get current authenticated user
- `auth/set-username` — Set username (onboarding step 1)
- `auth/sync-user` — Sync user profile data

### Bookmark APIs (1 route)
- `bookmarks` — Create/remove bookmarks

### Chapter Content API (1 route)
- `chapter/[workId]/[chapterId]/content` — Chapter content with translation support

### Comment APIs (6 routes)
- `comments` — Create/list comments
- `comments/[id]` / `[id]/like` / `[id]/react` / `[id]/report` / `[id]/resolve` — Comment CRUD + moderation

### Contest APIs (2 routes)
- `contests` / `[id]/enter` — Contest listing + entry submission

### Contributor APIs (3 routes)
- `contributor/glossary/[workId]` — Glossary contributions per work
- `contributor/qa-queue` / `qa-vote` — Quality assessment queue + voting

### Creator APIs (8 routes)
- `creator/analytics` — Creator analytics dashboard
- `creator/dashboard-stats` — Dashboard statistics
- `creator/debug` — Debug endpoint
- `creator/earnings` — Earnings tracking
- `creator/fan-content-settings` — Fan content preferences
- `creator/fanart` — Fan art management
- `creator/moderation/comments` / `[id]/action` — Comment moderation queue + actions
- `creator/payouts/request` — Payout request submission
- `creator/profile` — Creator profile management

### Edit Suggestions APIs (3 routes)
- `edit-suggestions` — Submit reader suggestions
- `edit-suggestions/[id]/approve` / `[id]/reject` — Moderator approve/reject

### Fan Content APIs (1 route)
- `fan-content/vote` — Vote on fan content submissions

### Fan Translation APIs (2 routes)
- `fan-translations/[id]/rate` — Rate translation quality (star rating, auto-promote at threshold)
- `fan-translations/[id]/suggest` — Submit translation suggestion

### Feed API (1 route)
- `feed` — Discovery feed with community_genres cookie cold-start seeding

### Health APIs (2 routes)
- `health` / `health-edge` — Health check endpoints

### Image APIs (1 route)
- `image/cover/[id]` — Cover image serving

### Join API (1 route)
- `join/[slug]` — Community referral link handler + signup tracking

### Library API (1 route)
- `library` — User's library (bookmarks, follows)

### Like APIs (1 route)
- `likes` — Story like/unlike

### Living World APIs (5 routes)
- `living-world` / `[worldId]` — World CRUD + definition management
- `living-world/[worldId]/canon` — Canon entry management
- `living-world/[worldId]/contradictions` — Lore contradiction scanning
- `living-world/[worldId]/lore-master` — AI lore master agent endpoint
- `living-world/[worldId]/votes` — World Council voting

### Moderation APIs (2 routes)
- `moderation/queue` / `[id]` — Content moderation queue + item management
- `moderation/report` — Report submission

### Notification APIs (2 routes)
- `notifications` — Notification center + 60s polling data
- `notifications/[id]` — Mark as read, delete

### Onboarding APIs (1 route)
- `onboarding/book-search` — Google Books API integration for taste discovery

### Premium APIs (1 route)
- `premium` — Premium subscription management

### Profile APIs (1 route)
- `profile` — User profile management

### Quality Assessment APIs (2 routes)
- `quality-assessment` / `[id]` — QA scoring + detail retrieval

### Reader APIs (3 routes)
- `reader` — Reader-specific endpoints
- `reading-progress` — Reading progress tracking
- `reading-sessions` — Reading session management

### Search API (1 route)
- `search` — Full-text search with publishedWithinDays param

### Series APIs (2 routes)
- `series` / `[id]` — Series CRUD + subscription endpoint (`[id]/subscribe`)

### Signal APIs (1 route)
- `signals` — Recommendation signal management

### Social APIs (1 route)
- `social` — Social interaction endpoints

### Stripe APIs (2 routes)
- `stripe/checkout` — Checkout session creation
- `stripe/webhook` — Stripe webhook handler with idempotency + event logging

---

## Components (`src/components/`) — 155 .tsx files

Key components by category:

### Reader & Content
- `ChaptursReader.tsx` — Main chapter reader (large body typography, line-height 1.7–1.8)
- `ChapterBlockRenderer.tsx` — Chapter content rendering with translation support
- `ChapterTopBar.tsx` — Chapter navigation bar
- `ChapterReactionBar.tsx` — Reader reaction/emoji bar
- `InfiniteFeed.tsx` — Infinite scroll feed with pagination
- `NewAndPromisingSection.tsx` — Horizontal strip of recent works above main feed
- `MaturityGate.tsx` — Maturity gate interstitial for R/NC-17 works (now implemented)
- `QualityCelebration.tsx` / `QualityReportModal.tsx` / `QualityVoteModal.tsx` — Quality assessment UI
- `RateWorkModal.tsx` — Rate work modal component

### Editor & Creator Tools
- `ChaptursEditor.tsx` — TipTap-based chapter editor (FontFamily extension, 8 curated fonts)
- `AdvancedUploader.tsx` — File upload with progress tracking
- `CoverUploadField.tsx` — Cover image upload field
- `BlockEditors.tsx` / `RichTextEditor.tsx` — Block and rich text editing components
- `ExperimentalEditor.tsx` — Experimental editor variant
- `PrePublishChecklist.tsx` — Pre-publish validation checklist

### Feed & Discovery
- `FeedCard.tsx` — Story card component (cover art, genre badges, metadata)
- `BrowsePageClient.tsx` — Browse page client wrapper
- `TrendingPageClient.tsx` — Trending page client wrapper

### Profile & Achievements
- `AchievementBadge.tsx` — Achievement badge display
- `AchievementsBlock.tsx` — User achievements/level block on profile
- `FeaturedAchievements.tsx` — Pinned featured achievements (4-pin cap)

### Characters & Glossary
- `CharacterCard.tsx` / `CharacterModal.tsx` / `CharacterProfileModal.tsx` / `CharacterProfileViewModal.tsx` — Character management UI
- `CharacterTooltip.tsx` — Hover tooltip for character names in reader
- `GlossarySystem.tsx` / `GlossaryTermModal.tsx` — Glossary management
- `HtmlWithGlossary.tsx` / `HtmlWithHighlights.tsx` — HTML rendering with glossary/highlight support

### Comments & Social
- `CommentForm.tsx` / `CommentItem.tsx` / `CommentSection.tsx` — Comment system
- `CommentModerationPanel.tsx` — Moderator comment management
- `InlineBlockComments.tsx` — Inline block-level comments
- `SelectionActionToolbar.tsx` — Toolbar for text selection actions

### Admin & Settings
- `AdSupportSettings.tsx` — Reader ad support level settings
- `BetaWelcome.tsx` — Beta welcome banner
- `BuildingInPublicStats.tsx` — Roadmap stats display
- `ModerationDashboard.tsx` — Content moderation dashboard UI

### Modals & Overlays
- `ConfirmMatureModal.tsx` — Mature content confirmation modal
- `ChunkRecovery.tsx` — Chapter chunk recovery UI
- `EditSuggestionModal.tsx` / `EditSuggestionsPanel.tsx` — Edit suggestion UI

### Creator Hub Components
- `CreatorAnalyticsDashboard.tsx` — Creator analytics dashboard
- `CreatorCollaboratorsHub.tsx` — Collaborator management hub
- `CreatorCommentModerationHub.tsx` — Comment moderation for creators
- `CreatorFanartPage.tsx` / `CreatorGlossaryPage.tsx` — Creator content pages
- `CreatorMonetizationHub.tsx` — Monetization settings and tracking
- `CreatorSuggestionQueue.tsx` / `CreatorSuggestionsHub.tsx` — Suggestion moderation queue

### Series & Subscriptions
- `SeriesManager.tsx` — Series management UI
- `SeriesSubscribeButton.tsx` — One-click series subscription button

### Translation & Language
- `TranslationPanel.tsx` — Translation panel in chapter reader
- `TranslationSubmissionForm.tsx` — Fan translation submission form
- `LanguageSelectorMenu.tsx` — Language selection dropdown

### Audiobooks & Fan Content
- `AudiobookSelectorMenu.tsx` / `AudiobookSubmissionForm.tsx` — Audiobook features
- `FanContentHub.tsx` — Fan content hub (audiobooks, art, translations)

### UI Utilities
- `AppLayout.tsx` — Main app layout wrapper with sidebar
- `Sidebar.tsx` — Navigation sidebar component
- `EditorSidebar.tsx` — Editor-specific sidebar
- `EmojiPicker.tsx` — Emoji picker for comments/reactions
- `ErrorBoundary.tsx` / `global-error.tsx` — Error boundary components
- `NotificationBell.tsx` — Notification bell with unread count
- `PageViewTracker.tsx` — Page view tracking component
- `ReaderMonetizationSettings.tsx` — Reader ad density settings
- `ReportButton.tsx` / `ReportModal.tsx` — Content reporting UI
- `StickyAudioScrubber.tsx` — Audio playback scrubber
- `WorkCharactersPage.tsx` / `WorkCollaboratorsPage.tsx` / `WorkGlossaryPage.tsx` — Work detail pages
- `WorkRatingSystem.tsx` / `WorkViewer.tsx` — Work rating and viewing components

---

## Libraries (`src/lib/`) — 66 modules

### Core Services
- `ContentValidationService.ts` — Content validation (maturity checks, image safety via Google Cloud Vision)
- `config.ts` — Application configuration
- `email.ts` — Email sending (Resend integration)
- `logger.ts` — Structured logging
- `notifications.ts` — Notification service

### Database & Data
- `database/PrismaService.ts` — Prisma client singleton
- `database/schema.sql` — Raw SQL schema reference
- `api/DataService.ts` — Generic external API client (moved from root lib)
- `api/errorHandling.ts` / `api/schemas.ts` — Error handling and Zod schemas

### Authentication & Authorization
- `auth/feature-access.ts` — Feature flag access control
- `collaborationAccess.ts` — Collaborator permission checks (canEdit, canPublish)
- `resolveDbUserId.ts` — User ID resolution utility

### Chapter Management
- `chapterLockStore.ts` — Durable chapter locking (database-backed SectionLock model)
- `sectionVersioning.ts` — Section version history tracking

### Collaboration
- `collaborationActivity.ts` — Collaboration activity logging
- `collaborationPatchValidation.js` / `.ts` — Patch validation for collaborative editing

### Feed & Caching
- `feedCache.ts` — Feed snapshot cache (stores items+page+scroll on unmount)
- `cache/social-cache.ts` — Social data caching

### Translation System
- `translation.ts` — LLM-powered translation (`translateBatch`, `translateBatchChunked`)
  - Uses OpenRouter with `meta-llama/llama-3.1-8b-instruct` (configurable)
  - In-memory sliding-window rate limiter (20 req/hr per IP)
  - Auto-chunks >50 blocks sequentially

### Recommendations
- `recommendations/reader-signals.ts` — Reader completion signals → co-completion scores
- `recommendations/IntelligentRecommendationEngine.ts` — Multi-layer recommendation cascade
- `recommendations/RecommendationEngine.ts` / `SignalTracker.ts` / `similarity.ts` — Recommendation engine components
- `recommendations/recommendation_schema.sql` — Schema reference for recommendation tables

### Living World / Lore
- `living-world/canon-repository.ts` — Canon entry storage/retrieval
- `living-world/contradiction-scanner.ts` — AI contradiction detection
- `living-world/lore-master-client.ts` — OpenRouter lore master agent
- `living-world/world-repository.ts` — World definition CRUD

### Quality Assessment
- `quality-assessment/assessment-service.ts` — LLM quality scoring (6 dimensions)
- `quality-assessment/assessment-sync.ts` — Async assessment processing
- `quality-assessment/cumulative-review.ts` — Reader review aggregation
- `quality-assessment/llm-service.ts` — LLM calls for QA
- `quality-assessment/types.ts` — Type definitions

### Achievements & Points
- `achievements/points.ts` — Points ledger + achievement awarding

### Ads & Monetization
- `ads/ad-eligibility.ts` — Ad eligibility checks
- `ads/density-calculator.ts` — Ad density calculation
- `payment.ts` — Payment processing helpers
- `r2.ts` / `r2-usage.ts` — Cloudflare R2 storage + usage tracking/alerts

### Analytics & Monitoring
- `analytics/view-counter.ts` — Page view counting with viewCount field
- `observability/monetization-logger.ts` — Monetization event logging
- `observability/scheduler-logger.ts` — Scheduler event logging
- `observability/world-logger.ts` — Living World event logging

### Digest & Scheduling
- `digest/weeklyDigest.ts` — Weekly email digest generation
- `scheduler/run-lock.ts` — Distributed lock for scheduled tasks

### Emoji System
- `emoji/customEmojis.ts` / `emoji/emojiData.ts` — Custom emoji definitions and data

### Suggestions
- `suggestions/suggestion-permissions.ts` — Edit suggestion permission checks

### External APIs
- `api/twitch.ts` / `api/x.ts` / `api/youtube.ts` — Social media integrations

### Utilities
- `images.ts` / `image-processing.ts` — Image processing (Sharp)
- `rate-limit.ts` — Rate limiting utilities
- `realtime.ts` — Real-time event handling (Pusher integration)
- `redis.ts` — Redis operations (raw fetch, no @upstash/redis SDK)
- `sanitize.ts` — HTML sanitization (DOMPurify)
- `settings.ts` — Site settings management
- `selectionActionRegistry.tsx` — Text selection action registry for reader highlights
- `supabase-edge.ts` — Supabase edge function client

---

## Prisma Schema Models (2,375 lines)

Key models in the schema (`prisma/schema.prisma`):
- **User** / **UserProfile** — Core user model with role, adSupportLevel, isPremium, etc.
- **Work** / **Section** / **SectionLock** / **SectionVersion** / **SectionEditSuggestion** — Story and chapter data
- **Series**, **SeriesVolume**, **SeriesWork** — Series grouping
- **CharacterProfile**, **CharacterVersion**, **CharacterRelationship**, **GlossaryEntry**, **GlossaryDefinitionVersion** — Character/glossary tracking
- **Comment**, **CommentLike**, **CommentReport**, **BlockComment** — Comment system variants
- **Like**, **Bookmark**, **ReadingHistory**, **ReadingSession** — Reader interactions
- **Achievement**, **UserAchievement**, **PointsLedger**, **LevelTier** — Achievement system
- **WorkCollaborator**, **CollaborationActivity** — Collaboration features
- **LivingWorld**, **CanonEntry**, **CanonCharacter**, **LoreContradictionFlag**, **WorldCouncilVote**, **WorldCouncilMember** — Living World / lore
- **FanTranslation**, **FanAudiobook**, **ImageSubmission**, **FanContentVote** — Fan contributions
- **ContentReport**, **ContentModerationQueue**, **QualityAssessment**, **QualityAssessmentHistory**, **QualityAssessmentQueue**, **AssessmentFeedback**, **AssessmentPromptTemplate** — Moderation & QA
- **UserSignal**, **WorkSemanticProfile**, **AuthorRecommendation**, **CreatorRecommendation**, **ContentSimilarity**, **RecommendationCache**, **RecommendationFeedback** — Recommendation system
- **Payout**, **AdPlacement**, **AdImpression**, **AdCampaign**, **AdPlacementMetrics**, **DefaultAdConfig**, **PremiumRevenuePool** — Monetization
- **StripeEventLog**, **Subscription** — Payment tracking
- **CommunityLink**, **Contest**, **ContestEntry**, **Tier3Deal** — Community features
- **Notification**, **Translation**, **TranslationSuggestion**, **TranslationVote**, **TranslatorProfile** — Translation system
- **Author**, **AuthorEarnings**, **WorkRating**, **TrendingMetric**, **SearchAnalytic** — Analytics
- **SiteSettings**, **ValidationRule**, **ContentValidation**, **ABTestGroup**, **LLMUsageLog**, **ProfileBlock** — Platform management

---

## Tests (`__tests__/` + `tests/`)

### Jest Unit Tests (`__tests__/`)
- `monetization.test.js` — Monetization-related tests

### Playwright E2E Tests (`tests/`)
- `achievements.spec.ts` — Achievement system tests
- `mobile-smoke.spec.ts` — Mobile smoke suite: feed, reader, editor flows
- Configured in `playwright.config.ts`
- Scripts: `npm run test:e2e`, `npm run test:e2e:mobile`

### Test API Routes (`src/app/api/test/`)
- `/api/test-db` — Database connectivity tests
- `/api/test-error-handling` — Error handling tests
- `/api/test-node` — Node environment tests
- `/test-upload` — File upload testing page

---

## Deployment & Operations

### Stack
- **Framework**: Next.js 15 (App Router) with Turbopack dev
- **Runtime**: Node.js 20.x, standalone output mode
- **Database**: PostgreSQL via Prisma ORM (Supabase hosted)
- **Storage**: Cloudflare R2 for images/covers
- **Email**: Resend API
- **AI/LLM**: OpenRouter SDK (`openai` package) — no groq-sdk dependency
- **Auth**: NextAuth v5 with Google OAuth
- **Payments**: Stripe v19
- **Monitoring**: Sentry (free tier, DSN via GitHub Secrets)
- **Real-time**: Pusher for live updates

### VPS Deployment
- Auto-deploy via GitHub Actions runner
- PM2 process manager (`ecosystem.config.js`)
- Nginx reverse proxy with static file serving
- Prisma client generated standalone + rsynced to VPS
- `prisma db push` runs on the runner (not VPS)

### CI/CD
- `.github/workflows/deploy-vps.yml` — VPS deployment pipeline (build, prisma push, rsync, PM2 reload)
- `.github/workflows/recommendation-refresh.yml` — Recommendation signal refresh cron (`0 */6 * * *`)
- `.github/workflows/squad-heartbeat.yml` — Squad agent heartbeat (every 30 min, reacts to issues/PRs)
- `.github/workflows/squad-issue-assign.yml` — Auto-assign squad work items to agents
- `.github/workflows/squad-triage.yml` — Squad issue triage workflow
- `.github/workflows/sync-squad-labels.yml` — Sync squad labels across repos

---

## Documentation (`docs/`)

### Index & Summaries (`docs/summaries/`)
- `feature-systems.md` — Feature overview
- `implementations-release.md` — Implementation release notes
- `bugs-fixes.md` — Bug fix history
- `deployment-ops.md` — Deployment operations guide
- `database-data.md` — Database data reference
- `roadmap-ideas.md` — Future roadmap ideas
- `testing-qa.md` — Testing and QA procedures
- `security-sensitive.md` — Security-sensitive information
- `methods-paths.md` — API methods and paths reference
- `visuals.md` — Visual design assets
- `source-index.md` — Cross-reference index for source docs
- `task-suggestions-core.md` / `task-suggestions-features.md` — Task suggestions

### Source Documents (`docs/source/`)
Organized by category:
- `features/` — Feature specifications (character profiles, comments, content moderation, editor, emoji system, fanart, glossary, image upload, quality assessment, work management)
- `implementations/` — Implementation details and release notes
- `plans/` — Strategic plans (Gutenberg import pipeline spec)
- `fixes/` — Bug fix documentation
- `ops/` — Operations runbooks
- `database/` — Database schema docs, migration summaries, integration guides
- `testing/` — Test documentation
- `visuals/` — Visual design documents

### Architecture (`docs/architecture/`)
- `ai-storytelling-external-bot-runtime-concept.md` — External AI bot architecture contract
- `migration-order.md` — Migration ordering guide
- `phase1-adoption-audit.md` — Phase 1 adoption audit
- `plan-contracts.md` — Plan contracts

### Operations (`docs/operations/`)
- `env-matrix.md` — Environment variable reference matrix
- `monetization-launch-checklist.md` — Monetization go-live checklist
- `release-gates.md` — Release gate criteria

### Security (`docs/security/`)
- `SECURITY_AUDIT_2026-04-04.md` — Security audit report from April 4, 2026

---

## Scripts (`scripts/`)

- `addSafetyRule.mjs` — Add content safety rule
- `auditor.py` — Python-based codebase auditor
- `echo_worker.py` / `hermes_worker.py` — Python worker scripts for autonomous tasks
- `fix-r2-urls.js` — Fix R2 URL references
- `process-queue.js` — Queue processing utility (QA queue, moderation queue)
- `test-db.ts` — Database connectivity and schema validation tests
- `test-deploy.sh` — End-to-end deployment verification
- `verify-stripe-webhook.ps1` — Stripe webhook signature verification (PowerShell)
- `sql/` — SQL script directory

---

## Key File Locations Quick Reference

| What | Path |
|------|------|
| Prisma schema | `prisma/schema.prisma` (2,375 lines) |
| Database seed | `prisma/seed.ts` |
| Next.js config | `next.config.js` |
| Tailwind config | `tailwind.config.js` |
| TypeScript config | `tsconfig.json` |
| ESLint config | `.eslintrc.json` |
| Playwright config | `playwright.config.ts` |
| PM2 ecosystem | `ecosystem.config.js` |
| Middleware | `middleware.ts` |
| Auth config | `auth.ts` |
| Instrumentation | `instrumentation.ts`, `instrumentation-client.ts` |
| Nginx config | `nginx/` directory |
| Squad agent config | `.squad/config.json` + `.squad/agents/*/` |
