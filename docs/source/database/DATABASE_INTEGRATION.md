# Supabase + Upstash Integration Guide 🚀// Database Integration Guide for Chapturs

// From Mock Data to Production Database

## 🎯 Overview

## Current Architecture ✅

This guide walks you through setting up Chapturs with:

- **Supabase** (PostgreSQL database + auth + storage)The platform is designed with **data layer abstraction**, making it easy to transition from mock data to a real database:

- **Upstash Redis** (Write batching for 95% write reduction)

- **Vercel** (App hosting + cron jobs)### 1. Service Layer Pattern

```typescript

**Total cost to start**: $0/month (all free tiers!)// All data access goes through service functions

export const fetchFeedItems = async (hubMode, userId, filters)

---export const searchWorks = async (query, filters) 

export const toggleSubscription = async (workId, userId)

## Part 1: Supabase Setup (5 minutes)```



### Step 1: Create Supabase Account### 2. Promise-Based API

```typescript

1. Go to [https://supabase.com](https://supabase.com)// Already simulates async database operations

2. Click **"Start your project"**await new Promise(resolve => setTimeout(resolve, 500))

3. Sign up with GitHub (easiest)```



### Step 2: Create New Project### 3. Type Safety

```typescript

1. Click **"New Project"**// Strong TypeScript interfaces for all data structures

2. Fill in details:Work, FeedItem, User, Chapter, etc.

   - **Name**: `chapturs` (or your choice)```

   - **Database Password**: Generate a strong password (SAVE THIS!)

   - **Region**: Choose closest to your users## Production Database Setup 🚀

     - `US East (N. Virginia)` for USA

     - `EU West (Ireland)` for Europe### Step 1: Choose Database

     - `Southeast Asia (Singapore)` for Asia**Recommended**: PostgreSQL with Prisma ORM

   - **Pricing Plan**: Free```bash

npm install prisma @prisma/client

3. Click **"Create new project"**npm install pg @types/pg

4. Wait ~2 minutes for provisioning```



### Step 3: Get Connection Strings### Step 2: Set up Prisma Schema

```prisma

Once project is ready:// prisma/schema.prisma

model User {

1. Go to **Settings** (⚙️ icon) → **Database**  id       String @id @default(cuid())

2. Scroll to **"Connection string"**  email    String @unique

3. Select **"URI"** tab  username String @unique

4. Copy the connection string - looks like:  works    Work[]

   ```  subscriptions Subscription[]

   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres  bookmarks     Bookmark[]

   ```}



5. **Replace `[YOUR-PASSWORD]`** with your actual database passwordmodel Work {

  id          String @id @default(cuid())

### Step 4: Get Direct URL (for migrations)  title       String

  description String

1. Still in **Settings → Database**  authorId    String

2. Find **"Connection pooling"** section  author      User   @relation(fields: [authorId], references: [id])

3. Scroll to **"Direct connection"**  formatType  String

4. Copy this URL - looks like:  status      String

   ```  sections    Section[]

   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres  createdAt   DateTime @default(now())

   ```}



5. Again, **replace `[YOUR-PASSWORD]`**model Section {

  id       String @id @default(cuid())

---  workId   String

  work     Work   @relation(fields: [workId], references: [id])

## Part 2: Upstash Redis Setup (3 minutes)  title    String

  content  Json

### Step 1: Create Upstash Account  wordCount Int?

}

1. Go to [https://upstash.com](https://upstash.com)```

2. Sign up with GitHub or Google

3. Verify email### Step 3: Replace Mock Functions

```typescript

### Step 2: Create Redis Database// lib/database/queries.ts

import { PrismaClient } from '@prisma/client'

1. Click **"Create Database"**

2. Fill in:const prisma = new PrismaClient()

   - **Name**: `chapturs-cache`

   - **Type**: Select **"Regional"**export async function getFeedItems(userId?: string) {

   - **Region**: **Same as your Supabase** (e.g., US-East-1)  return await prisma.work.findMany({

   - **Eviction**: Choose **"No eviction"**    include: {

3. Click **"Create"**      author: true,

      sections: true,

### Step 3: Get Redis Credentials      _count: {

        select: { subscriptions: true, bookmarks: true }

1. In your database dashboard, scroll to **"REST API"**      }

2. Copy two values:    },

   - **UPSTASH_REDIS_REST_URL**: `https://xxx.upstash.io`    orderBy: { createdAt: 'desc' },

   - **UPSTASH_REDIS_REST_TOKEN**: Long token string    take: 20

  })

---}



