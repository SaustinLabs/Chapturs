# Creator Works Issue - Diagnostic and Fix Guide

## Problem
Works created by users don't appear in the creator hub (glossary, characters, dashboard pages), even though they can view works after creation.

## Root Cause Analysis
The most likely cause is a **user/author ID mismatch**:
- Works were created and linked to Author A (with userId X)
- Current session is using Author B (with userId Y)
- When querying for works, the system looks for Author B but finds no works

This can happen due to:
1. Authentication provider changes (e.g., switching from Google to GitHub)
2. Database migration issues
3. Multiple user accounts with the same email
4. Session management changes in NextAuth

## Solution Steps

### Step 1: Diagnose the Issue

Visit the diagnostic endpoint while logged in:
```
https://your-app.vercel.app/api/creator/debug
```

This will return a comprehensive report showing:
- Your current session user ID
- All users with your email
- All author profiles linked to your email
- All works and which author they belong to
- Diagnosis of the specific issue

**Example Diagnosis Output:**
```json
{
  "success": true,
  "report": {
    "session": {
      "userId": "clx123...",
      "email": "user@example.com"
    },
    "usersWithThisEmail": {
      "count": 2,
      "users": [...]
    },
    "authorsForThisEmail": {
      "count": 2,
      "authors": [
        {
          "authorId": "clx456...",
          "userId": "clx123...",
          "workCount": 0,
          "isCurrentSessionAuthor": true
        },
        {
          "authorId": "clx789...",
          "userId": "clx999...",
          "workCount": 3,
          "isCurrentSessionAuthor": false
        }
      ]
    },
    "diagnosis": {
      "possibleIssue": "WORKS_UNDER_DIFFERENT_AUTHOR"
    }
  },
  "recommendation": "Works exist but are linked to a different author/user ID..."
}
```

### Step 2: Review the Diagnosis

Check the following in the diagnostic report:

1. **`diagnosis.possibleIssue`** - What's wrong?
   - `NO_AUTHOR_PROFILE` - No author profile for current session
   - `WORKS_UNDER_DIFFERENT_AUTHOR` - Works exist but under different author
   - `NO_WORKS_CREATED` - No works have been created yet
   - `NO_ISSUE_DETECTED` - Everything looks correct

2. **`authorsForThisEmail`** - How many author profiles exist?
   - Should be 1, but might show multiple if there's an issue

3. **`allWorksForThisEmail`** - Where are your works?
   - Check `belongsToCurrentSession` field
   - If false, works are under a different author profile

### Step 3: Fix the Issue

If the diagnosis shows `WORKS_UNDER_DIFFERENT_AUTHOR` or `NO_AUTHOR_PROFILE`, run the fix endpoint:

```bash
# Using curl
curl -X POST https://your-app.vercel.app/api/creator/fix-works \
  -H "Cookie: your-session-cookie"

# Or simply POST to the URL while logged in via browser
```

The fix endpoint will:
1. Create an author profile if one doesn't exist for your current session
2. Find all works under other author profiles with your email
3. Migrate those works to your current author profile
4. Return a detailed report of what was migrated

**Example Fix Output:**
```json
{
  "success": true,
  "message": "Successfully migrated 3 work(s) to current author profile",
  "migrated": 3,
  "works": [
    {
      "id": "work1",
      "title": "My Novel",
      "oldAuthorId": "clx789...",
      "newAuthorId": "clx456..."
    }
  ]
}
```

### Step 4: Verify

After running the fix:
1. Refresh your creator hub pages
2. Check `/creator/glossary` - Works should now appear
3. Check `/creator/characters` - Works should now appear
4. Check `/creator/dashboard` - Stats should be updated

## Enhanced Logging

All key endpoints now have enhanced logging. Check your Vercel logs for:

### Work Creation (`/api/works` POST)
```
[POST /api/works] Creating work for user: clx123...
[POST /api/works] Found existing author with ID: clx456... for userId: clx123...
[POST /api/works] ✅ Work created successfully!
[POST /api/works] ✅ IDs match: YES
```

### Creator Hub Query (`/api/creator/works` GET)
```
[GET /api/creator/works] Fetching works for userId: clx123...
[GET /api/creator/works] Author found: id=clx456..., userId=clx123...
[GET /api/creator/works] Found 3 works
```

### Authentication (`auth.ts`)
```
✅ User upserted: { email: 'user@example.com', id: 'clx123...', username: '...' }
📝 Attempting to upsert author profile for userId: clx123...
✅ Author profile ready: { authorId: 'clx456...', userId: 'clx123...' }
[Session Callback] Setting session.user.id from token.sub: clx123...
```

## Troubleshooting

### Issue: "NO_AUTHOR_PROFILE"
**Cause:** No author profile exists for your current session user ID.

**Solution:** 
- Run the fix endpoint - it will create one automatically
- OR wait for next work creation - it will auto-create the profile

### Issue: "WORKS_UNDER_DIFFERENT_AUTHOR"
**Cause:** Your works are linked to a different author profile (different user ID).

**Solution:**
- Run the fix endpoint to migrate works to your current profile
- This is usually caused by authentication changes or database migrations

### Issue: "NO_WORKS_CREATED"
**Cause:** No works exist in the database for any author with your email.

**Solution:**
- Create a new work through the normal flow
- Check if you're using the correct email/account

### Issue: Multiple Users with Same Email
**Cause:** Database has multiple user records with the same email (shouldn't happen normally).

**Solution:**
- This indicates a database integrity issue
- Contact support or manually clean up duplicate records in Supabase
- The fix endpoint will still migrate all works to current author

## Code Changes Summary

### 1. Standardized Author Lookup
Changed all creator endpoints to use `findUnique` instead of `findFirst`:
```typescript
// Before
const author = await prisma.author.findFirst({
  where: { userId: session.user.id }
})

// After (consistent with schema's @unique constraint)
const author = await prisma.author.findUnique({
  where: { userId: session.user.id }
})
```

### 2. Enhanced Logging
Added detailed logging to track:
- Session user IDs at every step
- Author profile creation and lookup
- Work creation and authorId assignment
- ID matching validation

### 3. New Endpoints
- `/api/creator/debug` (GET) - Diagnostic report
- `/api/creator/fix-works` (POST) - Automatic migration

## Security Notes

**⚠️ IMPORTANT:** The diagnostic and fix endpoints should be:
1. **Removed** before going to production, OR
2. **Protected** with admin-only access, OR
3. **Rate-limited** to prevent abuse

These endpoints expose information about user accounts and can modify database records.

## Next Steps After Fix

Once works are appearing correctly:
1. **Remove diagnostic endpoints** from production code
2. **Monitor logs** for any future ID mismatches
3. **Document the fix** in your runbook
4. **Consider adding** a migration script for other affected users
5. **Review authentication flow** to prevent future occurrences

## Prevention

To prevent this issue in the future:
1. **Never change user IDs** after creation
2. **Maintain consistent** authentication provider (or handle migrations carefully)
3. **Use the enhanced logging** to catch issues early
4. **Ensure auth.ts** always creates author profiles on sign-in
5. **Test authentication flows** thoroughly after any changes

## Questions?

If the diagnostic/fix doesn't resolve your issue:
1. Check Vercel logs for detailed error messages
2. Run diagnostic endpoint and share the output
3. Verify database connectivity and Prisma schema
4. Check if works actually exist in Supabase database
