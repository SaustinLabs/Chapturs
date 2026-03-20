# 🔐 Authentication Setup for Vercel Deployment

## Current Issue: Login Not Working on Vercel

**Problem**: You have test credentials in Vercel that don't work.

**Solution**: Set up real OAuth credentials and add them to Vercel.

---

## 🎯 Recommended Approach: Multi-Provider Auth

You already have NextAuth v5 configured! I recommend adding **3 easy providers**:

1. **Google** ✅ (Already in code)
2. **GitHub** (2 min setup, no verification needed)
3. **Discord** (2 min setup, instant approval)

This gives users options and you backup providers if one fails.

---

## 🚀 Quick Setup Guide

### Option A: Just Google (Simplest - 10 minutes)

Perfect if you want one solid option.

#### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: **"Chapturs"**
3. Enable **Google+ API**:
   - APIs & Services → Library → Search "Google+" → Enable
4. Configure **OAuth Consent Screen**:
   - APIs & Services → OAuth consent screen
   - External user type
   - App name: **Chapturs**
   - User support email: your email
   - Developer contact: your email
   - Save and Continue (skip scopes)
5. Create **OAuth 2.0 Client ID**:
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Name: **Chapturs Web**
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://your-app.vercel.app/api/auth/callback/google
     ```
   - Click **Create**
6. **Copy** Client ID and Client Secret

#### Step 2: Generate AUTH_SECRET

```bash
# Run this in terminal
openssl rand -base64 32
```

Copy the output.

#### Step 3: Add to Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:

| Name | Value | Environment |
|------|-------|-------------|
| `AUTH_SECRET` | (output from openssl command) | Production, Preview, Development |
| `AUTH_GOOGLE_ID` | (your Client ID) | Production, Preview, Development |
| `AUTH_GOOGLE_SECRET` | (your Client Secret) | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production only |
| `NEXTAUTH_URL` | `https://your-app-git-*.vercel.app` | Preview only |

**Done!** Redeploy and Google login will work.

---

### Option B: Multiple Providers (Recommended - 20 minutes)

Add GitHub and Discord for more options and reliability.

#### 1. GitHub OAuth (No Verification Needed!)

**Fastest to set up:**

1. Go to [GitHub Settings → Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - Application name: **Chapturs**
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
4. Click **Register application**
5. Click **Generate a new client secret**
6. **Copy** Client ID and Client Secret

**Add to code** (`auth.ts`):

```typescript
import GitHub from "next-auth/providers/github"

providers: [
  Google({ /* existing config */ }),
  GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
  }),
]
```

**Add to Vercel**:
- `AUTH_GITHUB_ID` = (your Client ID)
- `AUTH_GITHUB_SECRET` = (your Client Secret)

#### 2. Discord OAuth (Also Easy!)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it: **Chapturs**
4. Go to **OAuth2** tab
5. Copy **Client ID** and **Client Secret**
6. Add redirect:
   ```
   https://your-app.vercel.app/api/auth/callback/discord
   ```

**Add to code** (`auth.ts`):

```typescript
import Discord from "next-auth/providers/discord"

providers: [
  Google({ /* existing */ }),
  GitHub({ /* existing */ }),
  Discord({
    clientId: process.env.AUTH_DISCORD_ID,
    clientSecret: process.env.AUTH_DISCORD_SECRET,
  }),
]
```

**Add to Vercel**:
- `AUTH_DISCORD_ID` = (your Client ID)
- `AUTH_DISCORD_SECRET` = (your Client Secret)

---

## 🔧 Update Your Code

Let me create an updated `auth.ts` with all three providers ready to go:

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Discord from "next-auth/providers/discord"
import { prisma } from '@/lib/database/PrismaService'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google OAuth (primary)
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    
    // GitHub OAuth (fast backup option)
    ...(process.env.AUTH_GITHUB_ID ? [
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      })
    ] : []),
    
    // Discord OAuth (popular with webnovel readers)
    ...(process.env.AUTH_DISCORD_ID ? [
      Discord({
        clientId: process.env.AUTH_DISCORD_ID,
        clientSecret: process.env.AUTH_DISCORD_SECRET,
      })
    ] : []),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      // Works with all providers!
      const email = profile?.email
      const emailVerified = profile?.email_verified ?? true // GitHub/Discord don't verify

      if (email && emailVerified) {
        try {
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              displayName: profile.name || undefined,
              avatar: profile.image || profile.picture || profile.avatar_url || undefined,
            },
            create: {
              id: user.id,
              email,
              username: email.split('@')[0] + '_' + Date.now(),
              displayName: profile.name || undefined,
              avatar: profile.image || profile.picture || profile.avatar_url || undefined,
            },
          })

          await prisma.author.upsert({
            where: { userId: dbUser.id },
            update: {},
            create: {
              userId: dbUser.id,
              verified: false,
              socialLinks: '[]',
            },
          })

          console.log('User authenticated via', account?.provider, ':', dbUser.email)
          return true
        } catch (error) {
          console.error('Error creating/updating user:', error)
          return false
        }
      }
      return false
    },
    /* rest of callbacks stay the same */
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
})
```

---

## 📋 Environment Variables Checklist

### Required for All Environments (Production, Preview, Development):

```bash
# Core Auth
AUTH_SECRET="your-32-char-random-string"

