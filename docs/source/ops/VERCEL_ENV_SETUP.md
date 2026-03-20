# 噫 VERCEL DEPLOYMENT - Add These Environment Variables

## Push Status: 笨・COMPLETE

Your code has been pushed to GitHub! Vercel will auto-deploy, but **you need to add the R2 credentials** first.

---

## 搭 Add to Vercel Dashboard

Go to: **Vercel Dashboard 竊・Your Project 竊・Settings 竊・Environment Variables**

### Add These 8 Variables:

Copy and paste each one:

#### 1. R2_ACCOUNT_ID
```
<R2_ACCOUNT_ID>
```

#### 2. R2_ACCESS_KEY_ID
```
<R2_ACCESS_KEY_ID>
```

#### 3. R2_SECRET_ACCESS_KEY
```
<R2_SECRET_ACCESS_KEY>
```

#### 4. R2_BUCKET_NAME
```
chapturs-images
```

#### 5. R2_PUBLIC_URL
```
https://pub-<R2_ACCOUNT_ID>.r2.dev
```

#### 6. FREE_TIER_ENABLED
```
true
```

#### 7. FREE_TIER_STORAGE_GB
```
10
```

#### 8. FREE_TIER_OPERATIONS
```
1000000
```

---

## 笞・・IMPORTANT: Apply to All Environments

For each variable, make sure to check:
- 笨・**Production**
- 笨・**Preview**
- 笨・**Development**

This ensures uploads work in all deployments!

---

## 売 After Adding Variables

1. **Trigger Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**
   - 笨・Check "Use existing Build Cache"
   - Click **"Redeploy"**

2. **Wait for deployment** (~2-3 minutes)

3. **Test it:**
   - Visit: `https://your-app.vercel.app/test-upload`
   - Upload an image
   - Verify it works!

---

## 識 What to Test

Once deployed, test at: `https://your-app.vercel.app/test-upload`

1. **Upload Profile Picture** (3 MB limit)
   - Should compress to ~500 KB
   - See thumbnail + optimized versions

2. **Upload Book Cover** (5 MB limit)
   - Should compress to ~800 KB
   - Verify aspect ratio maintained

3. **Upload Fan Art** (8 MB limit)
   - Should compress to ~2 MB
   - Check compression savings displayed

4. **Check Usage Stats**
   - Click "Check Usage" button
   - Should show storage used
   - Status should be "safe"

---

## 菅 Troubleshooting

### "Failed to generate upload URL"

**Missing environment variables!**

Fix:
1. Double-check all 8 variables are added
2. Make sure they're applied to Production
3. Redeploy after adding

### "Network error" on upload

**R2 bucket needs public access**

Fix:
1. Go to Cloudflare R2 dashboard
2. Click `chapturs-images` bucket
3. Settings 竊・Public Access
4. Enable "Allow Public Access"
5. Save

### Images upload but don't display

**CORS configuration needed**

Fix:
1. In R2 bucket settings
2. Find CORS section
3. Add this policy:

```json
[
  {
    "AllowedOrigins": ["https://your-app.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace `your-app.vercel.app` with your actual domain!

---

## 笨・Success Checklist

- [ ] All 8 env vars added to Vercel
- [ ] Applied to Production, Preview, Development
- [ ] Redeployed after adding variables
- [ ] Tested `/test-upload` page
- [ ] Image uploaded successfully
- [ ] 3 URLs returned (thumbnail, optimized, original)
- [ ] Compression savings shown (~60-70%)
- [ ] Images display correctly
- [ ] Usage stats load

---

## 脂 Once Working

After verifying uploads work in production:

1. **Integrate into Profile Editor**
   - Replace URL inputs with ImageUpload component
   - Users can upload profile pictures
   - Automatic compression and optimization

2. **Monitor Usage**
   - Check R2 dashboard weekly
   - Watch for approaching 75% limit
   - Set up alerts if needed

3. **Celebrate!** 至
   - You now have enterprise-grade image uploads
   - For FREE until you have real users
   - 91% cheaper than AWS when you scale!

---

## 投 What You're Getting

**Free Tier (Current):**
- 10 GB storage
- 1M operations/month
- Unlimited bandwidth
- Supports 1,000-2,000 users
- **Cost: $0/month** 笨・

**When You Grow:**
- 50 GB: $1/month
- 200 GB: $4/month
- 500 GB: $10/month

**vs AWS S3 at 200 GB:**
- R2: $4/month
- S3: $47/month
- **You save: $43/month (91%!)**

---

**Next step: Add those 8 environment variables to Vercel and redeploy! 噫**

See you in production! 脂

