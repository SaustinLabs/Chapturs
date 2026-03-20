# 肌 R2 CORS Configuration - Step by Step Checklist

## 笞・・Current Issue
CORS policy is being blocked even with `AllowedOrigins: ["*"]` configured. This means either:
1. The policy isn't actually saved in R2
2. There's a syntax error in the JSON
3. R2 needs more time to propagate changes
4. Public access is disabled on the bucket

---

## 笨・Verification Steps

### Step 1: Verify CORS Policy is Saved

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **R2 Object Storage**
3. Click **`chapturs-images`** bucket
4. Click **Settings** tab
5. Scroll to **CORS Policy** section

**What you should see:**
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**If you see something different or it's empty:**
- The policy didn't save
- Try copying the JSON again and saving
- Make sure you clicked "Save" or "Update"

---

### Step 2: Enable Public Access

**CRITICAL:** R2 buckets need public access enabled for presigned URLs to work.

1. In bucket settings, look for **"Public access"** or **"R2.dev subdomain"**
2. **Enable it** if it's disabled
3. This creates a public URL like `https://pub-{ACCOUNT_ID}.r2.dev`

**Without public access:**
- Presigned URLs won't work
- CORS headers won't be sent
- You'll get 403 Forbidden errors

---

### Step 3: Wait for Propagation

R2 CORS changes can take **2-5 minutes** to propagate globally.

After saving:
1. Wait **5 full minutes**
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try in **Incognito/Private window**
4. Hard refresh (Ctrl+Shift+R)

---

### Step 4: Test CORS with curl

Open terminal and run this test:

```bash
curl -X OPTIONS \
  -H "Origin: https://chapturs.com" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type" \
  -i \
  https://chapturs-images.<R2_ACCOUNT_ID>.r2.cloudflarestorage.com/test.txt
```

**Expected response:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
Access-Control-Allow-Headers: *
Access-Control-Max-Age: 3600
```

**If you don't see `Access-Control-Allow-Origin: *`:**
- CORS policy is not active
- Policy has a syntax error
- Public access is disabled

---

### Step 5: Check R2 Bucket Permissions

1. In bucket settings, check **"Permissions"** or **"Access"** section
2. Make sure the bucket allows:
   - 笨・Read access
   - 笨・Write access (for uploads)
   - 笨・Public access

---

### Step 6: Verify JSON Syntax

The CORS policy MUST be valid JSON. Common mistakes:

笶・**Wrong:** Single quotes
```json
{
  'AllowedOrigins': ['*']
}
```

笨・**Correct:** Double quotes
```json
{
  "AllowedOrigins": ["*"]
}
```

笶・**Wrong:** Trailing comma
```json
{
  "AllowedOrigins": ["*"],
}
```

笨・**Correct:** No trailing comma
```json
{
  "AllowedOrigins": ["*"]
}
```

Use [JSONLint.com](https://jsonlint.com/) to validate your JSON before pasting.

---

## ｧｪ Alternative: Test with R2 Public URL

Instead of using presigned URLs to `*.r2.cloudflarestorage.com`, try using the **public R2.dev URL**.

Your public URL is:
```
https://pub-<R2_ACCOUNT_ID>.r2.dev
```

This URL **automatically has CORS enabled** and might bypass the issue.

To test this, we'd need to modify the code to use the public URL instead of storage endpoint.

---

## 剥 Still Not Working? Debug Info Needed

If none of the above works, please provide:

1. **Screenshot of CORS Policy** in R2 dashboard (Settings 竊・CORS Policy)
2. **Screenshot of Public Access** setting (is it enabled?)
3. **Output of the curl command** above
4. **Bucket creation date** (new buckets behave differently than old ones)

This will help identify if it's a Cloudflare R2 limitation or configuration issue.

---

## 圷 Known R2 Limitations

Some R2 CORS issues we've seen:

1. **Wildcards don't work:** `https://*.vercel.app` 竊・Use specific URLs
2. **Propagation delays:** Can take 5-10 minutes in some regions
3. **Public access required:** Must enable R2.dev subdomain
4. **Old vs new buckets:** Buckets created before 2024 may behave differently

---

## 庁 Workaround: Use R2 Public URL

If CORS on storage endpoint never works, we can switch to using the public R2.dev URL:

**Pros:**
- CORS works automatically
- Faster (CDN-backed)
- No configuration needed

**Cons:**
- Files are publicly accessible
- Can't restrict by origin

This is acceptable for uploaded images since they're meant to be public anyway.

---

**Next step:** Verify CORS policy is actually saved and public access is enabled! 識

