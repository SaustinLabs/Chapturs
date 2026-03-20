# Vercel + PlanetScale Deployment Guide

## ✅ Build Fixed!

The Vercel build now succeeds. Changes pushed to GitHub will automatically trigger new deployments.

---

## 🗄️ PlanetScale Setup (Required Before Full Deployment)

### Step 1: Create PlanetScale Account

1. Go to [https://planetscale.com](https://planetscale.com)
2. Sign up with GitHub (free tier)
3. Click **"Create a new database"**

### Step 2: Configure Database

**Database Settings**:
- **Name**: `chapturs` (or your choice)
- **Region**: Choose closest to your users (e.g., `us-east` or `eu-west`)
- **Plan**: Start with **Hobby** (free tier)
  - 1 billion row reads/month
  - 10 million row writes/month
  - 5 GB storage
  - Perfect for launch!

### Step 3: Get Connection String

1. In PlanetScale dashboard, go to your database
2. Click **"Connect"**
3. Select **"Prisma"** from framework dropdown
4. Copy the connection string (looks like this):

```bash
DATABASE_URL="mysql://xxxx:pscale_pw_xxxx@aws.connect.psdb.cloud/chapturs?sslaccept=strict"
```

**Important**: Save this somewhere safe! PlanetScale only shows passwords once.

### Step 4: Update Prisma Schema

Your schema is already configured for MySQL! ✅

```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"  // Required for PlanetScale
}
```

---

## 🚀 Vercel Deployment

### Step 1: Environment Variables

In Vercel dashboard, add these environment variables:

**Required**:
```bash
# Database
DATABASE_URL=mysql://xxxx:pscale_pw_xxxx@aws.connect.psdb.cloud/chapturs?sslaccept=strict

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-random-secret-here  # Generate: openssl rand -base64 32

# Groq (for quality assessment)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

**Optional** (for future features):
```bash
# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cron security
CRON_SECRET=your_random_cron_secret

# Stripe (if implementing payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

### Step 2: Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

### Step 3: Push Database Schema

**From your local environment**:

```bash
# Set DATABASE_URL to PlanetScale connection string
export DATABASE_URL="mysql://xxxx:pscale_pw_xxxx@aws.connect.psdb.cloud/chapturs?sslaccept=strict"

# Push schema to PlanetScale
npx prisma db push

# Verify migration
npx prisma studio
```

You should see all your tables in Prisma Studio connected to PlanetScale!

### Step 4: Trigger Deployment

**Option A - Automatic** (Recommended):
```bash
git push origin main
```
Vercel will auto-deploy on every push to `main`.

**Option B - Manual**:
1. Go to Vercel dashboard
2. Find your project
3. Click **"Deployments"** → **"Redeploy"**

---

## 📋 Vercel Cron Setup

### Create `vercel.json`

Add this file to your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-assessments",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs the quality assessment queue processor every 5 minutes.

**Commit and push**:
```bash
git add vercel.json
git commit -m "feat: Add Vercel Cron for quality assessment processing"
git push origin main
```

---

## 🧪 Test Deployment

### 1. Check Build Status

In Vercel dashboard:
- **Building**: Yellow indicator
- **Ready**: Green checkmark ✅
- **Error**: Red X (check logs)

### 2. Test API Endpoints

```bash
# Replace with your Vercel URL
VERCEL_URL="https://your-app.vercel.app"

# Test health
curl $VERCEL_URL/api/test-db

# Test quality assessment stats
curl $VERCEL_URL/api/quality-assessment/stats
```

### 3. Test Full Workflow

1. Visit `https://your-app.vercel.app`
2. Sign in
3. Go to Creator Dashboard → Upload
4. Create test story with first chapter
5. Publish
6. Wait 5 minutes
7. Check Creator Dashboard → Manage Stories
8. See quality badge!

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Check build logs**:
1. Vercel dashboard → Deployments
2. Click failed deployment
3. View **"Build Logs"**

**Common issues**:
- Missing environment variables
- TypeScript errors
- Module not found

**Solution**: The build should now work! ✅ (We just fixed it)

### Database Connection Errors

**Error**: `P1001: Can't reach database server`

**Solutions**:
1. Verify `DATABASE_URL` in Vercel env vars
2. Check PlanetScale connection string format
3. Ensure `?sslaccept=strict` is at the end
4. Verify database isn't sleeping (Hobby plan doesn't sleep)

### Cron Not Running

**Check**:
1. `vercel.json` exists in project root
2. File is committed and pushed
3. Vercel dashboard → Settings → Crons shows your cron job

