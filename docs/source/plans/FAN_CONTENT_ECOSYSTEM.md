# Fan Content Ecosystem: Audiobooks & Translations

## 📋 Overview

This document specifies the unified fan content system for Chapturs, enabling fans to submit audiobooks and translations, with a quality voting system and creator monetization options.

**Core Features:**
- **Tier 1 (Official):** House-generated translations (LLM) and audiobooks (AI narrator)
- **Tier 2 (Community):** Crowdsourced edits on Tier 1 translations (Wikipedia-style) — translations only
- **Tier 3 (Professional):** Fan-submitted complete translations & audiobooks with revenue sharing
- **Quality Voting:** 3-dimensional rating system (Readability, Comprehension, Polish)
- **Unified UI:** Sticky top bar on chapter page with language selector, audiobook toggle, and quality badges
- **Sticky Scrubber:** When audiobook mode is active, a persistent playback control bar remains visible while scrolling

---

## 🎯 Content Tiers

### **Tier 1: Official House Version**
- **Translations:** LLM-generated with tone restoration (English → any language)
- **Audiobooks:** AI narrator (high-quality TTS or AI voice model)
- **Single version per language per chapter**
- **No submission process** — created by Chapturs system
- **Always available as fallback** if user doesn't select alternative

### **Tier 2: Community-Enhanced (Translations Only)**
- **Structure:** Tier 1 LLM translation + crowdsourced edits (Wikipedia-style suggestion/approval model)
- **No equivalent for audiobooks** — AI audiobooks are as good as Tier 3 humans, so all fan audiobooks are Tier 3
- **Multiple versions allowed** — different user groups can maintain different edit sets
- **Becomes default when:** Any Tier 2 edits exist for a chapter AND that version is highly rated
- **No creator approval needed** — community-driven quality control
- **Edit tracking:** Track edit count and apply edits algorithmically to Tier 1 base

### **Tier 3: Professional Fan Content**
- **Translations:** Fully rewritten by fan translator (complete chapter replacement, not edits)
- **Audiobooks:** Fan-recorded full narration (complete chapter audio replacement)
- **Submission process:** Any user can submit; appears in menu immediately
- **Quality control via voting:** Bad submissions sink in ratings, good ones rise
- **Monetization:** Revenue split with creator (configurable per-creator, negotiable per-contributor)
- **Creator choice:** Can toggle Tier 3 submissions on/off per content type in settings
- **Custom deals:** If creator requires approval, contributor can negotiate custom revenue % (pending deal system)

---

## 🗳️ Quality Voting System

### **Why Separate from Story Likes**
Stories can be amazing but have terrible translations/narrations. Story "Like" = love the narrative. Translation/Audiobook "Quality Rating" = rate the adaptation/performance quality.

### **Three-Dimensional Rating**

Each piece of fan content (translation or audiobook) is rated on:

| Dimension | Description | Translation Focus | Audiobook Focus |
|-----------|-------------|-------------------|-----------------|
| **Readability** | Is it easy to follow? (grammar, pacing, flow) | Sentence structure, grammar, natural flow | Narration clarity, pacing, pronunciation |
| **Comprehension** | Are ideas clear? (meaning preserved, tone) | Does it convey original intent & tone? | Is the story understandable? Character voices distinct? |
| **Polish** | Professional quality? (consistency, style, detail) | Typos, consistency of terminology, prose quality | Audio quality, consistency, production value |

### **Voting UI Flow**
1. User clicks quality badge (⭐ 4.2) on translation/audiobook variant
2. Modal appears with 3 separate 5-star selectors (Readability, Comprehension, Polish)
3. Overall score auto-calculates as average of the three
4. Submit or cancel
5. Page reflects new average immediately (or with light refresh)

### **Data Storage**
- Store individual votes: `readabilityRating`, `comprehensionRating`, `polishRating` (each 1-5)
- Compute displayed `qualityOverall` as average of three dimensions
- Show badge as **"Quality: 4.2/5"** on each variant in the menu

---

## 🎨 Chapter Page Top Bar UI

### **Compact Main Bar (Always Visible)**
```
[← Ch N-1 | Ch N →] | 🌐 [English ▼] | 🎧 [Audio: Off] | 💬 Subscribe | 🔖 Bookmark | ❤️ Like | [⋮ More]
```

