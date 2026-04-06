# Chapturs — Feature Roadmap
### Last updated: April 2026  ·  Status: Public beta approaching

> This document tracks where Chapturs actually is, where it is going, and the order of battle. It mirrors the public /features guide but includes honest completion status and the reasoning behind every priority.
> Sync policy: status changes in TASKS.md must also update this roadmap and /features in the same commit.

---

## Platform Status at a Glance

| Area | Status |
|---|---|
| Reading experience | ✅ Ship-ready |
| Discovery feed (signals) | ✅ Ship-ready |
| Creator editor + blocks | ✅ Ship-ready |
| Glossary system | ✅ Ship-ready |
| Character profiles | ✅ Ship-ready |
| Comment system | ✅ Ship-ready |
| Chapter reactions (emoji) | ✅ Ship-ready |
| Multi-dimension ratings | ✅ Ship-ready |
| AI quality assessment (OpenRouter) | ✅ Ship-ready |
| Fan translations (3 tiers) | ✅ Ship-ready |
| Fan audiobooks | ✅ Ship-ready |
| Fan art submissions | ✅ Ship-ready |
| Creator profile (block system) | ✅ Ship-ready |
| Analytics dashboard | ✅ Ship-ready |
| Revenue sharing system | ✅ Ship-ready |
| Admin panel (full suite) | ✅ Ship-ready |
| Contest system | ✅ Ship-ready |
| Notifications | 🔶 In progress (schema/features split) |
| Community referral links | ✅ Ship-ready |
| Cover + content image upload (R2) | ✅ Ship-ready |
| Auth (Google, GitHub, Discord) | ✅ Ship-ready |
| Bookmarks / Library | ✅ Ship-ready |
| Subscriptions | ✅ Ship-ready |
| Collaborative writing (schema) | 🔶 Schema ready, UI partial |
| Real-time co-editing (WebSocket) | ⚪ Not started |
| Writers Room / Living World | ⚪ Designed — Phase 5 |
| AI author bots | ⚪ Designed — Phase 5 |
| Mobile apps (native) | ⚪ Not planned (responsive web covers it) |

---

## Phase 1 — Foundation ✅ COMPLETE

> *Everything needed for a working platform. All items shipped.*

**Reader experience**
- Intelligent discovery feed (multi-signal: completion, reactions, subscriptions, genre, format, language, skip signals)
- Reading controls: font family, size, line height, theme (light / paper / night), brightness
- Chapter reactions (❤️ 🔥 😂 😭 🤯) feeding back into taste profile
- Bookmarks and private reading library
- Subscriptions + notifications
- Reading history

**Creator tools**
- Block-based chapter editor with prose, headings, scene dividers, images, simulation blocks (phone screens, chat UIs, branching choices, screenplay dialogue)
- Cover image upload (Cloudflare R2 with CDN proxy)
- AI quality assessment (Groq) — scores six dimensions, assigns a tier, generates a story hook
- Pre-publish checklist with quality gate
- Two-step publish workflow (work setup → content)
- Draft autosave
- Analytics: views, reads, chapter completions, subscriber growth, reactions

**Glossary system**
- Per-work glossary entries with spoiler-lock by chapter
- Inline tooltip on any highlighted word
- Suggestion system for reader-submitted glossary additions

**Character profiles**
- Creator-side full profile (name, aliases, description, appearance, traits, portrait)
- Chapter-gated reveal (character hidden until specified chapter)
- Fan art tagging to characters
- Public character page linked from story

**Community**
- Comment system (chapter-level and work-level threads)
- Threaded replies, likes, reports
- Creator comment controls (pin, hide, delete, featured)
- Featured comment system with reader badge
- Multi-dimension ratings (writing, plot, characters, world-building, pacing)

**Fan content ecosystem**
- Fan translations: 3-tier (AI instant / community-submitted / contracted professional)
- Fan audiobooks: chapter narrations, creator-approved, revenue-shared
- Fan art gallery with artist credit

**Platform infrastructure**
- Auth: Google, GitHub, Discord OAuth via NextAuth
- Role system: user / moderator / admin
- Admin panel: users, moderation queue, contests, settings, validation rules, community referral links
- Contest system with prize pool, entries, voting
- Revenue sharing: per-contributor splits, payout system
- Site settings: runtime feature flags, no-redeploy config
- Error boundaries, request-level error handling

---

## Phase 2 — Growth Tools 🔶 IN PROGRESS

> *Features for acquiring and retaining the first real user cohorts.*