**Manually trigger**:
```bash
curl -X POST https://your-app.vercel.app/api/cron/process-assessments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Quality Assessments Not Appearing

**Check**:
1. `GROQ_API_KEY` is set in Vercel env vars
2. Queue processor is running (check Vercel cron logs)
3. Database has pending items:
   ```bash
   curl https://your-app.vercel.app/api/quality-assessment/stats
   ```

---

## 💰 Cost Breakdown

### PlanetScale (Free → Scaler)

| Plan | Price | Row Reads | Row Writes | Storage |
|------|-------|-----------|------------|---------|
| **Hobby** | $0 | 1B/mo | 10M/mo | 5 GB |
| **Scaler** | $29/mo | 100B/mo | 50M/mo | 10 GB |

**When to upgrade**: When you exceed 10M writes/month (~10-20 popular stories)

With Redis batching (future): Hobby plan supports 100+ stories

### Vercel (Free → Pro)

| Plan | Price | Bandwidth | Builds | Serverless |
|------|-------|-----------|--------|------------|
| **Hobby** | $0 | 100 GB/mo | Unlimited | 100GB-hrs |
| **Pro** | $20/mo | 1 TB/mo | Unlimited | 1000GB-hrs |

**When to upgrade**: When you exceed 100GB bandwidth/month (~100k+ monthly visitors)

### Groq (Free Forever)

- **Free Tier**: 1,000 assessments/day = 30,000/month
- **Cost**: $0.002 per assessment after free tier
- **30K assessments/mo**: ~$60/mo (only if you exceed free tier)

### Total Launch Cost

**With Free Tiers**: $0/month 🎉
- Supports: ~1,000 stories, ~50k visitors/mo, 30k assessments/mo

**When You Scale** (100+ popular stories, 500k+ visitors):
- PlanetScale Scaler: $29/mo
- Vercel Pro: $20/mo
- Groq (if needed): ~$60/mo
- **Total**: ~$110/mo

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [x] Fix Vercel build errors ✅
- [ ] Create PlanetScale account
- [ ] Create database on PlanetScale
- [ ] Get connection string
- [ ] Add environment variables to Vercel
- [ ] Push Prisma schema to PlanetScale

### Deployment
- [ ] Create `vercel.json` with cron config
- [ ] Push to GitHub (`git push origin main`)
- [ ] Wait for Vercel build (2-3 minutes)
- [ ] Check deployment status (green checkmark)

### Post-Deployment
- [ ] Test homepage loads
- [ ] Test sign in works
- [ ] Test creator upload works
- [ ] Test quality assessment (publish + wait 5 min)
- [ ] Check cron is running (Vercel dashboard)
- [ ] Monitor costs (PlanetScale + Vercel dashboards)

### Optional
- [ ] Set up custom domain (chapturs.com)
- [ ] Add Upstash Redis for write batching
- [ ] Set up Google OAuth
- [ ] Add Stripe for payments

---

## 🚀 Quick Start Commands

```bash
# 1. Set up PlanetScale connection
export DATABASE_URL="mysql://xxxx:pscale_pw_xxxx@aws.connect.psdb.cloud/chapturs?sslaccept=strict"

# 2. Push schema
npx prisma db push

# 3. Verify
npx prisma studio

# 4. Create vercel.json
cat > vercel.json << 'EOF'
{
  "crons": [
    {
      "path": "/api/cron/process-assessments",
      "schedule": "*/5 * * * *"
    }
  ]
}
EOF

# 5. Commit and deploy
git add vercel.json
git commit -m "feat: Add Vercel Cron configuration"
git push origin main

# 6. Watch Vercel deploy
# Go to: https://vercel.com/dashboard
```

---

## 📚 Resources

- **PlanetScale Docs**: [https://planetscale.com/docs](https://planetscale.com/docs)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Prisma + PlanetScale**: [https://www.prisma.io/docs/guides/database/planetscale](https://www.prisma.io/docs/guides/database/planetscale)
- **Vercel Cron Jobs**: [https://vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs)
- **Groq Console**: [https://console.groq.com](https://console.groq.com)

---

## ✅ Current Status

- ✅ **Build Fixed**: Vercel build succeeds
- ✅ **Code Pushed**: Latest changes on GitHub
- ⏳ **PlanetScale**: Needs setup
- ⏳ **Environment Variables**: Need to be added to Vercel
- ⏳ **Schema Migration**: Need to push to PlanetScale
- ⏳ **Cron Config**: Need to add vercel.json

**Next Step**: Set up PlanetScale database and get connection string!
