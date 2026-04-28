# Chapturs Architecture Map

## Overview
Next.js 15 app (App Router) with Prisma ORM on PostgreSQL. 172 API routes across 40+ route groups, 507 source files total. Core stack: Next.js, Prisma, Redis, S3/R2 storage, Stripe for payments. Deployment via VPS (PM2) and Vercel.

---

## Database Schema (Prisma — 2375 lines, 89 models)

### Core Models
- **User** — accounts, auth, roles (user/moderator/admin), premium status, ad support level
- **Work** — serialized fiction works (stories/novels), chapters, sections
- **Chapter** — individual chapters within a work
- **Section** — granular content blocks within chapters (supports versioning, locking, collaboration)
- **AuthorProfile** — author-specific metadata and settings

### Reader Features
- **Subscription** — user subscriptions to works/authors
- **Bookmark** / **Like** / **ReadingHistory** / **ReadingSession** — reader engagement tracking
- **UserProfile** — taste profile for recommendations (taste samples, preferences)
- **UserSignal** — implicit signals (reading time, completion rate, skip patterns)
- **RecommendationCache** / **RecommendationFeedback** — recommendation system state

### Creator Features
- **WorkCollaborator** — co-authoring permissions on works
- **SectionEditSuggestion** — community edit suggestions with approval workflow
- **SectionVersion** — version history for collaborative editing
- **SectionLock** / **SectionPresence** — real-time collaboration locks and cursors

### Community & Living World
- **LivingWorld** — shared universes across multiple works (fan-created canon)
- **CanonEntry** / **CanonCharacter** — canonical facts/characters within a living world
- **LoreContradictionFlag** — automated contradiction detection between canon entries
- **WorldCouncilVote** / **WorldCouncilMember** — community governance of shared universes

### Content Quality & Moderation
- **ContentReport** / **CommentReport** — content and comment reporting system
- **QualityAssessment** — work quality scoring (LLM-powered)
- **WorkRating** — user ratings for works
- **Comment** — threaded comments with likes, reactions, reports

### Monetization
- **Payout** — author payout requests and processing
- **AdPlacement** / **AdImpression** — ad system tracking
- **CreatorRecommendation** — creator-to-reader recommendation features
- **StripeCustomer** / **StripeSubscription** — payment integration

### Fan Content Contributions
- **FanTranslation** — community translations with voting/rating
- **FanAudiobook** — community audiobook submissions
- **FanContentVote** — voting on fan content quality
- **Tier3Deal** — premium tier deal proposals from contributors

### Gamification
- **Achievement** / **UserAchievement** — badges and milestones (bronze/silver/gold/platinum)
- **PointsLedger** — points system for actions (publishing chapters, reading, etc.)
- **LevelTier** — progression levels (Newcomer → Apprentice → Journeyman, etc.)

### Analytics & Notifications
- **Notification** — in-app notifications
- **SearchAnalytic** — search behavior tracking
- **ABTestGroup** — A/B testing framework

---

## API Routes (~172 route files)

### Auth & Users
| Route | Purpose |
|-------|---------|
| `api/auth/[...nextauth]` | NextAuth.js authentication |
| `api/auth/current-user` | Get current authenticated user |
| `api/auth/sync-user` | Sync user profile data |
| `api/user/profile`, `user/account`, `user/monetization` | User management |

### Works & Chapters (Core Content)
| Route | Purpose |
|-------|---------|
| `api/works/[id]` | Get/update work details |
| `api/works/route` | List/create works |
| `api/works/user/[userId]` | User's works |
| `api/works/publish`, `works/drafts` | Publishing workflow |
| `api/works/import` | Universal story importer endpoint |
| `api/chapter/[workId]/[chapterId]/content` | Chapter content retrieval |