### Community Referral Links ✅ Complete
Named invite links (`chapturs.com/join/royalroad-litrpg`) generated from the admin panel. Visitors land on a community-branded welcome page. Clicking through sets a feed-seeding cookie (genres + community tag) that pre-weights their discovery feed toward that community's content. Admin shows near-real-time click counts and signup counts (30-second polling). Attribution is stored on each user record.

### Feed Cookie Integration ✅ Complete
The feed API reads `community_genres` as a cold-start signal and boosts matching genres for early/new sessions.

### Public Domain Story Import ⚪ To-Do
Import 3–5 compelling public domain works from Project Gutenberg as fully-formed Chapturs works: proper cover art, AI-generated glossary entries, character profiles. Purpose is a feature demo, not content strategy. Target works: high narrative quality, genre-aligned with initial community targets.

### Founding Creator Programme ⚪ To-Do
Outreach to 5–10 mid-tier creators (1k–8k followers) on RoyalRoad / Wattpad frustrated with their current platform. Offer: founding badge, 70% ad rev share for 12 months (vs. standard 50%), direct dev access. Pitch is positioning, not money.

---

## Phase 3 — Collaborative Editor 🔶 SCHEMA READY

> *Joint ownership and co-writing capabilities.*

The database schema for `WorkCollaborator` and `CollaborationActivity` already exists. What's missing is the UI and business logic.

### Co-author Invite System
- Invite by username
- Role-based permissions (owner / editor / contributor)
- Revenue share config per collaborator
- Activity log per work

### Conflict-free Editing ⚪
- Chapter locking (prevent simultaneous edits on same chapter)
- Change suggestion mode (propose edits the owner accepts/rejects)
- Version history with per-author attribution

### Real-time Co-editing ⚪
- WebSocket infrastructure (likely Pusher or Ably)
- Live cursor presence
- Operational transformation or CRDT for conflict resolution

*This is the most complex single feature on the platform — holds off until Phase 3 is otherwise complete.*

---

## Phase 4 — Ecosystem Expansion ⚪ PLANNED

> *Features that reward existing users and deepen the platform loop.*

### Reader Contribution Tools
- Highlight any passage → suggest typo fix or wording change
- Creator accept/reject queue
- Community voting on suggestions (optional, for high-traffic works)

### Enhanced Notifications
- In-app notification centre (bell icon, unread count) — schema exists
- Email digest: weekly summary of activity on followed works
- Push notifications (Web Push API — service worker needed)

### Work Discovery Improvements
- Browse by genre, tags, completion status, update frequency
- "New and Promising" tier for AI-scored strong chapters by new creators
- Reader-to-reader recommendation ("readers who finished X also loved Y")
- Trending page beyond the feed

### Series and Volumes
- Group works into a series with a shared cover and description
- Order works within a series; readers progress automatically to the next
- Series subscription (one click covers all works in a set)

---

## Phase 5 — The Writers Room ⚪ DESIGNED

> *The highest-differentiation feature on the platform. Build only after 500+ daily readers.*

The Writers Room is a collaborative fiction layer where multiple creators write independent stories that all take place in a single shared **Living World**. Full spec in `WRITERS_ROOM_VISION.md`.

### Key components (in order)
1. **World definition** — founder writes The Beginning and The End (immutable anchors). Sets canon characters, locations, factions.
2. **Lore Master AI** — Groq-backed agent that: answers writer queries about the world, scans submissions for contradictions (hard block / soft warning), extracts new lore entries from published chapters.
3. **Canon graph** — every lore fact cites its source chapter. Spider-web model — expands outward, never contradicts.
4. **World Council** — small admin group with veto on canon disputes.
5. **Reader-facing** — World Atlas (browsable map), Lore Index (cross-story character/location cards), Timeline View (all stories plotted on world history).

### Technical requirements
- `LivingWorld`, `CanonEntry`, `CanonCharacter`, `LoreContradictionFlag`, `WorldCouncilVote` models
- Vector-indexed lore store for semantic retrieval (Pinecone or pgvector) — needed at scale
- Groq structured output for contradiction detection
- Feed badge tagging stories as part of a Living World

---

## Phase 6 — AI Author Bots ⚪ DESIGNED

> *Structural filler for the cold-start problem. Transparently labeled, gracefully degraded as real content arrives.*

Named author personas (e.g., "Vesper Kaine") with generated profile pictures, bios, and genre specialisations. Agents publish chapters on a schedule using Groq. Each bot story is explicitly tagged **AI Author** on the story page and in the feed.

