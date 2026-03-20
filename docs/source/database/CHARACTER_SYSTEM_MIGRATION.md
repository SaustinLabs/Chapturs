# Character System Database Migration

## Overview
This migration adds the character profile system tables to the database, fixing the 500 error on `POST /api/works/[id]/characters`.

## Problem
The character profile feature was added with `prisma db push` but no migration was created, so the tables don't exist in production (Supabase/Vercel).

## Solution
A new migration has been created: `20251014000000_add_character_system`

## Tables Created
1. **character_profiles** - Main character information
2. **character_relationships** - Character relationships (family, friends, enemies, etc.)
3. **character_versions** - Chapter-aware character development tracking

## How to Apply Migration

### Option 1: Via Prisma CLI (Recommended)
```bash
# Deploy migration to production database
npx prisma migrate deploy
```

### Option 2: Via Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the contents of `prisma/migrations/20251014000000_add_character_system/migration.sql`
5. Paste and run the query

### Option 3: Automatic on Next Vercel Deploy
The migration will be applied automatically on the next deployment if:
- `DATABASE_URL` is set in Vercel environment variables
- `npx prisma migrate deploy` is run in the build process

## Verification

After applying the migration, verify the tables exist:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'character_%';

-- Should return:
-- character_profiles
-- character_relationships
-- character_versions
```

## Testing the Fix

1. Create a character profile via the API:
```bash
curl -X POST https://chapturs.com/api/works/[workId]/characters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Character",
    "role": "protagonist",
    "aliases": ["Hero"],
    "backstory": "A brave warrior"
  }'
```

2. Expected response:
```json
{
  "success": true,
  "character": {
    "id": "...",
    "name": "Test Character",
    "role": "protagonist",
    ...
  }
}
```

## API Improvements

The character profile API endpoints now include:

1. **Input validation** using Zod schema
   - Validates all fields (name length, URL formats, etc.)
   - Returns detailed validation errors

2. **Better error handling**
   - Detects missing table (error code 42P01)
   - Provides helpful hints for database errors
   - Logs detailed error information for debugging

3. **Proper error responses**
   - 400 for validation errors
   - 401 for authentication errors
   - 403 for authorization errors
   - 404 for work not found
   - 500 for database/server errors

## Related Files

- Migration: `prisma/migrations/20251014000000_add_character_system/migration.sql`
- API Route: `src/app/api/works/[id]/characters/route.ts`
- Schemas: `src/lib/api/schemas.ts` (added `createCharacterProfileSchema`)
- Prisma Schema: `prisma/schema.prisma` (CharacterProfile, CharacterRelationship, CharacterVersion models)

## Rollback (if needed)

To rollback this migration:

```sql
DROP TABLE IF EXISTS "character_versions" CASCADE;
DROP TABLE IF EXISTS "character_relationships" CASCADE;
DROP TABLE IF EXISTS "character_profiles" CASCADE;
```

## Notes

- The migration uses `CREATE TABLE IF NOT EXISTS` to prevent errors if tables already exist
- All foreign keys have `ON DELETE CASCADE` for proper cleanup
- Indexes are created for performance on common queries
- The API uses raw SQL queries to avoid Prisma client cache issues (following the glossary pattern)