### Sections (Granular Content Blocks)
| Route | Purpose |
|-------|---------|
| `api/works/[id]/sections` | List sections within a work |
| `api/works/[id]/sections/[sectionId]` | Get/update section |
| `api/works/[id]/sections/[sectionId]/versions` | Section version history |
| `api/works/[id]/sections/[sectionId]/lock` | Real-time collaboration lock |
| `api/works/[id]/sections/[sectionId]/presence` | Live presence/cursors |

### Feed & Recommendations
| Route | Purpose |
|-------|---------|
| `api/feed` | Main feed with recommendations |
| `api/search` | Full-text search across works |
| `api/library` | User's library (saved/reading) |
| `api/signals` | Reader signal tracking |

### Creator Dashboard
| Route | Purpose |
|-------|---------|
| `api/creator/dashboard-stats` | Creator analytics overview |
| `api/creator/analytics` | Detailed work analytics |
| `api/creator/earnings` | Revenue/payout data |
| `api/creator/profile` | Author profile management |
| `api/creator/works` | Creator's works management |

### Admin Panel
| Route | Purpose |
|-------|---------|
|| `api/admin/users`, `admin/stats`, `admin/settings` | User and system admin |
|| `api/admin/payouts`, `admin/ad-revenue` | Financial administration |
|| `api/admin/contests`, `admin/community-links` | Community management |

### Fan Content & Translations
| Route | Purpose |
|-------|---------|
| `api/fan-translations/[id]/suggest`, `[id]/rate` | Translation submission and voting |
| `api/translations/route`, `translations/submit` | Translation management |
| `api/fan-content/vote` | Fan content quality voting |

### Living World System
| Route | Purpose |
|-------|---------|
| `api/living-world/[worldId]` | Get living world details |
| `api/living-world/[worldId]/canon` | Canon entries for a world |
| `api/living-world/[worldId]/contradictions` | Lore contradiction detection |
| `api/living-world/[worldId]/lore-master` | AI-powered lore management |

### Social & Integrations
| Route | Purpose |
|-------|---------|
| `api/social/x/user/[username]`, `social/youtube/channel/` | Social media integrations |
| `api/social/discord/server/[guildId]` | Discord integration |
| `api/social/twitch/channel/[channelName]` | Twitch integration |

### Payments & Premium
| Route | Purpose |
|-------|---------|
| `api/stripe/checkout`, `stripe/webhook` | Stripe payment processing |
| `api/premium/status` | Check premium subscription status |
| `api/user/taste-profile`, `user/taste-profile/samples` | Taste profile for recommendations |

### Quality Assessment (LLM-powered)
|| Route | Purpose |
||-------|---------|
|| `api/quality-assessment/[workId]` | Get quality score for a work |
|| `api/quality-assessment/process`, `queue`, `stats` | LLM assessment pipeline |

### Cron Jobs & Scheduling
|| Route | Purpose |
||-------|---------|
|| `api/cron/flush-analytics` | Analytics data flush |
|| `api/cron/process-assessments` | Background quality assessment processing |
|| `api/cron/weekly-digest` | Weekly email digest delivery |

### Contests & Events
|| Route | Purpose |
||-------|---------|
|| `api/contests`, `contests/[id]/enter` | Contest creation and entry management |
|| `admin/contests`, `admin/contests/[id]` | Admin contest management |

### Contributor Quality Assessment
|| Route | Purpose |
||-------|---------|
|| `api/contributor/glossary/[workId]` | Glossary contribution tracking |
|| `api/contributor/qa-queue`, `contributor/qa-vote` | Community QA voting system |

### Series System (v04)
|| Route | Purpose |
||-------|---------|
|| `api/series`, `series/[seriesId]` | Series CRUD operations |
|| `api/series/[seriesId]/subscribe` | Subscribe to all works in a series |
|| `api/series/[seriesId]/works` | List works within a series |

### Creator Ads & Recommendations
|| Route | Purpose |
||-------|---------|
|| `api/creator-ads/recommendations` | Creator-to-reader recommendation setup |
|| `api/default-ads/config`, `default-ads/config` | Default ad configuration management |