### Implementation plan
- Bot author record in the DB (flagged `isBot: true`)
- Generation pipeline: story outline → chapter-by-chapter generation with prior chapter context
- Scheduling: cron job or queue-based, configurable cadence per bot
- Feed demotion: as real content accumulates in a genre, bot stories are gradually pushed down (configurable weight decay)
- Admin controls: create/pause/retire bots, set genre, manage generation schedule

### Risk mitigation
- Always labeled. No reader should ever not know a story is AI-generated.
- Quality gate: bot chapters go through the same AI quality assessment and can be blocked if they score below threshold
- No comments seeding — bots do not post fake engagement

---

## Immediate Action Items (April 2026)

1. **Run `npx prisma db push`** against production DB to apply: `CommunityLink.signupCount`, `User.communityRef`, new `community_links` table
2. **Feed cookie seeding** — wire `community_genres` cookie into the feed API's cold-start boost logic
3. **Screenshot the platform** and drop into `public/screenshots/` for the /features showcase
4. **Identify 2–3 Discord communities** (LitRPG / Progression Fantasy focus) to target with first referral links
5. **Public domain import script** — import 2–3 Gutenberg works with AI glossary
6. **Founding creator outreach** — identify 5 candidates on RoyalRoad/Wattpad

---

*Roadmap reflects actual code state. Items marked ✅ are in production or will be on next deploy. Items marked ⚪ are designed but not yet coded.*

### 1.1 Twitch/YouTube Stream-Style UI Simulation
**Priority:** High  
**Description:** Add live preview simulation in the editor that mimics how content appears to readers in real-time.

**Requirements:**
- Split-screen editor with live preview panel
- Real-time rendering of glossary tooltips
- Chapter navigation simulation
- Reader view toggle (desktop/mobile/tablet)
- Dark/light mode preview
- Font size and reading preferences preview

**Technical Notes:**
- Use React split pane component
- Debounced live updates to prevent performance issues
- Preview should match actual reader experience exactly

---

### 1.2 Image Upload & Management System
**Priority:** High  
**Status:** Partially implemented, needs enhancement

**Requirements:**
- **Cover Image Management**
  - Move cover upload to first stage of book submission (before content upload)
  - Support drag-and-drop upload
  - Image cropping/resizing tool (1:1.5 ratio for covers)
  - Multiple image format support (JPEG, PNG, WebP)
  - CDN integration for optimized delivery
  
- **In-Content Images**
  - Rich text editor image insertion
  - Image caption support
  - Image galleries for comics/hybrid formats
  - Alt text for accessibility
  - Lazy loading optimization

**API Endpoints:**
- `POST /api/upload/cover` - Cover image upload
- `POST /api/upload/content-image` - In-content image upload
- `DELETE /api/upload/image/{id}` - Delete uploaded image
- `GET /api/works/{id}/images` - List all work images

---

### 1.3 Emoji System Integration
**Priority:** Medium  
**Description:** Add emoji picker and rendering throughout the platform

**Requirements:**
- Emoji picker component for editor
- Support in chapter content
- Support in comments and community features
- Unicode emoji + custom platform emojis
- Emoji autocomplete (`:smile:` → 😊)

**Technical Implementation:**
- Use emoji-picker-react or similar library
- Store as Unicode in database
- Sanitize emoji input to prevent XSS

---

## 💬 Phase 2: Comment & Community System

### 2.1 Comment System
**Priority:** High  
**Status:** Schema exists, needs UI implementation

**Requirements:**
- **Comment Features**
  - Chapter-level comments
  - Paragraph-level inline comments (highlight text to comment)
  - Reply threads (nested comments)
  - Like/upvote comments
  - Sort by: newest, oldest, most liked
  - Report/moderation system
  
- **Creator Controls**
  - Enable/disable comments per work
  - Pin comments
  - Delete/moderate comments
  - Block users from commenting

**Database Schema (verify/enhance):**
```prisma
model Comment {
  id            String   @id @default(cuid())
  workId        String
  sectionId     String?  // null = work-level comment
  userId        String
  content       String
  parentId      String?  // For reply threads
  
  // Inline comment positioning
  paragraphIndex Int?
  textStart     Int?
  textEnd       Int?
  
  isEdited      Boolean  @default(false)
  isPinned      Boolean  @default(false)
  isHidden      Boolean  @default(false)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("comments")
}

model CommentLike {
  id        String   @id @default(cuid())
  commentId String
  userId    String
  createdAt DateTime @default(now())
  
  @@unique([commentId, userId])
  @@map("comment_likes")
}
```