**Elements:**
- `[← Ch | Ch →]` - Chapter navigation
- `🌐 [Language ▼]` - Language selector with dropdown menu
- `🎧 [Audio: Off/On]` - Toggle audiobook mode; shows current state
- `💬 Subscribe` - Subscribe to creator
- `🔖 Bookmark` - Add work to bookmarks
- `❤️ Like` - Like the story (independent from quality votes)
- `[⋮ More]` - Dropdown for: submit translation, submit audiobook, report issue, settings

**Quality Rating Location:**
- Quality ratings **do NOT appear on the main chapter bar**
- Quality ratings are **only visible in the language selector and audiobook selector menus**, displayed next to each variant
- This prevents a 2-star fan translation from appearing prominently and damaging the perception of an amazing story

### **Sticky Scrubber Bar (Audio Mode Only)**
When `🎧 Audio: On`, this bar appears below the main bar and **persists on scroll**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🎙️ Narrator: [Current Reader Name] | ⏪ [10s] | ⏯️ | ⏩ [10s] | 🔊 Vol  │
│ ◀━━━━━━━━━●━━━━━━━━━━━━━━━ 7:24 / 45:32                                 │
│ [Minimize ✕]                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

**Controls:**
- `🎙️ Narrator: [Name]` - Clickable to open narrator selection menu
- `⏪ [10s]` - Rewind 10 seconds
- `⏯️` - Play/Pause
- `⏩ [10s]` - Skip 10 seconds
- `🔊 Vol` - Volume control (slider or increment buttons)
- Scrubber bar with drag handle to seek
- Time display `7:24 / 45:32` (current / total)
- `[Minimize ✕]` - Hide scrubber bar (can re-show via `🎧 Audio: On` button)

### **Keyboard Shortcuts (When Audio Mode Active)**
```
Space       → Play/Pause
← Arrow     → Rewind 10s
→ Arrow     → Skip 10s
N           → Next chapter (auto-advances narrator if current hasn't recorded)
P           → Previous chapter
M           → Toggle minimize scrubber bar
```

---

## 📂 Language Selector Menu

**Triggers when:** User clicks `🌐 [Language ▼]`

**Menu structure:**
```
Translation Quality Menu:
═══════════════════════════════════════════
Tier 1 (Official LLM)
  ├─ "LLM-Translated" ⭐ 3.8/5 (245 votes)
  │   (100% auto-generated, fallback if no others)

Tier 2 (Community Enhanced)
  ├─ "With Fan Edits v1" ⭐ 4.5/5 (892 votes) ← DEFAULT if exists
  ├─ "With Fan Edits v2" ⭐ 4.2/5 (156 votes)

Tier 3 (Professional)
  ├─ "Maria's Translation" ⭐ 4.8/5 (450 votes)
  ├─ "Alt Translation by X" ⭐ 3.2/5 (89 votes)
  ├─ "Formal Style Translation" ⭐ 4.6/5 (201 votes)

═══════════════════════════════════════════
[+ Submit Translation] [+ Report Issue]
```

**Quality Rating Display in Menu:**
- Each variant shows its **Readability/Comprehension/Polish average** as a single **⭐ X.X/5** badge
- Vote count included for transparency: "(450 votes)"
- **Low-rated variants are still shown** but will naturally sink to bottom as users vote
- Currently selected translation is **highlighted/indicated** (checkmark, bold, or visual indicator)
- Highest-rated option is suggested (Tier 2 if high-quality, else top Tier 3, else Tier 1)

**Key Design Intent:**
- Story's main chapter view stays clean (no quality badges visible on main bar)
- Users who want to switch languages/versions can see quality comparisons within the menu
- Bad translations don't damage perception of the story; they're discovered within the context of "here are alternative versions"

---

## 🎧 Audiobook Selector Menu

**Triggers when:** User clicks `🎧 [Audio: On]` (if currently "Off" or to open menu)