### Upload Pipeline
|| Route | Purpose |
||-------|---------|
|| `api/upload/request`, `upload/confirm`, `upload/delete` | Multi-step file upload pipeline |
|| `api/upload/cover`, `upload/debug` | Cover image upload and debugging |
|| `api/upload/parse-document` | Document parsing for story import (DOCX/PDF) |

### Reader Stats & Progress
|| Route | Purpose |
||-------|---------|
|| `api/reader/stats` | Per-reader reading statistics |
|| `api/reading-progress`, `reading-sessions` | Reading progress tracking and session management |

### Health Checks
||| Route | Purpose |
|||-------|---------|
||| `api/health`, `health-edge` | Application health monitoring (standard + edge) |

### Testing & Tier 3 Deals
||| Route | Purpose |
|||-------|---------|
||| `api/test/*`, `test-db/*`, `test-error-handling/*`, `test-node/*` | Test endpoints and database testing utilities |
||| `api/tier3-deals/*` | Premium tier deal proposals from contributors |

---

## Key Libraries (`src/lib/`)

### Core Services
- **api/DataService.ts** — Central data access layer (abstraction over Prisma)
- **database/PrismaService.ts** — Prisma client singleton + connection pooling
- **database/schema.sql** — Raw SQL schema definitions
- **ContentValidationService.ts** — Content moderation and validation
- **config.ts** / **settings.ts** — Application configuration

### Recommendation System (`src/lib/recommendations/`)
- **IntelligentRecommendationEngine.ts** — Main recommendation engine (ML-based)
- **RecommendationEngine.ts** — Fallback/basic recommendation logic
- **SignalTracker.ts** — Tracks reader signals (reading time, completion, skips)
- **reader-signals.ts** — Reader behavior signal extraction
- **similarity.ts** — Content similarity calculations
- **recommendation_schema.sql** — SQL schema for recommendation tables

### Living World (`src/lib/living-world/`)
- **canon-repository.ts** — Canon entry management
- **contradiction-scanner.ts** — Automated lore contradiction detection
- **lore-master-client.ts** — AI-powered lore assistant
- **world-repository.ts** — Living world CRUD operations

### Quality Assessment (`src/lib/quality-assessment/`)
- **assessment-service.ts** — Work quality scoring service
- **llm-service.ts** — LLM integration for content assessment
- **cumulative-review.ts** — Aggregated review system
- **assessment-sync.ts** — Async assessment processing

### Translation (`src/lib/translation.ts`)
- Auto-translation pipeline (5-phase design)
- Fan translation management and voting

### Collaboration (`src/lib/collaboration*`, `chapterLockStore.ts`)
- **collaborationAccess.ts** — Co-authoring permissions
- **collaborationActivity.ts** — Activity tracking for collaborators
- **collaborationPatchValidation.js** — Real-time edit conflict resolution (JS file)
- **chapterLockStore.ts** — Chapter-level locking mechanism

