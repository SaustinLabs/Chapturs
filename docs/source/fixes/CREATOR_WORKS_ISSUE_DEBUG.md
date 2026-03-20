# Creator Works Not Showing - Critical Data Integrity Issue

## Problem Statement
**User created new works but they are NOT appearing ANYWHERE in the creator hub.** 

- Works were successfully created (user can view them after creation)
- Works do NOT appear in creator hub pages (`/creator/glossary`, `/creator/characters`, `/creator/dashboard`)
- Counter shows **0 works** everywhere
- Recent fix attempt (switching to Prisma methods) made **no difference**

**This suggests the works are being created WITHOUT proper Author linkage, or under a different user/author ID than what the creator hub queries are using.**

## Root Cause Analysis

### Database Structure (Supabase + Prisma)
- **User** → has userId
- **Author** → linked to User via `userId` field  
- **Work** → linked to Author via `authorId` field

### Key Tables (with Prisma mappings)
```prisma
model User {
  id: string
  authorProfile: Author?
  @@map("users")
}

model Author {
  id: string
  userId: string @unique
  works: Work[]
  @@map("authors")
}

model Work {
  id: string
  authorId: string
  sections: Section[]
  glossaryEntries: GlossaryEntry[]
  characterProfiles: CharacterProfile[]
  @@map("works")
}

model Section {
  @@map("sections")  // NOT "chapters"
}

model GlossaryEntry {
  @@map("glossary_entries")  // NOT "glossary_terms"
}

model CharacterProfile {
  @@map("character_profiles")  // Correct
}
```

## Issues Found & Fixed

### Issue 1: Raw SQL with Wrong Table Names (FIXED)
**File**: `/src/app/api/creator/works/route.ts`

**Problem**: Used raw SQL with incorrect table names
```sql
-- ❌ WRONG
SELECT COUNT(*) FROM chapters ...
SELECT COUNT(*) FROM glossary_terms ...
```

**Fix**: Switched to Prisma methods (matches working dashboard pattern)
```typescript
// ✅ CORRECT - Uses Prisma's ORM
const works = await prisma.work.findMany({
  where: { authorId: author.id },
  select: {
    id: true,
    title: true,
    coverImage: true,
    _count: {
      select: {
        sections: true,           // Prisma handles the mapping
        glossaryEntries: true,    // Prisma handles the mapping
        characterProfiles: true   // Prisma handles the mapping
      }
    }
  }
})
```

### Issue 2: Inconsistent Prisma Client Import
**Problem**: Created new `PrismaClient()` instance
```typescript
// ❌ WRONG
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

**Fix**: Use shared prisma instance (Vercel best practice)
```typescript
// ✅ CORRECT
import { prisma } from '@/lib/prisma'
```

## Working Pattern (from dashboard-stats)

The `/api/creator/dashboard-stats` endpoint successfully fetches works using:
```typescript
const author = await prisma.author.findFirst({
  where: { userId: session.user.id }
})

const works = await prisma.work.findMany({
  where: { authorId: author.id }
})
```

We've now replicated this exact pattern in `/api/creator/works`.

## Work Creation Flow (VERIFIED CORRECT)

**File**: `/src/app/api/works/route.ts` (POST endpoint)

1. ✅ Gets user from session
2. ✅ Creates User in DB if doesn't exist
3. ✅ Finds or creates Author profile for user
4. ✅ Creates Work with `authorId: author.id`

This flow is correct and has been working.

## Added Debugging

Added console.logs to track:
```typescript
console.log('[GET /api/creator/works] Fetching works for userId:', session.user.id)
console.log('[GET /api/creator/works] Author found:', author ? `id=${author.id}` : 'NOT FOUND')
console.log('[GET /api/creator/works] Querying works for authorId:', author.id)
console.log('[GET /api/creator/works] Found', works.length, 'works')
console.log('[GET /api/creator/works] Sample work:', JSON.stringify(works[0], null, 2))
console.log('[GET /api/creator/works] Transformed work:', result.title, result._count)
```

Check Vercel function logs to see output.

## Critical Debugging Needed

The issue is likely one of these scenarios:

### Scenario A: Orphaned Works (No Author Linkage)
Works exist but `authorId` is NULL or invalid

### Scenario B: Multiple User/Author Records
User has multiple accounts and works are under different Author ID

### Scenario C: Session Mismatch
Work creation uses different user ID than dashboard queries

### Scenario D: Different Database
Works in different database than dashboard queries (unlikely with Supabase)

## Required Database Investigation

Run these queries in **Supabase SQL Editor** to diagnose:

```sql
-- 1. Find ALL users (to check for duplicates)
SELECT id, email, username, "createdAt" 
FROM users 
ORDER BY "createdAt" DESC;