## Part 3: Vercel Environment Variablesexport async function createWork(data: any) {

  return await prisma.work.create({

### Add to Vercel Dashboard    data: {

      title: data.title,

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**      description: data.description,

      authorId: data.authorId,

Add these:      formatType: data.formatType,

      status: 'draft'

```bash    }

# Supabase Database (required)  })

DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1}

```

DIRECT_URL=postgresql://postgres.xxxxx:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

### Step 4: File Upload Integration

# NextAuth (required)```typescript

NEXTAUTH_URL=https://your-app.vercel.app// lib/storage/uploads.ts

NEXTAUTH_SECRET=<run: openssl rand -base64 32>import { v2 as cloudinary } from 'cloudinary'



# Groq for Quality Assessment (required)export async function uploadFile(file: File, purpose: string) {

GROQ_API_KEY=gsk_your_groq_api_key_here  const formData = new FormData()

  formData.append('file', file)

# Upstash Redis for Write Batching (optional but recommended)  formData.append('upload_preset', 'chapturs')

UPSTASH_REDIS_REST_URL=https://xxx.upstash.io  

UPSTASH_REDIS_REST_TOKEN=your_token_here  const response = await fetch(

    'https://api.cloudinary.com/v1_1/your-cloud/upload',

# Cron Security (optional)    { method: 'POST', body: formData }

CRON_SECRET=<run: openssl rand -base64 32>  )

```  

  const result = await response.json()

**Important Notes**:  return result.secure_url

- For `DATABASE_URL`: Add `?pgbouncer=true&connection_limit=1` at the end}

- For `NEXTAUTH_URL`: Use your actual Vercel domain```

- Generate secrets: `openssl rand -base64 32`

## Migration Strategy 📈

---

### Phase 1: Parallel Development

## Part 4: Database Migration- Keep mock data for development

- Build database schema

### Option A: From Your Local Environment- Create API routes

- Test with real data

```bash

# 1. Create .env file with your Supabase credentials### Phase 2: Gradual Migration

cat > .env << 'EOF'```typescript

DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"// Use environment variable to toggle

DIRECT_URL="postgresql://postgres.xxxxx:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"const USE_DATABASE = process.env.NODE_ENV === 'production'

EOF

export async function getFeedItems(userId?: string) {

# 2. Push schema to Supabase  if (USE_DATABASE) {

npx prisma db push    return await DatabaseService.getFeedItems(userId)

  } else {

# 3. Verify    return MockData.fetchFeedItems('reader', userId)

npx prisma studio  }

# Should open browser with all your tables connected to Supabase!}

``````



### Option B: Auto-migration on First Vercel Deploy### Phase 3: Full Production

- Replace all mock calls with database calls

If you skip local migration:- Add proper error handling

1. Add env vars to Vercel- Implement caching

2. Push to GitHub- Add real-time features

3. Vercel builds and runs migrations automatically

4. Check build logs for migration status## Content Upload Workflow 📝



---### Current Mock Upload (Development)

```typescript

## Part 5: Update vercel.json// Creator uploads content → Stored in memory

const newWork = MockData.createWork(workData)

Create or update `vercel.json` in project root:```



```json### Production Upload Workflow

{```typescript

  "crons": [// 1. User uploads content via Creator Hub

    {const formData = new FormData()

      "path": "/api/cron/process-assessments",formData.append('title', title)

      "schedule": "*/5 * * * *"formData.append('content', content)

    },formData.append('coverImage', coverImageFile)

    {

      "path": "/api/cron/flush-analytics",// 2. API processes upload

      "schedule": "*/5 * * * *"const response = await fetch('/api/works', {

    }  method: 'POST',

  ]  body: formData

}})

```

// 3. Files uploaded to cloud storage

This runs:const coverUrl = await uploadFile(coverImageFile, 'cover')

- **Quality assessment processor**: Every 5 minutes

- **Analytics flush (Redis → DB)**: Every 5 minutes// 4. Content saved to database

const work = await prisma.work.create({

Commit and push:  data: { title, description, coverImage: coverUrl }

```bash})

git add vercel.json

git commit -m "feat: Add cron jobs for background processing"// 5. Available immediately in feed

git push origin main// 6. Real-time notifications sent to subscribers

``````



---## Testing Real Uploads 🧪



## 📊 How Write Optimization Works### 1. Set up local database

```bash

### Without Optimizationnpx prisma init

```npx prisma db push

1000 readers viewing a storynpx prisma studio

  → 1000 database writes ❌```

```

### 2. Test Creator Hub workflow

### With Our Setup- Sign in as creator

```- Upload new work with cover image

1000 readers viewing a story- Add chapters/sections

- Publish work

In-Memory (60s):- Verify appears in feed

  → Views accumulate

  → Flush to Redis: 17 writes### 3. Test Reader workflow

- Sign in as reader

Redis (5min):- Subscribe to creator

  → Accumulates from memory- Read content

  → Flush to DB: 1 write- Bookmark chapters

- Verify reading history

Result: 1 DB write instead of 1000 (99.9% reduction!) ✅

```## Ready for Production ✅



---The current architecture is **already database-ready**:



## ✅ Success Criteria1. ✅ **Service layer abstraction** - Easy to swap mock for real DB

2. ✅ **Async operations** - All functions return promises

Everything is working when:3. ✅ **Type safety** - Strong interfaces prevent errors

4. ✅ **Component separation** - UI doesn't know about data source

1. ✅ Vercel build succeeds5. ✅ **Error handling** - Loading states and error boundaries

2. ✅ Homepage loads6. ✅ **Authentication** - Real OAuth integration with Auth.js

3. ✅ Can create account / sign in

4. ✅ Can upload story## Next Steps for Database Integration

5. ✅ View counts appear (after 5 min delay)

6. ✅ Upstash dashboard shows Redis keys1. **Install Prisma**: `npm install prisma @prisma/client`

7. ✅ Database has fewer writes than actual views2. **Create schema**: Define tables matching our types

3. **Generate client**: `npx prisma generate`

**Ready to deploy!** 🎉4. **Create API routes**: `/api/works`, `/api/chapters`, etc.

5. **Add file upload**: Cloudinary/AWS S3 integration
6. **Test everything**: Full upload → read workflow
7. **Deploy**: Vercel + PlanetScale/Neon database

The platform is designed to handle real content uploads and database operations from day one!
