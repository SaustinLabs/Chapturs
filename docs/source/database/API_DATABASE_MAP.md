# 🗺️ Chapturs API & Database Reference Map

*Last Updated: September 17, 2025*

## 📋 Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [API Endpoints Reference](#api-endpoints-reference)
3. [Database Service Methods](#database-service-methods)
4. [Data Flow Patterns](#data-flow-patterns)
5. [Upload System Integration Points](#upload-system-integration-points)
6. [Authentication & Authorization](#authentication--authorization)
7. [File Storage & Media](#file-storage--media)
8. [Quick Reference Tables](#quick-reference-tables)

---

## 🗄️ Database Schema Overview

### Core Models

#### 👤 **User Model**
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  username    String   @unique
  displayName String?
  bio         String?
  avatar      String?
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  authorProfile  Author?
  subscriptions  Subscription[]
  bookmarks      Bookmark[]
  likes          Like[]
  readingHistory ReadingHistory[]
}
```

#### ✍️ **Author Model** *(Extends User for creators)*
```prisma
model Author {
  id          String   @id @default(cuid())
  userId      String   @unique
  socialLinks String?  // JSON string
  verified    Boolean  @default(false)
  
  // Relations
  user          User           @relation(fields: [userId], references: [id])
  works         Work[]
  subscriptions Subscription[]
}
```

#### 📚 **Work Model** *(Main content container)*
```prisma
model Work {
  id             String   @id @default(cuid())
  title          String
  description    String
  authorId       String
  formatType     String   // 'novel', 'article', 'comic', 'hybrid'
  coverImage     String?
  status         String   @default("draft") // 'draft', 'ongoing', 'completed', 'hiatus'
  maturityRating String   @default("PG")    // 'G', 'PG', 'PG-13', 'R', 'NC-17'
  genres         String   // JSON array
  tags           String   // JSON array
  statistics     String   // JSON object
  glossary       String?  // JSON array
  
  // Relations
  author          Author           @relation(fields: [authorId], references: [id])
  sections        Section[]
  bookmarks       Bookmark[]
  likes           Like[]
  readingHistory  ReadingHistory[]
  glossaryEntries GlossaryEntry[]
}
```

#### 📄 **Section Model** *(Chapters/Episodes/Articles)*
```prisma
model Section {
  id          String    @id @default(cuid())
  workId      String
  title       String
  content     String    // JSON object for different content types
  wordCount   Int?
  status      String    @default("draft") // 'draft', 'published', 'archived'
  publishedAt DateTime?
  
  // Relations
  work           Work             @relation(fields: [workId], references: [id])
  readingHistory ReadingHistory[]
}
```

### Interaction Models

#### 🔔 **Subscription Model**
```prisma
model Subscription {
  id                   String   @id @default(cuid())
  userId               String
  authorId             String
  notificationsEnabled Boolean  @default(true)
  subscribedAt         DateTime @default(now())
  
  @@unique([userId, authorId])
}
```

#### ❤️ **Like Model**
```prisma
model Like {
  id      String   @id @default(cuid())
  userId  String
  workId  String
  likedAt DateTime @default(now())
  
  @@unique([userId, workId])
}
```

#### 🔖 **Bookmark Model**
```prisma
model Bookmark {
  id           String   @id @default(cuid())
  userId       String
  workId       String
  bookmarkedAt DateTime @default(now())
  
  @@unique([userId, workId])
}
```

#### 📖 **ReadingHistory Model**
```prisma
model ReadingHistory {
  id         String   @id @default(cuid())
  userId     String
  workId     String
  sectionId  String?
  progress   Float    @default(0) // 0.0 to 100.0 percentage
  lastReadAt DateTime @default(now())
  
  @@unique([userId, workId])
}
```

#### 📝 **GlossaryEntry Model**
```prisma
model GlossaryEntry {
  id         String   @id @default(cuid())
  workId     String
  term       String
  definition String
  createdAt  DateTime @default(now())
}
```

---

## 🔌 API Endpoints Reference

### **Authentication Endpoints**

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js OAuth handling | No |

### **Content Discovery Endpoints**

| Endpoint | Method | Purpose | Auth Required | Parameters |
|----------|--------|---------|---------------|------------|
| `/api/feed` | GET | Get personalized content feed | Optional | `hubMode`, `userId` |
| `/api/works/[id]` | GET | Get specific work details | No | `id` (path) |
| `/api/library` | GET | Get user's bookmarks & subscriptions | Yes | `userId` |

### **User Interaction Endpoints**

| Endpoint | Method | Purpose | Auth Required | Body/Params |
|----------|--------|---------|---------------|-------------|
| `/api/likes` | GET | Check like status | Yes | `userId`, `workId` |
| `/api/likes` | POST | Toggle like on work | Yes | `{ userId, workId }` |
| `/api/bookmarks` | GET | Check bookmark status | Yes | `userId`, `workId` |
| `/api/bookmarks` | POST | Toggle bookmark on work | Yes | `{ userId, workId }` |
| `/api/subscriptions` | GET | Check subscription status | Yes | `userId`, `authorId` |
| `/api/subscriptions` | POST | Toggle subscription to author | Yes | `{ userId, authorId }` |

### **Testing & Development Endpoints**

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/test-db` | GET | Test database connection | No |
| `/api/database` | GET/POST | Database testing & seeding | No |

---

## 🛠️ Database Service Methods

### **Work Operations**
```typescript
// Get all works (with includes)
DatabaseService.getAllWorks(): Promise<Work[]>

// Get single work by ID
DatabaseService.getWork(id: string): Promise<Work | null>

// Search works with filters
DatabaseService.searchWorks(query: string, filters?: any): Promise<Work[]>

// Create new work
DatabaseService.createWork(data: CreateWorkData): Promise<Work>

// Get works by specific user/author
DatabaseService.getUserWorks(userId: string): Promise<Work[]>
```

### **User Operations**
```typescript
// Create new user
DatabaseService.createUser(userData: CreateUserData): Promise<User>

// Get user by ID
DatabaseService.getUser(id: string): Promise<User | null>
```

### **Content Creation**
```typescript
// Create new section/chapter
DatabaseService.createSection(data: {
  workId: string
  title: string
  content: any
  wordCount?: number
}): Promise<Section>
```

### **User Interactions**
```typescript
// Subscription operations
DatabaseService.toggleSubscription(authorId: string, userId: string): Promise<boolean>
DatabaseService.checkUserSubscription(userId: string, authorId: string): Promise<boolean>

// Bookmark operations
DatabaseService.toggleBookmark(workId: string, userId: string): Promise<boolean>
DatabaseService.checkUserBookmark(userId: string, workId: string): Promise<boolean>

// Like operations
DatabaseService.toggleLike(workId: string, userId: string): Promise<boolean>
DatabaseService.checkUserLike(userId: string, workId: string): Promise<boolean>
```

### **Library Operations**
```typescript
// Get user's bookmarked works
DatabaseService.getUserBookmarks(userId: string): Promise<any[]>

// Get user's subscriptions with author details
DatabaseService.getUserSubscriptions(userId: string): Promise<any[]>
```

### **Development/Testing**
```typescript
// Seed database with sample data
DatabaseService.seedDatabase(): Promise<void>
```

---

## 🔄 Data Flow Patterns

### **Content Discovery Flow**
```
Frontend Component → API Route → DatabaseService → Prisma → SQLite
      ↓
   Feed/Work Display ← Type Mapping ← Raw Database Result
```

### **User Interaction Flow**
```
User Action (Like/Bookmark/Subscribe)
      ↓
Frontend Handler → API Route → DatabaseService.toggle*() → Database
      ↓
Status Update ← Boolean Response ← Operation Success/Failure
```

### **Content Upload Flow** *(Future)*
```
Creator Upload → File Processing → Work Creation → Section Creation
      ↓
Media Storage (Cloudinary/S3) → Database Record → Content Available
```

---

## 📤 Upload System Integration Points

### **Current State** ✅
- ✅ Database schema supports file uploads (`coverImage` field)
- ✅ JSON content storage for flexible content types  
- ✅ Section-based content organization
- ✅ Author/Work relationships established
- ✅ User authentication integrated

### **Ready for Upload System** 🚀

#### **1. Media Upload Endpoints** *(To Be Created)*
```typescript
// Future endpoints needed for upload system
POST /api/upload/cover-image    // Upload work cover images
POST /api/upload/content-media  // Upload images/videos for content
POST /api/works                 // Create new work
POST /api/works/[id]/sections   // Add sections to work
PUT  /api/works/[id]           // Update work metadata
```

#### **2. File Storage Integration Points**
```typescript
// Integration points for file upload services
interface FileUploadService {
  uploadCoverImage(file: File, workId: string): Promise<string>
  uploadContentMedia(file: File, sectionId: string): Promise<string>
  deleteFile(url: string): Promise<void>
}

// Database fields ready for file URLs
Work.coverImage: string?     // ✅ Ready
Section.content: JSON        // ✅ Can store media URLs
```

#### **3. Content Processing Pipeline** *(To Be Built)*
```typescript
// Content processing workflow
interface ContentProcessor {
  processNovelChapter(content: string): ProcessedContent
  processComicPages(images: File[]): ProcessedContent  
  processArticleContent(content: string): ProcessedContent
  generateThumbnails(media: File[]): string[]
  extractMetadata(content: any): ContentMetadata
}
```

---

## 🔐 Authentication & Authorization

### **Current Auth Flow**
```typescript
// NextAuth.js integration
import { auth } from '../../../auth'

// In API routes
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### **User Session Structure**
```typescript
interface Session {
  user: {
    id: string
    email: string
    name: string
    image?: string
  }
}
```

### **Authorization Patterns**
```typescript
// Check if user owns content
const work = await DatabaseService.getWork(workId)
if (work.authorId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Check subscription status
const isSubscribed = await DatabaseService.checkUserSubscription(userId, authorId)
```

---

## 📁 File Storage & Media

### **Current State**
- ✅ Database fields ready for file URLs
- ✅ JSON content structure supports media references
- ⏳ File upload service integration needed
- ⏳ Media processing pipeline needed

### **Integration Points for Upload System**
```typescript
// Ready database fields
Work.coverImage: string?           // Store cover image URL
Section.content: JSON             // Store content + media URLs

// Example content structure
interface SectionContent {
  type: 'novel' | 'comic' | 'article'
  text?: string                   // For novels/articles
  images?: string[]              // For comics/illustrations  
  formatting?: TextFormatting    // Rich text formatting
  media?: MediaReference[]       // Embedded media
}
```

---

## 📊 Quick Reference Tables

### **Database Tables & API Endpoints Mapping**

| Database Table | Related API Endpoints | Primary Use Case |
|----------------|----------------------|------------------|
| `users` | `/api/auth/*` | User authentication |
| `authors` | `/api/works/*`, `/api/subscriptions` | Content creation, subscriptions |
| `works` | `/api/works/*`, `/api/feed`, `/api/library` | Content discovery & management |
| `sections` | `/api/works/[id]` | Content reading |
| `subscriptions` | `/api/subscriptions`, `/api/library` | Creator following |
| `bookmarks` | `/api/bookmarks`, `/api/library` | Content saving |
| `likes` | `/api/likes` | Content interaction |
| `reading_history` | *(Future)* `/api/progress` | Reading tracking |
| `glossary_entries` | *(Future)* `/api/glossary` | Content enhancement |

### **JSON Field Structures**

| Field | Model | Structure | Example |
|-------|-------|-----------|---------|
| `genres` | Work | `string[]` | `["fantasy", "romance", "adventure"]` |
| `tags` | Work | `string[]` | `["magic", "crystals", "coming-of-age"]` |
| `statistics` | Work | `WorkStats` | `{"views": 1500, "subscribers": 200}` |
| `socialLinks` | Author | `SocialLink[]` | `[{"platform": "twitter", "url": "..."}]` |
| `content` | Section | `SectionContent` | `{"type": "novel", "text": "...", "formatting": {...}}` |

### **Status Enumerations**

| Field | Possible Values | Default | Description |
|-------|----------------|---------|-------------|
| `Work.status` | `draft`, `ongoing`, `completed`, `hiatus` | `draft` | Publication status |
| `Work.maturityRating` | `G`, `PG`, `PG-13`, `R`, `NC-17` | `PG` | Content rating |
| `Work.formatType` | `novel`, `article`, `comic`, `hybrid` | - | Content format |
| `Section.status` | `draft`, `published`, `archived` | `draft` | Section visibility |

---

## 🔄 Next Steps for Upload System

### **Immediate Needs**
1. **File Upload Service** - Integrate Cloudinary/AWS S3
2. **Content Processing** - Handle different format types
3. **Media Management** - Thumbnail generation, optimization
4. **Upload API Routes** - Create work/section endpoints
5. **Form Validation** - Content submission validation
6. **Progress Tracking** - Upload progress & status

### **Database Extensions** *(If Needed)*
- Add `Work.uploadStatus` field for tracking upload progress
- Add `Media` table for detailed file metadata
- Add `UploadSession` table for resumable uploads

---

*This document serves as the definitive reference for API endpoints, database structure, and integration points. Update this file whenever new endpoints or database changes are made.*