-- 2. Find ALL authors
SELECT a.id as author_id, a."userId", u.email, a."createdAt"
FROM authors a
LEFT JOIN users u ON a."userId" = u.id
ORDER BY a."createdAt" DESC;

-- 3. Find ALL works (to see if any exist)
SELECT w.id, w.title, w."authorId", w.status, w."createdAt",
       a."userId" as author_user_id,
       u.email as author_email
FROM works w
LEFT JOIN authors a ON w."authorId" = a.id
LEFT JOIN users u ON a."userId" = u.id
ORDER BY w."createdAt" DESC;

-- 4. Find orphaned works (no author linkage)
SELECT w.id, w.title, w."authorId", w."createdAt"
FROM works w
WHERE w."authorId" NOT IN (SELECT id FROM authors)
   OR w."authorId" IS NULL;

-- 5. Cross-check: Count works per author
SELECT a.id as author_id, 
       a."userId",
       u.email,
       COUNT(w.id) as work_count
FROM authors a
LEFT JOIN users u ON a."userId" = u.id
LEFT JOIN works w ON w."authorId" = a.id
GROUP BY a.id, a."userId", u.email;
```

## Testing Steps

1. **Run SQL queries above** in Supabase to identify the mismatch
2. **Check Vercel logs** at `/api/creator/works` endpoint for:
   ```
   [GET /api/creator/works] Fetching works for userId: XXX
   [GET /api/creator/works] Author found: id=YYY
   [GET /api/creator/works] Found N works
   ```
3. **Compare IDs**: 
   - What userId is the dashboard using?
   - What userId were works created with?
   - Are they the same?

## Potential Fixes (Once Issue Identified)

### If works are orphaned:
```sql
-- Option 1: Link orphaned works to correct author
UPDATE works 
SET "authorId" = 'CORRECT_AUTHOR_ID'
WHERE "authorId" IS NULL OR "authorId" = 'WRONG_AUTHOR_ID';
```

### If multiple user accounts exist:
```sql
-- Option 1: Merge works to primary account
UPDATE works
SET "authorId" = 'PRIMARY_AUTHOR_ID'
WHERE "authorId" = 'DUPLICATE_AUTHOR_ID';

-- Option 2: Delete duplicate author/user
DELETE FROM authors WHERE id = 'DUPLICATE_AUTHOR_ID';
DELETE FROM users WHERE id = 'DUPLICATE_USER_ID';
```

### If session mismatch:
Check authentication flow - may need to fix how user ID is retrieved from session.

## Files Modified

1. `/src/app/api/creator/works/route.ts` - Switched to Prisma methods
2. Added auto-creation of Author profile if missing
3. Added extensive logging for debugging

## For GitHub Copilot Agent

**Task**: Investigate and fix why works don't appear in creator hub

**Steps**:
1. Add logging to work creation endpoint (`/api/works/route.ts` POST) to capture:
   - `session.user.id`
   - Created `author.id`
   - Created `work.id` and `work.authorId`
   
2. Add logging to dashboard query (`/api/creator/works/route.ts` GET) to capture:
   - `session.user.id` 
   - Found `author.id`
   - Query results

3. Compare the IDs from steps 1 and 2 - are they matching?

4. Run the SQL diagnostic queries in Supabase (see "Required Database Investigation" above)

5. Based on findings, implement one of:
   - Fix the work creation flow to use correct author ID
   - Fix the dashboard query to look up correct author ID
   - Migrate orphaned works to correct author
   - Fix authentication/session handling

**Key Files**:
- `/src/app/api/works/route.ts` - Work creation (POST)
- `/src/app/api/creator/works/route.ts` - Creator works listing (GET)
- `/src/app/api/creator/dashboard-stats/route.ts` - Dashboard (uses same pattern)
- `/prisma/schema.prisma` - Database schema

**Success Criteria**:
- User's created works appear in `/creator/glossary` and `/creator/characters`
- Work count shows correct number
- All existing works are properly linked to their creator

## Deployment

Pushed to GitHub main branch → triggers Vercel auto-deploy
Check deployment status: https://vercel.com/stonecoldsam/chapturs

## Recent Changes (Did Not Fix Issue)
- Switched from raw SQL to Prisma methods
- Fixed table name mappings (sections, glossary_entries, character_profiles)
- Added auto-creation of Author profile
- Added extensive logging

These changes were correct but didn't fix the root issue, suggesting the problem is **data-level** not **code-level**.
