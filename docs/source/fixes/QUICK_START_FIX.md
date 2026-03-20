# 剥 Quick Start Guide - Fix Creator Works Issue

## The Problem
Your works don't show up in Creator Hub (`/creator/glossary`, `/creator/characters`, `/creator/dashboard`) even though you can see them right after creating them.

## The Solution (3 Simple Steps)

### Step 1: Deploy This PR 笨・
Merge this PR and wait for Vercel to deploy it (usually takes 2-3 minutes).

### Step 2: Run Diagnostic 博
Once deployed, visit this URL **while logged in**:
```
https://your-app.vercel.app/api/creator/debug
```

You'll see a JSON report. Look for the `"possibleIssue"` field:
- `"WORKS_UNDER_DIFFERENT_AUTHOR"` 竊・Your works exist but are linked to a different account
- `"NO_AUTHOR_PROFILE"` 竊・You need an author profile
- `"NO_WORKS_CREATED"` 竊・No works found (double-check you created them)
- `"NO_ISSUE_DETECTED"` 竊・Everything looks good (but if works still don't show, check logs)

### Step 3: Run Fix (if needed) 肌

If Step 2 shows an issue, run the fix:

**Option A - Using Browser:**
1. Open DevTools (F12)
2. Go to Console
3. Paste this:
```javascript
fetch('/api/creator/fix-works', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```
4. Press Enter

**Option B - Using curl:**
```bash
curl -X POST https://your-app.vercel.app/api/creator/fix-works \
  -H "Cookie: <your-session-cookie>"
```

**What it does:**
- Creates author profile if missing
- Moves all your works to your current account
- Returns a report of what was migrated

### Step 4: Verify 笨ｨ
Refresh your Creator Hub pages - your works should now appear!

## What Changed in This PR

### 肌 Technical Improvements
1. **Standardized author lookup** - More consistent database queries
2. **Enhanced logging** - Better visibility in Vercel logs for debugging
3. **Diagnostic endpoint** - See exactly what's in your database
4. **Fix endpoint** - Automatic migration of orphaned works

### 統 Added Files
- `/api/creator/debug` - Diagnostic tool
- `/api/creator/fix-works` - Migration tool
- `docs/source/fixes/CREATOR_WORKS_FIX_GUIDE.md` - Detailed documentation
- `docs/source/fixes/CREATOR_WORKS_INVESTIGATION.md` - Technical summary

## Why This Happened

The most common cause is a **user ID mismatch**:
- Works were created under Author A
- Your current session is using Author B
- The system can't find works for Author B

This can happen when:
- Switching authentication providers (Google 竊・GitHub, etc.)
- Database migrations
- Multiple accounts with the same email

## After You Fix It

### 笨・Cleanup (Important!)
Once your works are showing correctly, **remove the diagnostic endpoints**:

1. Delete `src/app/api/creator/debug/`
2. Delete `src/app/api/creator/fix-works/`
3. Commit and deploy

**Why?** These endpoints:
- Expose user account information
- Can modify your database
- Should not be public in production

### 投 Check Logs
Visit Vercel logs to see the enhanced logging in action. You should see:
```
[POST /api/works] 笨・Work created successfully!
[GET /api/creator/works] Found 3 works
```

## Troubleshooting

### "Still not working!"
1. Check Vercel logs for errors
2. Run `/api/creator/debug` again and share the output
3. Verify in Supabase that works actually exist in the `works` table

### "The fix endpoint didn't migrate anything"
This means either:
- No works exist in your database (create one to test)
- Works are already correctly linked (check the diagnostic report details)

### "I see multiple users with my email"
This indicates duplicate accounts. The fix will still work, but you should:
1. Decide which account to keep
2. Consider manually cleaning up duplicates in Supabase
3. Stick with one auth provider going forward

## Need More Help?

Check the detailed guides:
- **`docs/source/fixes/CREATOR_WORKS_FIX_GUIDE.md`** - Complete troubleshooting guide
- **`docs/source/fixes/CREATOR_WORKS_INVESTIGATION.md`** - Technical deep dive

Or share:
- Output from `/api/creator/debug`
- Relevant logs from Vercel
- Steps you took before the issue appeared

## Timeline

1. **Now**: Merge this PR
2. **2 min**: Wait for Vercel deploy
3. **1 min**: Run diagnostic endpoint
4. **30 sec**: Run fix endpoint (if needed)
5. **Done**: Works appear in Creator Hub! 脂

---

**Note:** The enhanced logging will remain active and is safe for production. Only the `/debug` and `/fix-works` endpoints need to be removed.