**Menu structure:**
```
Audiobook Selection:
═══════════════════════════════════════════
Tier 1 (Official House)
  ├─ "Official AI Narrator" ⭐ 4.3/5 (1,200 votes) ← Playing if no Tier 3 selected

Tier 3 (Professional Narrators)
  ├─ "Alex's Recording" ⭐ 4.7/5 (380 votes)
  ├─ "Jordan's Take" ⭐ 4.6/5 (245 votes)
  ├─ "Casey's Version" ⭐ 3.9/5 (124 votes)

═══════════════════════════════════════════
[+ Submit Audiobook] [+ Report Issue]
```

**Quality Rating Display in Menu:**
- Each narrator shows their **Readability/Comprehension/Polish average** as **⭐ X.X/5** badge
- Vote count included: "(380 votes)"
- Currently playing audiobook is **highlighted** with a play icon or indicator
- Highest-rated narrator is suggested

**Behavior:**
- First time toggling audio mode → loads Tier 1 (official) by default
- User selects narrator → scrubber bar switches to that narrator's recording
- When current chapter finishes:
  - If same narrator has next chapter → auto-play with that narrator
  - Else → auto-play highest-rated narrator for next chapter
  - Show toast: `⏭️ Switching to [Name]'s recording for Chapter 3`
- Menu stays open for browsing; can swap narrators mid-chapter

---

## 💾 Prisma Database Schema

### **FanTranslation (Tier 2 & 3)**

```prisma
model FanTranslation {
  id String @id @default(cuid())
  
  workId String
  work Work @relation("FanTranslations", fields: [workId], references: [id], onDelete: Cascade)
  
  chapterId String
  chapter Section @relation("FanTranslations", fields: [chapterId], references: [id], onDelete: Cascade)
  
  languageCode String // "es", "ja", "fr", "zh-CN", etc.
  tier "TIER_2_COMMUNITY" | "TIER_3_PROFESSIONAL"
  
  // Tier 2 specific (community edits)
  isDefaultForLanguage Boolean @default(false)
  editCount Int @default(0) // Number of crowdsourced edits applied
  
  // Tier 3 specific
  translatorId String?
  translator User? @relation("FanTranslationTranslators", fields: [translatorId], references: [id], onDelete: SetNull)
  
  translatedTitle String
  translatedContent JSON // Chapt format in target language
  translationNotes String? // Translator's notes on style/challenges
  
  // Quality rating
  readabilityAvg Float @default(0)
  comprehensionAvg Float @default(0)
  polishAvg Float @default(0)
  qualityOverall Float @default(0) // Computed: average of above three
  ratingCount Int @default(0)
  
  status "active" | "flagged" | "removed"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  votes FanContentVote[] @relation("FanTranslationVotes")
  
  @@unique([chapterId, languageCode, tier])
  @@index([workId, languageCode, tier])
  @@index([qualityOverall, status])
}
```

### **FanAudiobook (Tier 1 & 3 Only)**

```prisma
model FanAudiobook {
  id String @id @default(cuid())
  
  workId String
  work Work @relation("FanAudiobooks", fields: [workId], references: [id], onDelete: Cascade)
  
  chapterId String
  chapter Section @relation("FanAudiobooks", fields: [chapterId], references: [id], onDelete: Cascade)
  
  tier "TIER_1_OFFICIAL" | "TIER_3_PROFESSIONAL"
  
  // Tier 1 official house version
  isOfficialHouseVersion Boolean @default(false)
  
  // Tier 3 specific
  narratorId String?
  narrator User? @relation("FanAudiobookNarrators", fields: [narratorId], references: [id], onDelete: SetNull)
  
  audioUrl String // R2/S3 URL to MP3/WAV
  durationSeconds Int
  narratorNotes String? // Notes on accent, recording environment, character interpretations
  
  // Quality rating
  readabilityAvg Float @default(0)
  comprehensionAvg Float @default(0)
  polishAvg Float @default(0)
  qualityOverall Float @default(0)
  ratingCount Int @default(0)
  
  status "active" | "flagged" | "removed"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  votes FanContentVote[] @relation("FanAudiobookVotes")
  
  @@unique([chapterId, tier])
  @@index([workId, tier])
  @@index([qualityOverall, status])
}
```

### **FanContentVote (Unified Rating)**

