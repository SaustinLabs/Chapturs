# Creator Profile System - Design Document

**Version:** 0.1.0  
**Status:** Planning  
**Last Updated:** October 15, 2025

## Vision
A customizable creator profile system that allows authors to showcase their work portfolio, integrate social media presence, and express their creative identity through a modular block-based layout system. Think "YouTube channel meets customizable dashboard" but elegant and minimal.

## Terminology
- **Blocks**: Modular content elements that creators can add to their profiles (NOT "blocks")
- **Ghost Area**: The flexible grid space where blocks can be placed
- **Featured Space**: The prominent center area showcasing a creator's main work or content
- **Block Grid**: The underlying system for positioning and sizing blocks

## Core Concepts

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │          │  │                 │  │ Block Grid   │  │
│  │ Profile  │  │  Featured Work  │  │ (Ghost Area)  │  │
│  │  Photo   │  │   or Video      │  │               │  │
│  │          │  │    Block       │  │ ┌───┬───┬───┐ │  │
│  │  (~50%   │  │                 │  │ │ 1 │ 2 │ 3 │ │  │
│  │  width)  │  │   (Prominent)   │  │ ├───┼───┼───┤ │  │
│  └──────────┘  │                 │  │ │ 4 │ 5 │ 6 │ │  │
│  ┌──────────┐  │                 │  │ ├───┴───┼───┤ │  │
│  │   Bio    │  │                 │  │ │   7   │ 8 │ │  │
│  │   Text   │  └─────────────────┘  │ └───────┴───┘ │  │
│  │  Area    │                       │               │  │
│  └──────────┘                       └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Three Main Sections

#### 1. **Left Sidebar** (Fixed)
- **Profile Picture**: ~50% width of featured work area
- **Bio Section**: Markdown-enabled text area for self-description
- Always visible, not part of block system

#### 2. **Featured/Prominent Space** (Center)
- **Default**: Large featured work display (book cover + metadata)
- **Alternative**: Can be replaced with any block type (e.g., YouTube video)
- Most prominent visual element on the page

#### 3. **Block Grid** (Right - "Ghost Area")
- Flexible grid system for block placement
- Empty by default (hence "ghost area")
- Drag-and-drop customizable
- Blocks expand in ONE direction only (width OR height, not both)

## Block System

### Block Types

#### Content Blocks
1. **Featured Work Block**
   - Size: Large (can fill prominent space)
   - Content: Book cover, title, description, CTA button
   - Expandable: Yes (height only)

2. **Work Card Block**
   - Size: Book thumbnail standard (portrait)
   - Content: Cover, title, genre tags
   - Expandable: No (standard book size)
   - Use: Showcase other works in portfolio

3. **Text Box Block**
   - Size: 1x1 minimum
   - Content: Rich text editor (quotes, announcements, etc.)
   - Expandable: Yes (width OR height, enforced)
   - Style: Elegant typography, minimal design

#### Social Media Blocks
4. **Twitter Feed Block**
   - Size: 1x2 or 2x2 (configurable)
   - Content: Embedded tweets (latest 1-3 depending on size)
   - Expandable: Yes (height for more tweets)
   - Integration: Twitter API v2

5. **YouTube Video Block**
   - Size: 16:9 aspect ratio enforced
   - Content: Embedded video player + description below
   - Expandable: Yes (width, height scales proportionally)
   - Note: Handles vertical space with description text

6. **YouTube Channel Block**
   - Size: 2x1 minimum
   - Content: Channel banner, subscriber count, latest video thumbnails
   - Expandable: Yes (width for more videos)

7. **Discord Invite Block**
   - Size: 1x1
   - Content: Server icon, name, member count, invite button
   - Expandable: No
   - Integration: Discord block embed

8. **Twitch Channel Block**
   - Size: 2x1
   - Content: Live status, latest stream thumbnail, follower count
   - Expandable: Yes (width)
   - Integration: Twitch API

#### Community Blocks
9. **Favorite Author Block**
   - Size: 1x1
   - Content: Author avatar, name, follow button, work count
   - Expandable: No
   - Use: Cross-promote other creators

10. **Favorite Work Block**
    - Size: 1x1 (book size)
    - Content: Another creator's work (cross-promotion)
    - Expandable: No
    - Benefit: Builds community, discovery

11. **External Link Block**
    - Size: 1x1
    - Content: Custom image/icon + text + link
    - Expandable: Yes (width OR height)
    - Use: Link to Patreon, Ko-fi, personal website, etc.

### Block Rules & Constraints

#### Expansion Rules
- ✅ Blocks can expand in **ONE direction only** (width OR height)
- ❌ Cannot expand in both directions simultaneously
- ✅ Must respect grid boundaries (no partial overlaps)
- ✅ Visual indicators show available expansion space
- ✅ Collision detection prevents overlapping

