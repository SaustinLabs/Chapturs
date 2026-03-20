# 圷 Fixing "Server Error" on Vercel

## The Problem

You're seeing:
```
Server error
There is a problem with the server configuration.
Check the server logs for more information.
```

This happens when **NextAuth v5** can't find the required `AUTH_SECRET` environment variable.

---

## 笨・Quick Fix (5 minutes)

### Step 1: Add AUTH_SECRET to Vercel

1. Go to your **Vercel Dashboard**
2. Select your **Chapturs** project
3. Go to **Settings** 竊・**Environment Variables**
4. Click **Add New**

Add this variable:

| Key | Value | Environments |
|-----|-------|--------------|
| `AUTH_SECRET` | `<AUTH_SECRET>` | 笨・Production<br>笨・Preview<br>笨・Development |

### Step 2: Add Google OAuth Credentials

While you're in environment variables, add these too:

| Key | Value | Environments |
|-----|-------|--------------|
| `AUTH_GOOGLE_ID` | (from Google Cloud Console) | 笨・Production<br>笨・Preview<br>笨・Development |
| `AUTH_GOOGLE_SECRET` | (from Google Cloud Console) | 笨・Production<br>笨・Preview<br>笨・Development |

### Step 3: Add NEXTAUTH_URL

**For Production environment ONLY:**

| Key | Value | Environments |
|-----|-------|--------------|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | 笨・Production |

Replace `your-app.vercel.app` with your actual Vercel domain.

### Step 4: Redeploy

Either:
- **Push a commit** (triggers auto-deploy)
- **Or manually redeploy** in Vercel Dashboard

---

## 搭 Full Environment Variables Checklist for Vercel

Make sure **ALL** of these are set in Vercel:

### 笨・Database (Already Set)
- `DATABASE_URL`
- `DIRECT_URL`

### 笨・Redis (Already Set)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 笨・AI (Already Set)
- `GROQ_API_KEY`

### 笶・Auth (MISSING - Add These!)
- `AUTH_SECRET` = `<AUTH_SECRET>`
- `AUTH_GOOGLE_ID` = (your Client ID)
- `AUTH_GOOGLE_SECRET` = (your Client Secret)
- `NEXTAUTH_URL` = `https://your-app.vercel.app` (Production only)

---

## 剥 How to Check Vercel Logs

To see the actual error:

1. Go to **Vercel Dashboard**
2. Click your project
3. Go to **Deployments**
4. Click the latest deployment
5. Click **Functions**
6. Look for errors mentioning "AUTH_SECRET" or "invalid secret"

You should see something like:
```
Error: Please define `AUTH_SECRET` environment variable
```

---

## 識 Don't Have Google OAuth Yet?

If you haven't set up Google OAuth credentials yet:

### Option 1: Quick Test (Use Placeholder)

Add these to Vercel temporarily to see if the server error goes away:

```bash
AUTH_GOOGLE_ID="test-id"
AUTH_GOOGLE_SECRET="test-secret"
```

笞・・**Login won't work** but the server error should disappear.

### Option 2: Set Up Real Google OAuth (10 minutes)

Follow `docs/source/ops/GOOGLE_OAUTH_SETUP.md` or `docs/source/ops/AUTH_SETUP_VERCEL.md` to get real credentials.

---

## ｧｪ Test Locally First

Before deploying, test that your environment variables work locally:

1. Update `.env`:
```bash
AUTH_SECRET="<AUTH_SECRET>"
AUTH_GOOGLE_ID="your-real-or-test-id"
AUTH_GOOGLE_SECRET="your-real-or-test-secret"
NEXTAUTH_URL="http://localhost:3000"
```

2. Run dev server:
```bash
npm run dev
```

3. Visit `http://localhost:3000`
   - If you see the homepage: 笨・Auth config is valid
   - If you see "Server Error": 笶・Check your .env file

4. Try to sign in:
   - Click sign in button
   - Should redirect to Google (or show error if credentials are fake)

---

## 菅 Still Getting Server Error?

### Check 1: Environment Variables in Vercel

Go to **Settings 竊・Environment Variables** and verify:
- 笨・`AUTH_SECRET` exists
- 笨・It's enabled for "Production"
- 笨・No extra spaces or quotes
- 笨・You clicked "Save"

### Check 2: Redeploy After Adding Variables

**Important:** Adding environment variables doesn't auto-redeploy!

You must:
- Push a new commit, OR
- Go to Deployments 竊・站ｯ 竊・Redeploy

### Check 3: Check Build Logs

Go to **Deployments 竊・Latest 竊・Build Logs**

Look for:
- 笶・"AUTH_SECRET not defined"
- 笶・"Invalid environment variable"
- 笶・Import errors

### Check 4: Database Connection

The error might not be auth-related! Check if database connection works:

```bash
# In Vercel environment variables, verify:
DATABASE_URL exists
DIRECT_URL exists
```

---

## 庁 Common Mistakes

### Mistake 1: Only Added to "Production"
笨・**Fix**: Select **all three** environments (Production, Preview, Development)

### Mistake 2: Didn't Redeploy
笨・**Fix**: Push a commit or manually redeploy

### Mistake 3: Extra Quotes
笶・Bad: `"<AUTH_SECRET>"`  
笨・Good: `<AUTH_SECRET>`

### Mistake 4: Wrong NEXTAUTH_URL
笶・Bad: `http://localhost:3000` (in Production)  
笨・Good: `https://your-actual-app.vercel.app`

---

## 萄 Visual Guide: Adding Environment Variables in Vercel

```
Vercel Dashboard
笏披楳 Your Project
   笏披楳 Settings
      笏披楳 Environment Variables
         笏披楳 Add New
            笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・
            笏・Key: AUTH_SECRET                 笏・
            笏・Value: <AUTH_SECRET>                笏・
            笏・Environments:                    笏・
            笏・笘・Production                     笏・
            笏・笘・Preview                        笏・
            笏・笘・Development                    笏・
            笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・
            Click "Save"
```

Repeat for each variable!

---

## 笨・Success Checklist

After adding all variables and redeploying:

- [ ] Visit `https://your-app.vercel.app`
- [ ] Homepage loads (no server error)
- [ ] Click "Sign In" button
- [ ] Redirects to Google OAuth page
- [ ] After authorizing, redirects back logged in

---

## 噫 Summary

**The server error is because `AUTH_SECRET` is missing.**

**Fix in 3 steps:**
1. Add `AUTH_SECRET` to Vercel environment variables
2. Add Google OAuth credentials (or test values)
3. Redeploy

**Takes 5 minutes and the error will be gone!**

---

Need help? Check the Vercel function logs for specific error messages.