```prisma
model FanContentVote {
  id String @id @default(cuid())
  
  userId String
  user User @relation("FanContentVotes", fields: [userId], references: [id], onDelete: Cascade)
  
  fanTranslationId String?
  fanTranslation FanTranslation? @relation("FanTranslationVotes", fields: [fanTranslationId], references: [id], onDelete: Cascade)
  
  fanAudiobookId String?
  fanAudiobook FanAudiobook? @relation("FanAudiobookVotes", fields: [fanAudiobookId], references: [id], onDelete: Cascade)
  
  // 1-5 star ratings
  readabilityRating Int // 1-5
  comprehensionRating Int // 1-5
  polishRating Int // 1-5
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, fanTranslationId])
  @@unique([userId, fanAudiobookId])
  @@index([fanTranslationId, createdAt])
  @@index([fanAudiobookId, createdAt])
}
```

### **CreatorFanContentSettings**

```prisma
model CreatorFanContentSettings {
  id String @id @default(cuid())
  
  creatorId String @unique
  creator Author @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  // Tier 3 toggles
  allowTier3Translations Boolean @default(true)
  allowTier3Audiobooks Boolean @default(true)
  
  // Default revenue share percentages
  defaultTranslationRevenueShare Float @default(0.30) // 30% to translator
  defaultAudiobookRevenueShare Float @default(0.40) // 40% to narrator
  
  // If true, contributors must negotiate custom deals; if false, auto-approve with defaults
  requireCustomDealApproval Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### **Tier3Deal (Custom Revenue Negotiation)**

```prisma
model Tier3Deal {
  id String @id @default(cuid())
  
  workId String
  work Work @relation("Tier3Deals", fields: [workId], references: [id], onDelete: Cascade)
  
  creatorId String
  creator Author @relation("CreatorTier3Deals", fields: [creatorId], references: [id], onDelete: Cascade)
  
  contributorId String // Fan translator or narrator
  contributor User @relation("ContributorTier3Deals", fields: [contributorId], references: [id], onDelete: Cascade)
  
  contentType "TRANSLATION" | "AUDIOBOOK"
  languageCode String? // "es", "ja", null if audiobook (applies to all languages)
  
  // Deal terms
  revenueSharePercent Float // e.g., 0.35 = 35% to contributor
  exclusivityDuration Int? // null = non-exclusive, OR days (30, 60, 90, etc.)
  externalLinkAllow Boolean @default(true) // Can contributor link their work elsewhere?
  
  status "pending_creator" | "pending_contributor" | "active" | "expired" | "rejected"
  rejectionReason String?
  
  createdAt DateTime @default(now())
  acceptedAt DateTime?
  expiresAt DateTime?
  
  @@index([creatorId, status])
  @@index([contributorId, status])
}
```

### **Updates to Existing Models**

```prisma
// Update Work model
model Work {
  // ... existing fields ...
  
  // Track default translation per language
  defaultTranslationByLanguage JSON @default("{}") // {"es": "tier1-id", "ja": "tier2-id"}
  
  // Track default audiobook (Tier 1 official)
  officialAudiobookId String?
  
  // Relations
  fanTranslations FanTranslation[] @relation("FanTranslations")
  fanAudiobooks FanAudiobook[] @relation("FanAudiobooks")
  tier3Deals Tier3Deal[] @relation("Tier3Deals")
  creatorFanSettings CreatorFanContentSettings?
}

// Update Section model
model Section {
  // ... existing fields ...
  
  // Default translation per language (for fast lookup)
  defaultTranslationIdByLanguage JSON @default("{}") // {"es": "tier2-id", "ja": "tier1-id"}
  
  // Default audiobook (Tier 1 or highest-rated Tier 3)
  defaultAudiobookId String?
  
  // Relations
  fanTranslations FanTranslation[] @relation("FanTranslations")
  fanAudiobooks FanAudiobook[] @relation("FanAudiobooks")
}

// Update User model
model User {
  // ... existing fields ...
  
  // Fan content contributions
  translationsSubmitted FanTranslation[] @relation("FanTranslationTranslators")
  audiobooksSubmitted FanAudiobook[] @relation("FanAudiobookNarrators")
  fanContentVotes FanContentVote[] @relation("FanContentVotes")
  tier3DealProposals Tier3Deal[] @relation("ContributorTier3Deals")
}

