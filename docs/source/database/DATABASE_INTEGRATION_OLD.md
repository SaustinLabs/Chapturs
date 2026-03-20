// Database Integration Guide for Chapturs
// From Mock Data to Production Database

## Current Architecture ✅

The platform is designed with **data layer abstraction**, making it easy to transition from mock data to a real database:

### 1. Service Layer Pattern
```typescript
// All data access goes through service functions
export const fetchFeedItems = async (hubMode, userId, filters)
export const searchWorks = async (query, filters) 
export const toggleSubscription = async (workId, userId)
```

### 2. Promise-Based API
```typescript
// Already simulates async database operations
await new Promise(resolve => setTimeout(resolve, 500))
```

### 3. Type Safety
```typescript
// Strong TypeScript interfaces for all data structures
Work, FeedItem, User, Chapter, etc.
```

## Production Database Setup 🚀

### Step 1: Choose Database
**Recommended**: PostgreSQL with Prisma ORM
```bash
npm install prisma @prisma/client
npm install pg @types/pg
```

### Step 2: Set up Prisma Schema
```prisma
// prisma/schema.prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  username String @unique
  works    Work[]
  subscriptions Subscription[]
  bookmarks     Bookmark[]
}

model Work {
  id          String @id @default(cuid())
  title       String
  description String
  authorId    String
  author      User   @relation(fields: [authorId], references: [id])
  formatType  String
  status      String
  sections    Section[]
  createdAt   DateTime @default(now())
}

model Section {
  id       String @id @default(cuid())
  workId   String
  work     Work   @relation(fields: [workId], references: [id])
  title    String
  content  Json
  wordCount Int?
}
```

### Step 3: Replace Mock Functions
```typescript
// lib/database/queries.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getFeedItems(userId?: string) {
  return await prisma.work.findMany({
    include: {
      author: true,
      sections: true,
      _count: {
        select: { subscriptions: true, bookmarks: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
}

export async function createWork(data: any) {
  return await prisma.work.create({
    data: {
      title: data.title,
      description: data.description,
      authorId: data.authorId,
      formatType: data.formatType,
      status: 'draft'
    }
  })
}
```

### Step 4: File Upload Integration
```typescript
// lib/storage/uploads.ts
import { v2 as cloudinary } from 'cloudinary'

export async function uploadFile(file: File, purpose: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'chapturs')
  
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/your-cloud/upload',
    { method: 'POST', body: formData }
  )
  
  const result = await response.json()
  return result.secure_url
}
```

## Migration Strategy 📈

### Phase 1: Parallel Development
- Keep mock data for development
- Build database schema
- Create API routes
- Test with real data

### Phase 2: Gradual Migration
```typescript
// Use environment variable to toggle
const USE_DATABASE = process.env.NODE_ENV === 'production'

export async function getFeedItems(userId?: string) {
  if (USE_DATABASE) {
    return await DatabaseService.getFeedItems(userId)
  } else {
    return MockData.fetchFeedItems('reader', userId)
  }
}
```

### Phase 3: Full Production
- Replace all mock calls with database calls
- Add proper error handling
- Implement caching
- Add real-time features

## Content Upload Workflow 📝

### Current Mock Upload (Development)
```typescript
// Creator uploads content → Stored in memory
const newWork = MockData.createWork(workData)
```

### Production Upload Workflow
```typescript
// 1. User uploads content via Creator Hub
const formData = new FormData()
formData.append('title', title)
formData.append('content', content)
formData.append('coverImage', coverImageFile)

// 2. API processes upload
const response = await fetch('/api/works', {
  method: 'POST',
  body: formData
})

// 3. Files uploaded to cloud storage
const coverUrl = await uploadFile(coverImageFile, 'cover')

// 4. Content saved to database
const work = await prisma.work.create({
  data: { title, description, coverImage: coverUrl }
})

// 5. Available immediately in feed
// 6. Real-time notifications sent to subscribers
```

## Testing Real Uploads 🧪

### 1. Set up local database
```bash
npx prisma init
npx prisma db push
npx prisma studio
```

### 2. Test Creator Hub workflow
- Sign in as creator
- Upload new work with cover image
- Add chapters/sections
- Publish work
- Verify appears in feed

### 3. Test Reader workflow
- Sign in as reader
- Subscribe to creator
- Read content
- Bookmark chapters
- Verify reading history

## Ready for Production ✅

The current architecture is **already database-ready**:

1. ✅ **Service layer abstraction** - Easy to swap mock for real DB
2. ✅ **Async operations** - All functions return promises
3. ✅ **Type safety** - Strong interfaces prevent errors
4. ✅ **Component separation** - UI doesn't know about data source
5. ✅ **Error handling** - Loading states and error boundaries
6. ✅ **Authentication** - Real OAuth integration with Auth.js

## Next Steps for Database Integration

1. **Install Prisma**: `npm install prisma @prisma/client`
2. **Create schema**: Define tables matching our types
3. **Generate client**: `npx prisma generate`
4. **Create API routes**: `/api/works`, `/api/chapters`, etc.
5. **Add file upload**: Cloudinary/AWS S3 integration
6. **Test everything**: Full upload → read workflow
7. **Deploy**: Vercel + PlanetScale/Neon database

The platform is designed to handle real content uploads and database operations from day one!