#### Size Units
- **Base Unit**: Book thumbnail size (portrait orientation)
- **1x1**: Single book space
- **2x1**: Two books wide, one tall
- **1x2**: One book wide, two tall
- **2x2**: Four book spaces (maximum for most blocks)

#### Layout Constraints
- Minimum 1x1 size per block
- Maximum total blocks: 12 (prevents cluttered profiles)
- Ghost area starts empty, encouraging intentional curation
- Featured space can be empty (minimal profile option)

## Database Schema

### CreatorProfile Model
```prisma
model CreatorProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  username        String   @unique
  displayName     String?
  bio             String?  // Markdown text
  profileImage    String?
  coverImage      String?  // Optional banner image
  
  // Featured Content
  featuredWorkId  String?  // If using work as featured
  featuredType    String   @default("work") // "work" | "block"
  featuredBlockId String? // If using block as featured
  
  // Customization
  accentColor     String   @default("#3B82F6") // Blue
  fontStyle       String   @default("default") // "default" | "serif" | "modern"
  backgroundStyle String   @default("solid") // "solid" | "gradient" | "pattern"
  
  // Metadata
  profileViews    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  blocks         ProfileBlock[]
  
  @@map("creator_profiles")
}
```

### ProfileBlock Model
```prisma
model ProfileBlock {
  id          String   @id @default(cuid())
  profileId   String
  
  // Block Type & Content
  type        String   // "work-card" | "text-box" | "youtube-video" | etc.
  data        String   // JSON data specific to block type
  
  // Layout Position
  gridX       Int      // X position in grid
  gridY       Int      // Y position in grid
  width       Int      @default(1) // Grid units wide
  height      Int      @default(1) // Grid units tall
  
  // Order & Visibility
  order       Int      @default(0)
  isVisible   Boolean  @default(true)
  
  // Analytics
  clickCount  Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  profile     CreatorProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  @@map("profile_blocks")
}
```

### Block Data Examples

```typescript
// Work Card Block
{
  type: "work-card",
  data: {
    workId: "work_123",
    showDescription: false,
    customText: null
  }
}

// YouTube Video Block
{
  type: "youtube-video",
  data: {
    videoId: "dQw4w9WgXcQ",
    autoplay: false,
    showDescription: true
  }
}

// Text Box Block
{
  type: "text-box",
  data: {
    content: "# Welcome!\n\nThanks for visiting my profile...",
    backgroundColor: "#1F2937",
    textColor: "#F3F4F6"
  }
}

// Discord Invite Block
{
  type: "discord-invite",
  data: {
    inviteCode: "chapturs",
    serverId: "123456789",
    showMemberCount: true
  }
}
```

## Component Architecture

### Core Components

```
/src/components/profile/
├── ProfileLayout.tsx              # Main layout wrapper
├── ProfileSidebar.tsx             # Left sidebar (photo + bio)
├── FeaturedSpace.tsx              # Center prominent area
├── BlockGrid.tsx                 # Right ghost area grid
├── blocks/
│   ├── BaseBlock.tsx             # Wrapper with resize handles
│   ├── WorkCardBlock.tsx
│   ├── TextBoxBlock.tsx
│   ├── YouTubeVideoBlock.tsx
│   ├── YouTubeChannelBlock.tsx
│   ├── TwitterFeedBlock.tsx
│   ├── DiscordInviteBlock.tsx
│   ├── TwitchChannelBlock.tsx
│   ├── FavoriteAuthorBlock.tsx
│   ├── ExternalLinkBlock.tsx
│   └── index.ts                   # Block registry
├── editor/
│   ├── ProfileEditor.tsx          # Edit mode wrapper
│   ├── BlockPicker.tsx           # Block selection sidebar
│   ├── BlockConfigModal.tsx      # Configure block settings
│   ├── GridOverlay.tsx            # Visual grid for placement
│   └── PreviewToggle.tsx          # Switch edit/preview modes
└── templates/
    ├── TemplateSelector.tsx       # Choose starter template
    └── templates.ts               # Template definitions
```

## User Experience Flow

### Profile Creation (First Time)
1. Navigate to `/creator/profile/edit`
2. Show template selector modal
   - "Writer Portfolio" template
   - "Multi-Platform Creator" template
   - "Minimal Profile" template
   - "Start from Blank"
3. Fill in basic info (bio, profile picture)
4. Select featured work (optional)
5. Add blocks from picker sidebar
6. Arrange and customize blocks
7. Preview → Publish

### Editing Existing Profile
1. Navigate to `/creator/profile/edit`
2. See current layout with edit controls
3. Drag to rearrange blocks
4. Click block to configure/edit
5. Use resize handles to expand (one direction)
6. Add new blocks from sidebar
7. Save changes (auto-save drafts)

### Viewing Public Profile
1. Navigate to `/profile/[username]`
2. See polished, published layout
3. All blocks are interactive (click videos, open links, etc.)
4. "Follow" button if not already following
5. Share profile via social media buttons

