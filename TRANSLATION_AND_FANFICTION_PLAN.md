# Translation & Fan Content Ecosystem - Implementation Plan

## Part 1: Multi-Level Translation System

### Architecture

The translation system has three layers:

#### Layer 1: AI Auto-Translation (Default)
- When a reader opens a chapter in a non-original language, AI translation is generated on-the-fly
- First read triggers translation, result is cached
- Uses Groq API (already in deps) for fast, cheap translation
- Stored with `tier: "ai_generated"`, `status: "auto"`
- Quality rank: 1-2 (baseline, functional but not polished)

#### Layer 2: Human Refinement
- Users can suggest improvements to AI translations (sentence-level)
- Users can submit full chapter translations
- Community votes (upvote/downvote)
- When a translation reaches vote threshold → promoted to `status: "approved"`
- Top-voted translation becomes the default for that language
- Quality rank: 3-4 (community-validated)

#### Layer 3: Official/Creator Translations
- Creator can mark a translation as "official" (`status: "canonical"`)
- Professional translators can be commissioned
- Quality rank: 5 (highest)

### Database Schema Updates

```prisma
model TranslationJob {
  id          String @id @default(cuid())
  workId      String
  sectionId   String
  language    String
  sourceLang  String
  status      String @default("pending") // pending, processing, completed, failed
  requestedBy String? // userId who triggered it (for manual requests)
  createdAt   DateTime @default(now())
  completedAt DateTime?
  
  @@unique([sectionId, language])
  @@map("translation_jobs")
}

model TranslatorProfile {
  id              String @id @default(cuid())
  userId          String @unique
  languages       String // JSON array: ["es", "fr", "de"]
  specializations String // JSON array: ["fantasy", "romance"]
  rating          Float  @default(0)
  completedJobs   Int    @default(0)
  totalEarnings   Float  @default(0)
  reputation      Int    @default(0) // points from votes
  bio             String? @db.Text
  createdAt       DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  @@map("translator_profiles")
}

model TranslatorRevenue {
  id            String @id @default(cuid())
  translatorId  String
  workId        String
  language      String
  month         String // YYYY-MM
  impressions   Int    @default(0)
  revenue       Float  @default(0)
  authorShare   Float  @default(0) // %
  platformShare Float  @default(0) // %
  status        String @default("pending") // pending, paid
  
  @@unique([translatorId, workId, language, month])
  @@map("translator_revenue")
}
```

### Translation Dashboard (for Translators)
- **My Languages**: Languages the translator works in
- **Work Queue**: Chapters needing translation or updates
- **Suggestions Feed**: Sentence-level AI suggestions to review
- **Earnings**: Revenue from translations
- **Reputation Score**: Based on votes, completions, quality

### Author Translation Settings
- Toggle: Enable community translations (default: on)
- Toggle: Enable AI auto-translation (default: on)
- Revenue share for translators: slider 0-50% (default: 20%)
- Require approval before publishing: toggle (default: on)

---

## Part 2: Fan Fiction & Derivative Works

### Concept
Fan fiction writers can create derivative works that credit the original. Authors can:
- Allow/disallow fan fiction of their works
- Set optional "license fee" (one-time or per-chapter)
- Get credited as the original creator

### Database Schema

```prisma
model DerivativeWork {
  id              String @id @default(cuid())
  originalWorkId  String
  fanWorkId       String @unique
  creatorId       String
  relationshipType String @default("fanfiction") // fanfiction, spinoff, inspired_by
  licenseStatus   String @default("free") // free, licensed, pending
  licenseFee      Float? // One-time fee paid
  licenseAgreedAt DateTime?
  
  originalWork Work @relation("OriginalWorks", fields: [originalWorkId], references: [id])
  fanWork      Work @relation("DerivativeWorks", fields: [fanWorkId], references: [id])
  creator      User @relation(fields: [creatorId], references: [id])
  
  @@map("derivative_works")
}

model LicenseAgreement {
  id           String @id @default(cuid())
  originalWorkId String
  fanWorkId      String
  fanAuthorId    String
  originalAuthorId String
  
  licenseType  String // one_time, monthly, revenue_share
  feeAmount    Float?
  revenueShare Float? // % of fan work ad revenue to original author
  status       String @default("active") // active, cancelled, expired
  
  createdAt DateTime @default(now())
  @@map("license_agreements")
}
```

### Fan Fiction Flow
1. Writer creates a work and marks it as "derivative of" another work
2. If original author requires license fee → payment required before publishing
3. If original author allows free fan fiction → instant approval
4. Original author gets notified of new derivative works
5. Both works link to each other on their pages

### Revenue Flows
- **Translations**: Translator gets X% of ad revenue from translated chapters (author sets %)
- **Fan Fiction**: Optional license fee (one-time) OR revenue share (% of fan work's ad revenue)
- **Platform**: Takes its 30% cut from all flows

---

## Part 4: Content Platform Vision - "YouTube but for Text"

### Core Concept
Chapturs is a unified written content platform - not just webnovels. All content types flow through one system:

- **Books/Webnovels** - Multi-chapter ongoing works
- **Articles/News** - One-shot long-form writing, exposés
- **Poetry** - Single poems or collections
- **Creepypasta/Serial Horror** - Episodic or one-shot
- **Social Posts** - Short-form thoughts, updates
- **Essays** - Multi-part series or standalone

### Architecture
One `Work` model, flexible structure:
- 1 section = article, poem, or short piece
- Many sections = book, serial, exposé
- Existing block editor handles all content types
- `contentType` field: `book | article | poem | news | essay | post`

### Feed & Discovery
- **Unified feed** - All content types mix together
- **Filter buttons** - All | Books | Articles | Poems | News (top of feed)
- **AI recommendations** - Learns user preferences (show books to book readers, articles to news readers)
- **Follow system** - Following an author boosts their content in your feed
- **Algorithm** - YouTube-style: engagement, reading time, follows, content type preference

### Social Features
- Follow authors → their new content appears in feed
- Comments on all content types
- Reactions (like YouTube but for text)
- Author one-off posts flow through same feed

### Content Type Display
- **Books**: Cover art, chapter count, reading progress
- **Articles**: Thumbnail, title, excerpt, read time
- **Poetry**: Minimalist layout, focus on text
- **News**: Headlines, timestamps, source attribution
- **Posts**: Social-style cards, short text

### Database Changes Needed
```prisma
// Add to Work model:
contentType    String  @default("book")  // book, article, poem, news, essay, post
isCollection   Boolean @default(false)   // true = multi-section work
readTimeMinutes Int?                      // estimated read time
```

---

## Updated Priority Order

### Phase 1: Fix Core Infrastructure (NOW)
1. Convert all API routes to edge runtime + Supabase REST
2. Fix profile, dashboard, settings pages
3. Get login flow fully working

### Phase 2: Translation System
1. AI auto-translation on read
2. Human translation submission + voting
3. Translator profiles + revenue

### Phase 3: Content Platform
1. Add contentType field to Work model
2. Unified feed with filters
3. Follow system
4. Content type-specific layouts

### Phase 4: Fan Fiction & Licensing
1. Derivative work model
2. License fee system
3. Revenue sharing

### Phase 5: Monetization Polish
1. Translator revenue tracking
2. Ad revenue dashboards
3. Premium tier
4. Bid system for commissioned work

---

## Technical Notes

- All new API routes use edge runtime + Supabase REST API
- AI translation via Groq API (already in dependencies)
- Revenue calculations via existing ad impression tracking
- Payment processing via Stripe (already in dependencies)
- Recommendation engine already exists in schema (UserProfile, UserSignal, etc.)

Last updated: 2026-03-18