**API Endpoints:**
- `GET /api/works/{workId}/comments` - List comments
- `POST /api/works/{workId}/comments` - Create comment
- `PATCH /api/comments/{id}` - Edit comment
- `DELETE /api/comments/{id}` - Delete comment
- `POST /api/comments/{id}/like` - Like comment
- `POST /api/comments/{id}/report` - Report comment

---

### 2.2 Collaborative Story Features
**Priority:** Medium  
**Description:** Enable multiple authors to co-write stories

**Requirements:**
- **Joint Ownership System**
  - Invite co-authors by email/username
  - Role-based permissions (owner, editor, contributor)
  - Revenue sharing configuration (percentage splits)
  - Activity log for all collaborator actions
  
- **Collaborative Editor**
  - Real-time collaborative editing (WebSocket-based)
  - User presence indicators (who's editing what)
  - Conflict resolution for simultaneous edits
  - Comment/suggestion mode (like Google Docs)
  - Version history with author attribution
  - Chapter locking (prevent simultaneous edits)

**Database Schema:**
```prisma
model WorkCollaborator {
  id              String   @id @default(cuid())
  workId          String
  userId          String
  role            String   // 'owner', 'editor', 'contributor'
  permissions     String   // JSON: {canEdit, canPublish, canInvite, canDelete}
  revenueShare    Float    @default(0) // Percentage (0-100)
  invitedBy       String
  invitedAt       DateTime @default(now())
  acceptedAt      DateTime?
  status          String   @default("pending") // 'pending', 'active', 'removed'
  
  @@unique([workId, userId])
  @@map("work_collaborators")
}

model CollaborationActivity {
  id          String   @id @default(cuid())
  workId      String
  userId      String
  action      String   // 'edited_chapter', 'added_glossary', 'published', etc.
  details     String   // JSON with action details
  createdAt   DateTime @default(now())
  
  @@map("collaboration_activity")
}
```

---

## ⭐ Phase 3: Reader Engagement & Rating System

### 3.1 Enhanced Rating System
**Priority:** Medium  
**Description:** Multi-dimensional rating system for works

**Requirements:**
- Overall star rating (1-5)
- Dimension-specific ratings:
  - Writing Quality
  - Plot/Story
  - Character Development
  - World Building
  - Pacing
- Review text (optional)
- Helpful/not helpful voting on reviews
- Verified reader badge (must have read X chapters)

---

### 3.2 Reader Contribution Tools
**Priority:** Low  
**Description:** Enable readers to help improve stories

**Requirements:**
- **Typo Reporting**
  - Highlight text to report typo
  - Suggest correction
  - Creator can accept/reject suggestions
  - Auto-apply after X users report same typo
  
- **Wording Suggestions**
  - Suggest alternative phrasing
  - Community voting on suggestions
  - Creator review and approval system

**Database Schema:**
```prisma
model ContentSuggestion {
  id            String   @id @default(cuid())
  workId        String
  sectionId     String
  userId        String
  type          String   // 'typo', 'wording', 'grammar'
  
  // Text location
  paragraphIndex Int
  textStart     Int
  textEnd       Int
  originalText  String
  suggestedText String
  reason        String?
  
  // Review
  status        String   @default("pending") // 'pending', 'accepted', 'rejected'
  reviewedBy    String?
  reviewedAt    DateTime?
  
  // Community voting
  upvotes       Int      @default(0)
  downvotes     Int      @default(0)
  
  createdAt     DateTime @default(now())
  
  @@map("content_suggestions")
}
```

---

### 3.3 Character Profile Enhancements
**Priority:** Medium  
**Status:** Basic system exists, needs enhancement

**Requirements:**
- **Internal Profile (Creator View)**
  - All existing fields (backstory, motivations, arc, etc.)
  - Character relationships diagram
  - Timeline of appearances
  - Personal notes (private to creator)
  - Image gallery
  
- **Quick View (Reader Hover)**
  - Character portrait
  - Name + aliases
  - Quick glance summary (2-3 lines)
  - First appearance link
  - "View Full Profile" button
  
- **Customization Options**
  - Choose which fields are public vs private
  - Spoiler-free mode (hide info until chapter X)
  - Custom color schemes per character
  - Voice/personality traits tags

**Components to Create:**
- `CharacterQuickView.tsx` - Hover tooltip component
- `CharacterRelationshipGraph.tsx` - Visual relationship diagram
- `CharacterTimeline.tsx` - Appearance timeline

---

## 📱 Phase 4: Mobile Optimization

### 4.1 Responsive Design Audit
**Priority:** High  
**Description:** Ensure all features work seamlessly on mobile devices

**Requirements:**
- Mobile-first reader experience
- Touch-optimized editor (if editing on mobile)
- Responsive glossary tooltips (tap instead of hover)
- Mobile navigation menu
- Swipe gestures for chapter navigation
- Mobile-optimized image viewer
- Reduced motion options for animations

**Testing Checklist:**
- [ ] iPhone SE (375px width)
- [ ] iPhone 14 Pro (393px width)
- [ ] iPad (768px width)
- [ ] Android phones (various sizes)
- [ ] Landscape mode support

**Critical Mobile Features:**
- Bottom navigation for key actions
- Sticky chapter title on scroll
- Progress indicator
- Font size controls
- Reading mode (distraction-free)

---

## 🚀 Phase 5: Publishing System Completion

### 5.1 GROQ Integration for Quality Assessment
**Priority:** High  
**Status:** System designed, needs testing

**Requirements:**
- Automated quality scoring using GROQ API
- Grammar and style analysis
- Readability metrics
- Genre/tag suggestions
- Feedback generation for creators
- Batch processing for multiple chapters
- Cost optimization (token usage tracking)

**Implementation:**
- Test GROQ API with sample chapters
- Implement rate limiting
- Add quality score caching
- Create feedback UI for creators
- Add "Request Re-assessment" option

**API Endpoints:**
- `POST /api/quality-assessment/analyze` - Analyze chapter
- `GET /api/quality-assessment/{sectionId}` - Get assessment
- `POST /api/quality-assessment/batch` - Batch analyze work

---

### 5.2 Two-Step Publishing Workflow
**Priority:** High  
**Status:** Partially implemented

**Requirements:**
- **Step 1: Work Setup**
  - Cover image upload ⭐ NEW LOCATION
  - Title, description, genres
  - Maturity rating
  - Tags
  - Save as draft
  
- **Step 2: Content & Publish**
  - Upload chapters
  - Configure glossary
  - Add character profiles
  - Quality assessment review
  - Publish or schedule publish

**Enhancements Needed:**
- Move cover upload to Step 1
- Add publish scheduling
- Add pre-publish checklist
- Add "Preview as Reader" before publishing

---

## 📋 Implementation Priority Summary

### Can Handle Immediately (AI Assistant)
1. ✅ **Cover Management in Step 1** - Simple file upload reordering
2. ✅ **Character Quick View Component** - New React component with hover logic
3. ✅ **Emoji System** - Library integration + UI components
4. ✅ **Comment System UI** - Frontend components for existing schema
5. ✅ **Mobile Responsive Fixes** - CSS/Tailwind adjustments

### Requires GitHub Agent (Complex Features)
1. 🤖 **Real-time Collaborative Editor** - WebSocket infrastructure
2. 🤖 **GROQ Quality Assessment Integration** - API integration + testing
3. 🤖 **Joint Ownership System** - Complex permission logic
4. 🤖 **Reader Contribution Tools** - Multi-user suggestion workflow

### Recommend Manual Development
1. 👨‍💻 **Live Preview Editor UI** - Complex UI/UX design decisions
2. 👨‍💻 **Image CDN Integration** - Third-party service setup
3. 👨‍💻 **Mobile App (if needed)** - Separate React Native project

---

## 🎯 Suggested Execution Order

### Sprint 1: Foundation (Week 1-2)
- Move cover upload to Step 1
- Implement emoji system
- Create character quick view component
- Mobile responsive audit + fixes

### Sprint 2: Community (Week 3-4)
- Build comment system UI
- Implement comment moderation
- Add rating system
- Create reader contribution UI

### Sprint 3: Collaboration (Week 5-6)
- Joint ownership system
- Collaboration permissions
- Activity logging
- Revenue sharing config

### Sprint 4: Advanced Features (Week 7-8)
- GROQ integration testing
- Live preview editor
- Real-time collaboration (Phase 1)
- Image management system

### Sprint 5: Polish & Mobile (Week 9-10)
- Mobile optimization
- Performance testing
- User testing
- Bug fixes

---

## Next Steps

**Immediate Action Items:**
1. Review and approve this roadmap
2. Prioritize which features to tackle first
3. Decide which features need GitHub Copilot Agent vs manual development
4. Set up project tracking (GitHub Projects or similar)

**Questions to Answer:**
- Which features are MVP for public launch?
- What's the timeline for going live?
- Are there budget constraints for API usage (GROQ, CDN, etc.)?
- Do we need mobile apps or is responsive web sufficient?

---

*Last Updated: October 15, 2025*
