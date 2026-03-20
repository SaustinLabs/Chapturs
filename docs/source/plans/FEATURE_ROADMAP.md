# Chapturs Feature Roadmap & Enhancement Plan

## Overview
This document outlines the next phase of development for Chapturs, focusing on editor enhancements, community features, publishing workflow, and mobile optimization.

---

## 🎨 Phase 1: Editor Experience Enhancements

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