## Customization Options

### Profile-Level Settings
- **Accent Color**: Choose from curated palette (blues, purples, greens, warm tones)
- **Font Style**: 
  - Default (Inter/System)
  - Serif (Georgia/Crimson)
  - Modern (Montserrat/Poppins)
- **Background Style**:
  - Solid color (dark gray default)
  - Subtle gradient
  - Minimal pattern (dots, lines)

### Block-Level Settings
Each block type has specific configurations:
- **Text Box**: Font size, alignment, background color
- **Work Card**: Show/hide description, custom CTA text
- **YouTube**: Autoplay, show related videos
- **Twitter**: Number of tweets to show
- etc.

## Templates

### 1. Writer Portfolio Template
```
Profile Photo + Bio (left)
Featured Work (center)
Ghost Area (right):
  - 3x Work Cards (other books)
  - 1x Text Box (upcoming projects)
  - 1x External Link (Patreon)
```

### 2. Multi-Platform Creator Template
```
Profile Photo + Bio (left)
YouTube Video (center - as featured)
Ghost Area (right):
  - 1x Twitter Feed
  - 1x Discord Invite
  - 1x Twitch Channel
  - 2x Work Cards
```

### 3. Minimal Profile Template
```
Profile Photo + Bio (left)
Featured Work (center)
Ghost Area (right):
  - Empty (clean, focused)
```

### 4. Community-Focused Template
```
Profile Photo + Bio (left)
Featured Work (center)
Ghost Area (right):
  - 2x Favorite Author Blocks
  - 2x Favorite Work Blocks
  - 1x Discord Invite
  - 1x Text Box (community message)
```

## API Endpoints

### Profile Management
```
GET    /api/profile/[username]              # Get public profile
GET    /api/creator/profile                 # Get own profile for editing
PATCH  /api/creator/profile                 # Update basic info
POST   /api/creator/profile/blocks         # Add new block
PATCH  /api/creator/profile/blocks/[id]    # Update block config
DELETE /api/creator/profile/blocks/[id]    # Remove block
PATCH  /api/creator/profile/layout          # Save block positions
POST   /api/creator/profile/template        # Apply template
```

### Social Integrations
```
GET    /api/integrations/youtube/video/[id]     # Get video metadata
GET    /api/integrations/youtube/channel/[id]   # Get channel info
GET    /api/integrations/twitter/user/[handle]  # Get tweets
GET    /api/integrations/discord/server/[id]    # Get server info
GET    /api/integrations/twitch/channel/[name]  # Get channel status
```

### Analytics
```
GET    /api/creator/profile/analytics         # Get profile stats
POST   /api/profile/[username]/view           # Track profile view
POST   /api/profile/block/[id]/click         # Track block click
```

## Mobile Responsive Design

### Mobile Layout (< 768px)
```
┌─────────────────┐
│  Profile Photo  │
│      Bio        │
├─────────────────┤
│ Featured Work   │
├─────────────────┤
│   Block 1      │
├─────────────────┤
│   Block 2      │
├─────────────────┤
│   Block 3      │
└─────────────────┘
```

- Single column layout
- Profile info at top
- Featured work below
- Blocks stack vertically in order
- Reduced block sizes for mobile viewing

## Implementation Phases

### Phase 1: Core Structure ✨ (Week 1)
- Database schema & migrations
- Profile layout component
- Basic profile view page
- Edit mode structure

### Phase 2: Essential Blocks (Week 2)
- Work Card Block
- Text Box Block
- Featured Work display
- Block picker UI

### Phase 3: Social Integration (Week 3)
- YouTube blocks
- Twitter block
- Discord block
- External Link block

### Phase 4: Customization (Week 4)
- Color/font customization
- Block expansion controls
- Drag-and-drop positioning
- Save/publish workflow

### Phase 5: Polish & Launch (Week 5)
- Templates system
- Analytics tracking
- Mobile responsive
- Performance optimization
- Beta testing & refinements

## Success Metrics

- **Adoption**: % of creators who set up custom profiles
- **Engagement**: Block click-through rates
- **Discovery**: Profile visits from block links
- **Retention**: Creators who update profiles monthly
- **Social**: External traffic from social blocks

## Future Enhancements

- **Block Marketplace**: Let creators share custom block templates
- **Advanced Analytics**: Heat maps showing where users click
- **A/B Testing**: Test different layouts for optimal engagement
- **Animated Blocks**: Subtle animations for featured content
- **Profile Themes**: Pre-made color/style bundles
- **Collaboration Blocks**: Joint works, co-author spotlights
- **NFT/Web3 Blocks**: Showcase digital collectibles (if relevant)

---

This system balances creative freedom with elegant constraints, encouraging creators to build distinctive yet cohesive profiles that showcase their work and personality.
