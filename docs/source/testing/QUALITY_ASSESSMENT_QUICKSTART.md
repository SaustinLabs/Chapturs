# Quick Start Guide - Quality Assessment System

## 噫 Setup (5 minutes)

### 1. Get Groq API Key (FREE)

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up with GitHub or Google (takes 30 seconds)
3. Navigate to **API Keys**: [https://console.groq.com/keys](https://console.groq.com/keys)
4. Click **"Create API Key"**
5. Copy the key (starts with `gsk_...`)

### 2. Add to Environment

Add this line to your `.env` file:

```bash
GROQ_API_KEY=gsk_your_actual_key_here
```

**Important**: The `.env` file is already in your project root. Just add this line!

### 3. Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

### 4. Start Queue Processor (Development Only)

In a **new terminal**:

```bash
node scripts/process-queue.js
```

You should see:
```
噫 Quality Assessment Queue Processor started
   Processing every 300s
   API: http://localhost:3000
```

---

## ｧｪ Test It Out!

### Quick Test (2 minutes)

1. **Go to**: `http://localhost:3000/creator/upload`
2. **Create a test story**:
   - Title: "Test Story"
   - Genre: "Fantasy"
   - Add first chapter with 200+ words
3. **Click Publish**
4. **Wait 5 minutes** (or less - queue processor runs every 5 min)
5. **Go to**: Creator Dashboard 竊・**Manage Stories** tab
6. **See quality badge** on your story card!

### Check If It Worked

```bash
# Check queue status
curl http://localhost:3000/api/quality-assessment/stats

# Should return something like:
{
  "queue": {
    "pending": 0,
    "processing": 0,
    "completed": 1,
    "failed": 0
  },
  "assessments": {
    "total": 1,
    "byTier": {
      "exceptional": 0,
      "strong": 1,
      "developing": 0,
      "needs_work": 0
    }
  },
  "costs": {
    "totalCost": 0.002,
    "totalCalls": 1
  }
}
```

---

## 耳 What You'll See

### In Creator Dashboard 竊・Manage Stories:

**Story Card with Quality Badge**:
```
笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・
笏・ [Cover]           [82 箝疹  笏・竊・Quality score badge (gold/blue/green)
笏懌楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏､
笏・ Test Story     [Published] 笏・
笏・ Fantasy                    笏・
笏懌楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏､
笏・ 笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏・
笏・ 笏・箝・Strong Quality    笏・  笏・竊・Quality section
笏・ 笏・magic harry-potter   笏・  笏・竊・Discovery tags
笏・ 笏・"Great world-build!" 笏・  笏・竊・AI feedback
笏・ 笏・[View Full Report]   笏・  笏・
笏・ 笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏・
笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・
```

**Click the badge or "View Full Report"** to see:
- Overall Score: 82/100
- Writing Quality: 85
- Storytelling: 80
- Characterization: 78
- World-Building: 90
- Engagement: 82
- Originality: 75
- **15 Discovery Tags**: magic-academy, harry-potter-like, coming-of-age...
- **Feedback**: "Exceptional world-building with vivid descriptions..."
- **Boost**: 1.2x visibility for 30 days

---

## 識 Scoring Tiers

| Score | Tier | Badge Color | Visibility Boost |
|-------|------|-------------|------------------|
| 85-100 | 箝・Exceptional | 泯 Gold | 1.5x for 30 days |
| 70-84 | 箝・Strong | 鳩 Blue | 1.2x for 30 days |
| 50-69 | 嶋 Developing | 泙 Green | 1.0x (normal) |
| 0-49 | 笨擾ｸ・Needs Work | 笞ｪ Gray | 0.8x (reduced) |

---

## 腸 Cost Tracking

### Free Tier (Groq)
- **Limit**: 1,000 assessments per day
- **Cost**: $0 (completely free!)
- **After free tier**: ~$0.002 per assessment

### Check Your Usage

```bash
# View stats
curl http://localhost:3000/api/quality-assessment/stats

# Or use Prisma Studio
npx prisma studio
# 竊・Navigate to LLMUsageLog table
```

---

## 菅 Troubleshooting

### "Assessment not showing up"

**Check queue status**:
```bash
curl http://localhost:3000/api/quality-assessment/stats
```

If `pending > 0`: Wait for queue processor
If `failed > 0`: Check Next.js console for errors

**Manually trigger processing**:
```bash
curl -X POST http://localhost:3000/api/quality-assessment/process \
  -H "Content-Type: application/json" \
  -d '{"count":10}'
```

### "Queue processor not running"

Make sure you started it:
```bash
node scripts/process-queue.js
```

You should see logs every 5 minutes.

### "GROQ_API_KEY error"

1. Check `.env` file has the key
2. Restart dev server (`npm run dev`)
3. Verify key is valid at [https://console.groq.com/keys](https://console.groq.com/keys)

---

## 噫 Production Deployment

### Vercel (Recommended)

1. **Add environment variable** in Vercel dashboard:
   - Key: `GROQ_API_KEY`
   - Value: `gsk_your_key_here`

2. **Create `vercel.json`** in project root:
```json
{
  "crons": [{
    "path": "/api/cron/process-assessments",
    "schedule": "*/5 * * * *"
  }]
}
```

3. **Deploy**:
```bash
git push origin main
```

Vercel will automatically:
- Deploy your app
- Set up the cron job
- Process assessments every 5 minutes

**No need for manual queue processor in production!** 笨・

---

## 答 Full Documentation

- **docs/source/implementations/QUALITY_ASSESSMENT_INTEGRATION_COMPLETE.md** - Complete implementation details
- **docs/source/features/QUALITY_ASSESSMENT_SYSTEM.md** - System architecture
- **docs/source/ops/GROQ_INTEGRATION.md** - Groq API setup

---

## 笨・Checklist

- [ ] Get Groq API key from console.groq.com
- [ ] Add `GROQ_API_KEY` to `.env`
- [ ] Restart dev server (`npm run dev`)
- [ ] Start queue processor (`node scripts/process-queue.js`)
- [ ] Publish a test story
- [ ] Wait 5 minutes
- [ ] Check Creator Dashboard 竊・Manage Stories
- [ ] Click quality badge to see full assessment
- [ ] Marvel at the AI-generated tags! 脂

---

**Ready to test?** Start with step 1 above! 噫