// Update Author model
model Author {
  // ... existing fields ...
  
  fanContentSettings CreatorFanContentSettings?
  tier3Deals Tier3Deal[] @relation("CreatorTier3Deals")
}
```

---

## 🔌 API Endpoints

### **Get Translations for Chapter**
```
GET /api/works/[workId]/chapters/[chapterId]/translations
Query params: ?languageCode=es

Response: {
  languageCode: "es",
  currentDefault: "tier2-id-123",
  translations: [
    {
      id: "tier1-official",
      tier: "TIER_1_OFFICIAL",
      title: "Título LLM",
      qualityOverall: 3.8,
      ratingCount: 245,
      editCount: 0,
      isDefault: false
    },
    {
      id: "tier2-id-123",
      tier: "TIER_2_COMMUNITY",
      title: "Con Ediciones Comunitarias",
      qualityOverall: 4.5,
      ratingCount: 892,
      editCount: 12,
      isDefault: true
    },
    {
      id: "tier3-user-1",
      tier: "TIER_3_PROFESSIONAL",
      title: "Traducción de Maria",
      translatorName: "Maria Rodriguez",
      qualityOverall: 4.8,
      ratingCount: 450,
      isDefault: false
    }
  ]
}
```

### **Get Audiobooks for Chapter**
```
GET /api/works/[workId]/chapters/[chapterId]/audiobooks

Response: {
  currentDefault: "tier1-official",
  audiobooks: [
    {
      id: "tier1-official",
      tier: "TIER_1_OFFICIAL",
      narratorName: "Official AI Voice",
      durationSeconds: 2754,
      qualityOverall: 4.3,
      ratingCount: 1200,
      isDefault: true,
      isPlaying: true
    },
    {
      id: "tier3-narrator-1",
      tier: "TIER_3_PROFESSIONAL",
      narratorName: "Alex Chen",
      durationSeconds: 2891,
      qualityOverall: 4.7,
      ratingCount: 380,
      isDefault: false
    }
  ]
}
```

### **Get Translation Content**
```
GET /api/works/[workId]/chapters/[chapterId]/translations/[translationId]/content

Response: {
  id: "tier2-id-123",
  tier: "TIER_2_COMMUNITY",
  title: "Con Ediciones Comunitarias",
  content: { ...Chapt JSON format in Spanish... },
  qualityOverall: 4.5,
  ratingCount: 892,
  userVote: { readability: 5, comprehension: 4, polish: 5 } // null if user hasn't voted
}
```

### **Get Audiobook URL (Streaming)**
```
GET /api/works/[workId]/chapters/[chapterId]/audiobooks/[audiobookId]/stream

Response: {
  url: "https://r2.example.com/audiobooks/...",
  durationSeconds: 2754,
  narratorName: "Alex Chen",
  contentType: "audio/mpeg"
}
```

### **Submit Translation (Tier 3)**
```
POST /api/translations/submit

Body: {
  workId: "work-123",
  chapterId: "section-456",
  languageCode: "es",
  translatedTitle: "Mi Traducción",
  translatedContent: { ...Chapt JSON... },
  translationNotes: "Maintained formal register throughout"
}

Response: {
  success: true,
  translation: {
    id: "tier3-new-123",
    tier: "TIER_3_PROFESSIONAL",
    status: "active",
    message: "Translation submitted! It will appear in the menu immediately."
  }
}
```

### **Submit Audiobook (Tier 3)**
```
POST /api/audiobooks/submit

Body: {
  workId: "work-123",
  chapterId: "section-456",
  audioFile: <binary audio file>,
  durationSeconds: 2891,
  narratorNotes: "Recorded in quiet home studio, emphasized character voices"
}

Response: {
  success: true,
  audiobook: {
    id: "tier3-audio-123",
    tier: "TIER_3_PROFESSIONAL",
    status: "active",
    audioUrl: "https://r2.example.com/audiobooks/...",
    message: "Audiobook uploaded! It will appear in the menu immediately."
  }
}
```

### **Vote on Translation/Audiobook**
```
POST /api/fan-content/vote

Body: {
  fanTranslationId?: "tier2-id-123",  // OR
  fanAudiobookId?: "tier3-audio-456", // one of these two
  readabilityRating: 5,
  comprehensionRating: 4,
  polishRating: 5
}