# Google (required)
AUTH_GOOGLE_ID="xxxxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxxx"

# GitHub (optional but recommended)
AUTH_GITHUB_ID="Ov23xxxxx"
AUTH_GITHUB_SECRET="xxxxx"

# Discord (optional)
AUTH_DISCORD_ID="123456789"
AUTH_DISCORD_SECRET="xxxxx"

# Database (already set)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Redis (already set)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Groq (already set)
GROQ_API_KEY="gsk_..."
```

### Production Only:

```bash
NEXTAUTH_URL="https://your-app.vercel.app"
```

### Preview Only:

```bash
NEXTAUTH_URL="https://your-app-git-*.vercel.app"
```

---

## ✅ Testing Locally

1. Update `.env.local` with real credentials:

```bash
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_GOOGLE_ID="your-real-client-id"
AUTH_GOOGLE_SECRET="your-real-secret"
NEXTAUTH_URL="http://localhost:3000"
```

2. Start dev server:

```bash
npm run dev
```

3. Go to `http://localhost:3000/auth/signin`
4. Click "Sign in with Google"
5. Should redirect to Google → authorize → redirect back logged in ✅

---

## 🐛 Common Issues

### "redirect_uri_mismatch"

**Fix**: Make sure redirect URI in Google Console matches exactly:
```
https://your-app.vercel.app/api/auth/callback/google
```

No trailing slash, use your actual Vercel domain.

### "invalid_client"

**Fix**: Check environment variables in Vercel:
- Go to Settings → Environment Variables
- Make sure no extra spaces
- Make sure they're set for "Production"
- Redeploy after adding

### "NEXTAUTH_URL not set"

**Fix**: Add to Vercel environment variables:
```
NEXTAUTH_URL=https://your-actual-domain.vercel.app
```

### Still not working?

Check Vercel deployment logs:
```
Deployments → Latest → View Function Logs
```

Look for auth errors.

---

## 🎨 Update Sign In Page

Your sign-in page at `/auth/signin` will automatically show all enabled providers!

If you want to customize the buttons, check `src/app/auth/signin/page.tsx`.

---

## 🚀 Deployment Steps

1. **Set up Google OAuth** (follow Option A above)
2. **Generate AUTH_SECRET**: `openssl rand -base64 32`
3. **Add all variables to Vercel**
4. **Redeploy**:
   ```bash
   git commit --allow-empty -m "trigger deploy"
   git push origin main
   ```
5. **Test**: Visit `https://your-app.vercel.app/auth/signin`

---

## 💡 Pro Tips

1. **Add multiple providers** - If Google is down, users can still log in with GitHub
2. **Test users** - Add your email to Google OAuth test users during development
3. **Domain verification** - Verify your domain in Google Cloud for better trust
4. **Session duration** - Adjust in `auth.ts` if needed (default 30 days)

---

## 📊 Which Providers to Choose?

| Provider | Setup Time | Verification | User Trust | Recommendation |
|----------|------------|--------------|------------|----------------|
| **Google** | 10 min | Optional | ⭐⭐⭐⭐⭐ | Must have |
| **GitHub** | 2 min | None | ⭐⭐⭐⭐ | Highly recommended |
| **Discord** | 2 min | None | ⭐⭐⭐ | Good for webnovel audience |
| **Twitter** | 5 min | Paid ($100/mo) | ⭐⭐⭐ | Skip for now |
| **Facebook** | 10 min | Business verification | ⭐⭐⭐ | Optional |

**My recommendation**: Start with Google + GitHub. Takes 15 minutes total.

---

Ready to set it up? Let me know which option you want to go with and I can update your code!