### Additional Libraries
- **achievements/** — Points system and achievement logic (`points.ts`)
- **ads/** — Ad eligibility and density calculation (`ad-eligibility.ts`, `density-calculator.ts`)
- **analytics/view-counter.ts** — Page view counting with `viewCount` field
- **api/** — API helpers: errorHandling, schemas, twitch/x/youtube integrations
- **auth/feature-access.ts** — Feature flag and access control checks
- **cache/social-cache.ts** — Social media cache (Discord, YouTube, Twitch)
- **database/PrismaService.ts** — Prisma client singleton + connection pooling (also listed under Core Services)
- **digest/weeklyDigest.ts** — Weekly email digest batching
- **email.ts** — Email sending service (Resend integration)
- **emoji/** — Custom emoji system (`customEmojis.ts`, `emojiData.ts`)
- **feedCache.ts** — Redis-based feed caching with intelligent invalidation
- **image-processing.ts**, **images.ts** — Cover image processing and optimization
- **logger.ts** — Application logging utility
- **mockData.ts** — Mock data generators for testing
- **notifications.ts** — In-app notification helpers
- **observability/** — Monitoring logs (monetization, scheduler, world)
- **payment.ts** — Payment processing utilities
- **r2-usage.ts**, **r2.ts** — S3/R2 storage management
- **rate-limit.ts** — Sliding-window rate limiter
- **realtime.ts** — Real-time collaboration utilities
- **redis.ts** — Redis client wrapper (raw fetch, no SDK)
- **resolveDbUserId.ts** — Database user ID resolution helper
- **sanitize.ts** — HTML/content sanitization
- **scheduler/run-lock.ts** — Cron job distributed locking
- **sectionVersioning.ts** — Section version management
- **suggestions/suggestion-permissions.ts** — Edit suggestion permission checks
- **selectionActionRegistry.tsx** — Reader selection action handlers
- **supabase-edge.ts** — Supabase edge client utilities
- **test-ad-system.ts**, **test-creator-apis.ts** — Test utility scripts

### Custom Hooks (`src/hooks/`)
- **useEmojiAutocomplete.ts** — Emoji autocomplete for editor
- **usePretext.ts** — Pretext processing hooks
- **useRecommendationTracking.tsx** — Recommendation interaction tracking
- **useUser.tsx** — User session/auth state hook

### Type Definitions (`src/types/`)
- **achievements.ts** — Achievement and points type definitions
- **ads.ts** — Ad system types
- **chapt.ts** — Core Chapturs domain types (Work, FeedItem, etc.)
- **comment.ts** — Comment-related types
- **creator-ads.ts** — Creator ad configuration types
- **index.ts** — Main type exports (User, Work, Author, etc.)
- **next-auth.d.ts** — NextAuth type augmentation

### Frontend Components (`src/components/`) — 158 files total

### Reader Experience
- **ChaptursReader.tsx** — Main reading interface
- **ChapterBlockRenderer.tsx** — Renders individual content blocks with glossary/highlight support
- **ChapterReactionBar.tsx** — Chapter-level reactions/comments toggle
- **ChapterTopBar.tsx** — Navigation and chapter controls
- **InfiniteFeed.tsx** — Infinite scroll feed with caching
- **BrowsePageClient.tsx** — Client-side browse page wrapper with genre/status filters
- **NewAndPromisingSection.tsx** — Horizontal strip of recent works on homepage
- **TrendingPageClient.tsx** — Trending page client component with time filters
- **MaturityGate.tsx** — R/NC-17 content interstitial gate
- **TranslationPanel.tsx** — Translation banner with language selector and original toggle
- **LanguageSelectorMenu.tsx** — Language selection dropdown for reader
- **AudiobookSelectorMenu.tsx** — Audiobook playback controls
- **StickyAudioScrubber.tsx** — Audio scrubber bar for audiobook playback
- **ChunkRecovery.tsx** — Chapter chunk recovery UI for interrupted reads
- **HtmlWithGlossary.tsx** — HTML rendering with glossary term highlights
- **HtmlWithHighlights.tsx** — HTML rendering with reader highlight support
- **InlineBlockComments.tsx** — Inline comments within chapter blocks
- **MobileTextBox.tsx** — Mobile-friendly text display component
- **NotificationBell.tsx** — In-app notification bell icon with unread count
- **PageViewTracker.tsx** — Global page view tracking for analytics
- **UserSync.tsx** — User session sync component

### Editor & Creator Tools
- **ChaptursEditor.tsx** — Block-based writing editor (8 block types)
- **CreatorEditor.tsx** — Creator-specific editor interface
- **ExperimentalEditor.tsx** — Experimental/legacy editor variant
- **AdvancedUploader.tsx** — Story import/upload with parsing
- **BlockEditors.tsx** — Individual block type editors
- **editor/ChapterEditor.tsx** — TipTap-based chapter editor with extensions (under `src/components/editor/`)
- **RichTextEditor.tsx** — Rich text editing wrapper
- **PrePublishChecklist.tsx** — Server-side validation checklist UI
- **CoverUploadField.tsx** — Dedicated cover upload field for works
- **EditorSidebar.tsx** — Editor sidebar with block management

### Community Features
- **CommentSection.tsx**, **CommentItem.tsx**, **CommentForm.tsx** — Commenting system
- **CharacterCard.tsx**, **CharacterModal.tsx** — Character management UI
- **CharacterTooltip.tsx** — Inline character tooltip for glossary-style highlights
- **CharacterProfileModal.tsx** — Detailed character profile modal
- **CharacterProfileViewModal.tsx** — Read-only character profile view modal
- **AchievementBadge.tsx**, **AchievementsBlock.tsx** — Gamification display
- **FeaturedAchievements.tsx** — Star-pin featured achievements
- **FeedCard.tsx** — Core discovery card component (cover, title, genre badges)
- **TranslationPanel.tsx** — Translation banner with language selector and original toggle
- **AudiobookSubmissionForm.tsx** — Fan audiobook submission form
- **TranslationSubmissionForm.tsx** — Community translation suggestion form
- **ReportButton.tsx**, **ReportModal.tsx** — Content reporting UI
- **ConfirmMatureModal.tsx** — Mature content confirmation modal for publishing
- **EditSuggestionModal.tsx** — Edit suggestion submission modal
- **EditSuggestionsPanel.tsx** — Inline edit suggestions display panel
- **RateWorkModal.tsx** — Work rating modal for readers
- **WorkRatingSystem.tsx** — Inline work rating system component
- **QualityCelebration.tsx** — Quality assessment celebration UI
- **QualityReportModal.tsx**, **QualityVoteModal.tsx** — QA voting/reporting UI
- **ReviewQueue.tsx** — Review queue management component

### Creator Hub Components
- **CreatorDashboard.tsx**, **CreatorDashboardNew.tsx** — Author dashboard views
- **CreatorCollaboratorsHub.tsx** — Co-author management UI
- **CreatorSuggestionQueue.tsx** — Reader edit suggestion moderation queue
- **SeriesManager.tsx** — Series/volume grouping UI
- **SeriesSubscribeButton.tsx** — One-click series subscription CTA
- **CreatorAnalyticsDashboard.tsx** — Creator analytics view
- **CreatorCommentModerationHub.tsx** — Comment moderation for creator works
- **CreatorFanartPage.tsx** — Fan art review dashboard
- **CreatorGlossaryPage.tsx** — Work-specific glossary management
- **CreatorMonetizationHub.tsx** — Monetization settings and earnings view
- **AdSupportSettings.tsx** — Reader ad support level configuration UI
- **CreatorSuggestionsHub.tsx** — Reader edit suggestions moderation hub
- **FanContentHub.tsx** — Fan content submission and browsing hub
- **WorkCharactersPage.tsx**, **WorkCollaboratorsPage.tsx**, **WorkGlossaryPage.tsx** — Work-specific management pages
- **CreatorCharactersPage.tsx** — Creator character management page
- **GlossarySystem.tsx** — Glossary system component for works
- **GlossaryTermModal.tsx** — Glossary term detail modal
- **WeeklyDigestToggle.tsx** — Weekly email digest opt-in toggle for creators
- **PretextClampText.tsx** — Text clamping utility with expand/collapse for long descriptions
- **StoryManagement.tsx** — Story-level management tools
- **PremiumSubscriptionSettings.tsx** — Premium subscription configuration UI
- **ReaderMonetizationSettings.tsx** — Reader-side monetization preferences
- **ContributorHubToggleSettings.tsx** — Contributor hub toggle settings

### Admin & Moderation
- **CommentModerationPanel.tsx** — Content moderation interface
- **CreatorAnalyticsDashboard.tsx** — Creator analytics view
- **AdPlacementEditor.tsx**, **AuthorAdSettings.tsx** — Ad management UI
- **ModerationDashboard.tsx** — Global moderation dashboard

### Profile & Social
- **profile/ProfileLayout.tsx**, **profile/ProfileSidebar.tsx** — User profile layout system (under `src/components/profile/`)
- **profile/BlockGrid.tsx**, **profile/FeaturedSpace.tsx** — Profile block grid and featured content area (under `src/components/profile/`)
- **WorkViewer.tsx** — Story detail page viewer
- **BetaWelcome.tsx** — Beta welcome banner component
- **BuildingInPublicStats.tsx** — Building-in-public statistics display

### UI Primitives & Layout
- **AppLayout.tsx** — Main application shell with sidebar + content area
- **Sidebar.tsx** — Navigation sidebar (collapsible on mobile)
- **ui/Modal.tsx**, **ui/Tooltip.tsx**, **ui/Toast.tsx** — Shared UI primitives (under `src/components/ui/`)
- **ui/ErrorBoundary.tsx**, **ui/FeedCardSkeleton.tsx**, **ui/StoryPageSkeleton.tsx** — Loading/error states (under `src/components/ui/`)
- **ui/Footer.tsx** — Site footer component (under `src/components/ui/`)
- **ui/FeatureHint.tsx** — Feature hint/guide component (under `src/components/ui/`)

### Editor Extensions & Tools
- **editor/extensions.tsx** — TipTap extension definitions (font family, etc.)
- **editor/convert.ts** — HTML/Tiptap content conversion utilities
- **SelectionActionToolbar.tsx** — Reader text selection action toolbar
- **EmojiPicker.tsx** — Emoji picker for editor and comments

### Ad Components (`src/components/ads/`)
- **AdSlot.tsx**, **AdPreview.tsx** — Ad placement rendering
- **AdPlacementEditor.tsx**, **AuthorAdSettings.tsx** — Ad management UI
- **CreatorRecommendationSetup.tsx** — Creator-to-reader recommendation setup
- **DefaultAdConfigManager.tsx** — Default ad configuration management
- **SupportAuthorInterstitial.tsx** — "Support the author" interstitial

### Auth Components (`src/components/auth/`)
- **UsernameGuard.tsx**, **UsernameSelectionModal.tsx** — Username selection flow

### Experimental Features (`src/components/experimental/`)
- **BranchingStoryMode.tsx**, **BranchingStoryModeSimple.tsx** — Branching narrative UI
- **VisualNovelMode.tsx** — Visual novel-style reading mode
- **WorldbuildingMode.tsx** — World-building assistant mode

### Living World Components (`src/components/living-world/`)
- **CanonGraph.tsx** — Browse/add/filter canon entries by type
- **LoreIndex.tsx** — Searchable, filterable lore entries + character cards
- **TimelineView.tsx** — Chronological event list across stories
- **WorldAtlas.tsx** — Story cards grid for shared universes
- **WorldDefinitionForm.tsx**, **WritersRoomConsole.tsx** — World creation and management

### Onboarding Components (`src/components/onboarding/`)
- **OnboardingForm.tsx** — Username selection form
- **TasteProfileSurvey.tsx** — Google Books taste discovery survey

### Profile Sub-components (`src/components/profile/`)
|- **profile/blocks/** — Block types: TextBox, ExternalLink, FavoriteAuthor, Support, DiscordInvite, TwitterFeed, TwitchChannel, YouTubeChannel, YouTubeVideo, WorkCard (10 block variants + BaseBlock base class)
|- **profile/config/** — Configuration editors for each block type (10 config components)
- **profile/editor/** — Profile editor UI (BlockPicker, EditableBlockGrid, etc.)

### Story Page Components (`src/components/story/`)
- **StoryPageClient.tsx** — Client-side story page with social sharing metadata

### Upload Components (`src/components/upload/`)
- **ImageUpload.tsx** — Cover image upload component
- **CoverUploadField.tsx** — Dedicated cover upload field for works

---

## App Pages (`src/app/`)

### Public Pages
`about`, `about/roadmap`, `browse`, `contact`, `content-policy`, `dmca`, `features`, `join/[slug]`, `legal`, `library`, `not-found`, `page` (home), `privacy`, `robots.ts`, `terms`, `contests`, `fan-content`, `search`, `trending`, `subscriptions`

### Auth & Onboarding
`auth/signin`, `onboarding` — username selection, profile setup flow with Google Books taste discovery

### Reader
`reader/settings`, `reader/stats` — Chapter reading interface with block rendering and reader settings

### Creator Dashboard
`creator/dashboard`, `creator/analytics`, `creator/characters`, `creator/editor`, `creator/fan-content-settings`, `creator/fanart`, `creator/glossary`, `creator/living-world/[worldId]`, `creator/moderation`, `creator/monetization`, `creator/profile/edit`, `creator/series`, `creator/settings`, `creator/upload`, `creator/work/[id]/chapters`, `creator/work/[id]/edit`, `creator/work/[id]/suggestions`, `creator/works`, `creator/works/[id]/characters`, `creator/works/[id]/collaborators`, `creator/works/[id]/glossary`, `creator/works/[id]/import` — Full creator hub with work management, editor, series, glossary, fan content, and moderation

### Admin Panel
`admin/*` — Full admin panel (users, payouts, settings, contests, living world management, validation rules, bootstrap, reports, ad-revenue)

### Living World & Worlds
`worlds/[worldSlug]`, `creator/living-world/[worldId]` — Shared universe browsing and creation

### Series
`series/[seriesId]` — Public series detail pages with all works listed

### Story Detail
`story/[id]/*` — Story page with chapter navigation, maturity gate, social sharing metadata

### Contributor Hub
`contributor/[username]`, `contributor/board`, `contributor/art-board`, `contributor/dashboard` — Community contributor profiles and submission boards

### Moderation & Notifications
`moderation`, `notifications` — Global moderation queue and in-app notification center

### Translations
`translations`, `translations/review/[id]` — Translation management and review pages

### Test Pages (development)
`test-upload`, `test/editor`, `test/emoji`, `test/moderation`, `test/reader` — Development/test UI pages for manual QA

---

## Key Design Patterns

1. **Block-based content model** — Works → Chapters → Sections (granular blocks with versioning, locking, collaboration)
2. **Living World system** — Cross-work shared universes with AI-powered canon management and contradiction detection
3. **Signal-driven recommendations** — Implicit reader signals (reading time, completion rate, skip patterns) feed ML recommendation engine
4. **Community governance** — Fan translations, audiobooks, lore votes, edit suggestions all have community voting systems
5. **Dual monetization** — Creator ads + premium subscriptions (no pay-per-read)
6. **Database-backed locking** — Section locks use `SectionLock` Prisma model with durable database storage; survives restarts and multi-instance deployments
7. **Cascading similarity engine** — "Readers Also Enjoyed" uses layered cascade: author picks → collaborative signals → reader-to-reader co-completion → semantic LLM Jaccard → trending → popular fallback
8. **Achievement points system** — PointsLedger tracks all point events; 5 level tiers (Newcomer → Apprentice → Journeyman, etc.); 11 seeded achievements with bronze/silver/gold/platinum tiers
9. **Taste profile onboarding** — New users discover genre preferences via Google Books API during signup; affinities stored in `UserProfile.genreAffinities` and used for feed cold-start
10. **Rate limiting** — Sliding-window rate limiter (IP-based) protects translation endpoints and other sensitive APIs