Response: {
  success: true,
  vote: {
    id: "vote-123",
    readabilityRating: 5,
    comprehensionRating: 4,
    polishRating: 5,
    qualityOverall: 4.67
  },
  updatedQuality: {
    qualityOverall: 4.5,
    ratingCount: 893
  }
}
```

### **Propose Custom Tier 3 Deal**
```
POST /api/tier3-deals/propose

Body: {
  workId: "work-123",
  contributorId: "user-translator-456",
  contentType: "TRANSLATION",
  languageCode: "es",
  proposedRevenueSharePercent: 0.40,
  exclusivityDuration: 90,
  externalLinkAllow: true
}

Response: {
  success: true,
  deal: {
    id: "deal-123",
    status: "pending_contributor",
    message: "Deal proposal sent to translator. They have 30 days to respond."
  }
}
```

### **Creator: Approve/Reject Tier 3 Deal**
```
PATCH /api/tier3-deals/[dealId]

Body: {
  action: "approve" | "reject",
  rejectionReason?: "Exclusivity too long"
}

Response: {
  success: true,
  deal: {
    id: "deal-123",
    status: "active" | "rejected",
    acceptedAt: "2025-10-21T15:30:00Z"
  }
}
```

### **Creator Settings**
```
PATCH /api/creator/fan-content-settings

Body: {
  allowTier3Translations: true,
  allowTier3Audiobooks: true,
  defaultTranslationRevenueShare: 0.35,
  defaultAudiobookRevenueShare: 0.45,
  requireCustomDealApproval: false
}

Response: {
  success: true,
  settings: { ...updated settings... }
}
```

---

## 🧮 Calculation & Business Logic

### **Quality Score Aggregation**
When a new vote is submitted for a translation/audiobook:
```
newReadabilityAvg = (currentReadabilityTotal + newRating) / (ratingCount + 1)
newComprehensionAvg = (currentComprehensionTotal + newRating) / (ratingCount + 1)
newPolishAvg = (currentPolishTotal + newRating) / (ratingCount + 1)

qualityOverall = (newReadabilityAvg + newComprehensionAvg + newPolishAvg) / 3

// Round to 1 decimal place for display
```

### **Default Translation Selection per Language**
When fetching translations for a chapter:
1. Check if any Tier 2 exists with `qualityOverall >= 4.0` and `ratingCount >= 10`
2. If yes, use highest-rated Tier 2 as default
3. If no, use Tier 1 (official LLM)
4. Store selected ID in `Section.defaultTranslationIdByLanguage[languageCode]` for fast cache

### **Default Audiobook Selection**
1. If creator hasn't set up Tier 1 official audiobook yet, check for highest-rated Tier 3
2. If Tier 1 exists, use Tier 1 as default
3. Store in `Section.defaultAudiobookId` for fast cache

### **Auto-Advance Narrator Logic**
When user finishes current chapter and clicks "Next":
```
nextChapter = getNextChapter()
currentNarratorId = currentAudiobook.narratorId

IF currentNarratorId has recording for nextChapter:
  playNextChapter(currentNarratorId)
ELSE:
  topNarrator = getHighestRatedAudiobook(nextChapter)
  playNextChapter(topNarrator.narratorId)
  showToast("Switching to [Name]'s recording")
