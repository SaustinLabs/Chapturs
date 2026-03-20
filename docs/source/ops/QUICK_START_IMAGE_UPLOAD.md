# 噫 QUICK START: Get Images Working in 5 Minutes

## Step 1: Create Cloudflare R2 Bucket (2 min)

1. Go to **https://dash.cloudflare.com**
2. Click **R2 Object Storage** in sidebar
3. Click **Create bucket**
4. Name it: `chapturs-images`
5. Click **Create bucket**

## Step 2: Generate API Token (2 min)

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Permissions: **Object Read & Write**
4. TTL: **Forever**
5. Apply to bucket: **chapturs-images**
6. Click **Create API Token**

**笞・・COPY THESE IMMEDIATELY** (shown only once):
- Access Key ID: `abc123...`
- Secret Access Key: `xyz789...`
- Also note your Account ID from the dashboard

## Step 3: Add to .env.local (1 min)

Create or update `.env.local` in project root:

```env
# Cloudflare R2 (Image Upload)
R2_ACCOUNT_ID="YOUR_ACCOUNT_ID_HERE"
R2_ACCESS_KEY_ID="YOUR_ACCESS_KEY_HERE"
R2_SECRET_ACCESS_KEY="YOUR_SECRET_KEY_HERE"
R2_BUCKET_NAME="chapturs-images"
R2_PUBLIC_URL="https://pub-YOUR_ACCOUNT_ID.r2.dev"

# Free Tier Settings (already optimal)
FREE_TIER_ENABLED="true"
FREE_TIER_STORAGE_GB="10"
FREE_TIER_OPERATIONS="1000000"
```

**Replace:**
- `YOUR_ACCOUNT_ID_HERE` with your account ID
- `YOUR_ACCESS_KEY_HERE` with access key from step 2
- `YOUR_SECRET_KEY_HERE` with secret key from step 2

## Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Step 5: Test Upload

Open your browser console and test:

```javascript
// Create a file input
const input = document.createElement('input')
input.type = 'file'
input.accept = 'image/*'
input.onchange = async (e) => {
  const file = e.target.files[0]
  
  // 1. Request upload URL
  const req = await fetch('/api/upload/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
      entityType: 'profile',
    }),
  })
  
  const { uploadUrl, imageId, storageKey } = await req.json()
  console.log('笨・Got upload URL')
  
  // 2. Upload to R2
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  console.log('笨・Uploaded to R2')
  
  // 3. Confirm & process
  const confirm = await fetch('/api/upload/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageId,
      storageKey,
      entityType: 'profile',
    }),
  })
  
  const result = await confirm.json()
  console.log('笨・DONE!', result.image.urls)
  console.log('Thumbnail:', result.image.urls.thumbnail)
  console.log('Optimized:', result.image.urls.optimized)
}
input.click()
```

**Expected output:**
```
笨・Got upload URL
笨・Uploaded to R2
笨・DONE! {
  original: "https://pub-xxx.r2.dev/profile/2025/10/uuid.webp",
  thumbnail: "https://pub-xxx.r2.dev/profile/2025/10/uuid-thumbnail.webp",
  optimized: "https://pub-xxx.r2.dev/profile/2025/10/uuid-optimized.webp"
}
```

## Troubleshooting

### "Failed to generate upload URL"

**Check:** Did you add all 5 R2 env vars?
```bash
echo $R2_ACCOUNT_ID
echo $R2_ACCESS_KEY_ID
# etc...
```

**Fix:** Add missing vars to `.env.local` and restart server

### "Network error" on upload

**Check:** Is your bucket public?

**Fix:**
1. Go to bucket settings in R2 dashboard
2. Enable "Allow Public Access"
3. Click "Save"

### Images upload but don't appear

**Check:** Is R2_PUBLIC_URL correct?

**Fix:** Get the exact URL from R2 dashboard:
```
Settings 竊・Public Access 竊・Public Bucket URL
```

Should look like: `https://pub-abc123xyz.r2.dev`

## What's Next?

1. **Use the ImageUpload component** in your UI:
   ```tsx
   import ImageUpload from '@/components/upload/ImageUpload'
   
   <ImageUpload
     entityType="profile"
     onUploadComplete={(img) => {
       console.log('Uploaded!', img.urls.optimized)
     }}
   />
   ```

2. **Replace URL inputs** in your forms with ImageUpload

3. **Check usage** periodically:
   ```bash
   # In browser console
   const usage = await fetch('/api/upload/request').then(r => r.json())
   console.log(usage.usage)
   ```

## Free Tier Capacity

With 10 GB free:
- 笨・~2,000 profile pictures
- 笨・~500 book covers
- 笨・~500 fan art pieces
- 笨・~1,000-2,000 total users

**You won't hit the limit until you have real traction!** 脂

## Cost When You Grow

```
  50 GB: $1/month
 100 GB: $2/month
 200 GB: $4/month
 500 GB: $10/month
1000 GB: $20/month
```

**vs AWS S3 at 200 GB: $47/month** (R2 is 91% cheaper!)

---

**That's it! You now have enterprise-grade image uploads for $0/month! 噫**

See `docs/source/implementations/IMPLEMENTATION_COMPLETE.md` for full details.