```

### **Revenue Tracking**
- Each view/listen of a Tier 3 translation or audiobook increments that contributor's revenue counter
- Monthly aggregate: `(views × adRevenuePerView) × revenueSharePercent`
- Distributed to creator's wallet (after Chapturs 30% platform fee, or similar model)

---

## 🎯 Implementation Priority

### **Phase 1: Core Data & Display**
1. Add Prisma models (FanTranslation, FanAudiobook, FanContentVote, CreatorFanContentSettings, Tier3Deal)
2. Run migration: `npx prisma db push`
3. Seed initial Tier 1 translations and audiobooks (placeholder LLM/AI versions)
4. Create API endpoints:
   - `GET /api/works/[workId]/chapters/[chapterId]/translations`
   - `GET /api/works/[workId]/chapters/[chapterId]/audiobooks`
   - `GET /api/works/[workId]/chapters/[chapterId]/translations/[translationId]/content`

### **Phase 2: UI - Top Bar & Selectors**
1. Update chapter page layout to include new top bar
2. Build language selector dropdown (shows all translations, allows switching)
3. Build audiobook toggle (shows all audiobooks, allows switching)
4. Build quality badge (clickable to vote)
5. Add sticky scrubber bar (appears when audiobook mode is on)

### **Phase 3: Voting System**
1. Create vote modal component (3 separate 5-star pickers)
2. Implement `POST /api/fan-content/vote` endpoint
3. Add vote submission to quality badge click
4. Update quality averages in real-time after vote

### **Phase 4: Audiobook Player**
1. Build sticky scrubber bar with play controls
2. Implement audio playback with HTML5 `<audio>` tag or `react-audio-player`
3. Add scrubber seek, volume, keyboard shortcuts (Space, arrows, N, P, M)
4. Implement auto-advance narrator logic

### **Phase 5: Submission Flow**
1. Create submission forms (translation & audiobook)
2. Implement file uploads (audio to R2 via `/api/upload`)
3. Create `POST /api/translations/submit` and `POST /api/audiobooks/submit` endpoints
4. Add submission buttons to "More" menu and main top bar

### **Phase 6: Creator Settings & Tier 3 Deals**
1. Add creator fan content settings page in creator dashboard
2. Implement monetization toggles and revenue share defaults
3. Build deal proposal flow and approval dashboard
4. Implement `PATCH /api/tier3-deals/[dealId]` endpoint

---

## 📱 Responsive Design Notes

- **Desktop:** Full top bar visible, scrubber bar spans width with clear drag handle
- **Tablet:** Language/audiobook toggles become compact buttons, narrator dropdown opens as modal
- **Mobile:** Scrubber bar shrinks, volume becomes pop-up slider, text truncates with ellipsis

---

## 🔒 Permissions & Access Control

- **Submit Tier 3 Translation/Audiobook:** Authenticated user only
- **Vote on Fan Content:** Authenticated user only
- **Creator Settings:** Author account only (verify via `session.user.id === work.author.userId`)
- **Approve Tier 3 Deal:** Creator account only
- **View Translation/Audiobook:** Public (any reader)

---

## 📊 Database Indexes & Performance

- Index on `FanTranslation` by `(workId, languageCode, tier, qualityOverall DESC)` for fast default selection
- Index on `FanAudiobook` by `(workId, tier, qualityOverall DESC)`
- Index on `FanContentVote` by `(fanTranslationId, createdAt)` and `(fanAudiobookId, createdAt)` for efficient aggregation
- Cache `defaultTranslationIdByLanguage` and `defaultAudiobookId` in `Section` to avoid recalculation

---

## ✅ Acceptance Criteria

### **Feature Complete When:**
1. ✅ All Prisma models and migrations applied
2. ✅ All API endpoints implemented and tested
3. ✅ Language selector menu shows all translations by tier with quality ratings
4. ✅ Audiobook selector menu shows all audiobooks by tier with quality ratings
5. ✅ Quality voting system stores and displays 3-dimensional ratings
6. ✅ **Quality ratings appear ONLY in selection menus, NOT on main chapter bar** (protecting story perception)
7. ✅ Sticky scrubber bar persists when scrolling during audiobook playback
8. ✅ Auto-advance narrator logic works when moving to next chapter
9. ✅ Keyboard shortcuts (Space, arrows, N, P, M) functional in audiobook mode
10. ✅ Submission forms allow Tier 3 contributions
11. ✅ Creator settings page shows monetization toggles and Tier 3 deal approvals
12. ✅ Revenue tracking records contributor views/listens

---

## 🚀 Notes for Development

- All fan content (translations, audiobooks) should appear in menus immediately upon submission (no moderation delay for Tier 3, unlike Tier 1 which is auto-generated)
- Quality voting should be anonymous to contributor (voters don't see each other)
- Consider implementing "Report Inappropriate Content" links in both menus for moderation
- Scrubber bar styling should match existing Chapturs design language (dark/light mode compatible)
- Use Cloudflare R2 for audiobook storage (see existing R2 configuration in `src/lib/r2.ts`)
- Consider adding "Remember my narrator preference" to user settings (store preferred narrator per work)
