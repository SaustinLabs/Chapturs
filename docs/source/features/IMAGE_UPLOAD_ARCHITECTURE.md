# Image Upload System - Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     ImageUpload Component                       │    │
│  │  • File selection                                              │    │
│  │  • Preview generation                                          │    │
│  │  • Progress tracking                                           │    │
│  │  • Error handling                                              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└────────────┬─────────────────────────────────────────────┬──────────────┘
             │                                             │
             │ 1. Select File                              │ 5. Display Image
             │                                             │
             ▼                                             ▲
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LOGIC                                   │
│                                                                          │
│  1. Validate file (size, type)                                          │
│  2. Create preview (URL.createObjectURL)                                │
│  3. Request upload URL from API                                         │
│  4. Upload directly to R2                                               │
│  5. Confirm upload with API                                             │
│  6. Display final image                                                 │
│                                                                          │
└───┬─────────────────────────────────┬──────────────────────────────┬────┘
    │                                 │                              │
    │ 2. POST /api/upload/request     │ 4. PUT to presigned URL     │ 6. POST /api/upload/confirm
    │                                 │                              │
    ▼                                 ▼                              ▼
┌──────────────────────┐  ┌────────────────────────┐  ┌──────────────────────┐
│  API: Request URL    │  │   Cloudflare R2        │  │  API: Confirm Upload │
│                      │  │                        │  │                      │
│  • Auth user         │  │  • Receive file        │  │  • Save metadata     │
│  • Validate request  │  │  • Store with key      │  │  • Create DB record  │
│  • Generate file ID  │  │  • Return success      │  │  • Run moderation    │
│  • Create presigned  │  │                        │  │  • Return public URL │
│    URL               │  │  📦 Storage            │  │                      │
│  • Return URL + ID   │  │  └─ profile/           │  │  Database: Image     │
│                      │  │     └─ user123/        │  │  ├─ id              │
│                      │  │        └─ abc.jpg      │  │  ├─ storageKey      │
│                      │  │  └─ covers/            │  │  ├─ publicUrl       │
│                      │  │  └─ fanart/            │  │  ├─ uploadedBy      │
│                      │  │  └─ misc/              │  │  ├─ entityType      │
│                      │  │                        │  │  ├─ status          │
│                      │  │  🌍 Global CDN         │  │  └─ variants        │
└──────────────────────┘  └────────────────────────┘  └──────────────────────┘
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Pages                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Profile Editor  │  │   Book Editor    │  │  Fan Art     │  │
│  │                  │  │                  │  │  Submission  │  │
│  │  Uses:           │  │  Uses:           │  │              │  │
│  │  • ImageUpload   │  │  • ImageUpload   │  │  Uses:       │  │
│  │    (profile pic) │  │    (cover img)   │  │  • ImageUp.. │  │
│  │  • ImageUpload   │  │                  │  │              │  │
│  │    (cover img)   │  │                  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                  │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ All use same component
                            ▼
                  ┌─────────────────────┐
                  │   ImageUpload.tsx   │
                  │                     │
                  │  Props:             │
                  │  • entityType       │
                  │  • entityId         │
                  │  • aspectRatio      │
                  │  • maxSize          │
                  │  • onChange         │
                  │  • onDelete         │
                  └─────────────────────┘
                            │
                            │ Uses
                            ▼
              ┌──────────────────────────────┐
              │      Upload Flow Logic       │
              │                              │
              │  1. Validate → validates.ts  │
              │  2. Request → /api/request   │
              │  3. Upload  → R2 direct      │
              │  4. Confirm → /api/confirm   │
              │  5. Display → public URL     │
              └──────────────────────────────┘
```

## Data Flow

```
User Action                API/Service              Database           Storage
─────────────────────────────────────────────────────────────────────────────

1. Select File
   │
   ├─> Validate (client)
   │
   └─> Preview (local)

2. Request Upload
   │
   └─> POST /api/upload/request
       │
       ├─> Check auth ──────────> Query User
       │
       ├─> Generate ID
       │
       ├─> Create key: 
       │   profile/user123/abc.jpg
       │
       └─> Presigned URL <─────────────────> R2 SDK
           (expires in 1hr)

3. Upload File
   │
   └─> PUT https://r2.../abc.jpg ────────────────────> Store file
       (with progress)                                 in bucket

4. Confirm Upload
   │
   └─> POST /api/upload/confirm
       │
       ├─> Moderate ─────────────────────────────────> Claude API
       │   (check safety)
       │
       ├─> Generate variants ────────────────────────> Sharp
       │   (resize, optimize)                          process
       │
       ├─> Upload variants ──────────────────────────> R2 SDK
       │   (thumbnail, medium, large)
       │
       └─> Save metadata ────────> INSERT Image
           (url, size, dims)        record

5. Use Image
   │
   └─> Display from CDN ─────────────────────────────> R2 Public
       https://images.chapturs.com/...                 URL
```

## File Organization in R2

```
chapturs-images/
├─ profile/
│  ├─ user_abc123/
│  │  ├─ profile-xyz.jpg
│  │  ├─ profile-xyz-thumbnail.webp
│  │  ├─ profile-xyz-medium.webp
│  │  ├─ profile-xyz-large.webp
│  │  ├─ cover-def.jpg
│  │  └─ cover-def-large.webp
│  └─ user_def456/
│     └─ profile-ghi.jpg
│
├─ covers/
│  ├─ work_123/
│  │  ├─ cover.jpg
│  │  ├─ cover-thumbnail.webp
│  │  ├─ cover-medium.webp
│  │  └─ cover-large.webp
│  └─ work_456/
│     └─ cover.jpg
│
├─ fanart/
│  ├─ work_123/
│  │  ├─ fanart-aaa.jpg
│  │  ├─ fanart-aaa-thumbnail.webp
│  │  ├─ fanart-bbb.jpg
│  │  └─ fanart-bbb-thumbnail.webp
│  └─ work_456/
│     └─ fanart-ccc.jpg
│
├─ chapters/
│  ├─ chapter_789/
│  │  ├─ illustration-1.jpg
│  │  └─ illustration-2.jpg
│  └─ chapter_790/
│     └─ illustration-1.jpg
│
└─ misc/
   └─ user_abc123/
      └─ temp-xyz.jpg
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Checkpoints                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Client-Side Validation                                      │
│     ├─ File type check (MIME)                                   │
│     ├─ File size check (< 10MB)                                 │
│     ├─ Extension validation                                     │
│     └─ Basic preview generation                                 │
│                                                                  │
│  2. Request API Authentication                                  │
│     ├─ NextAuth session check                                   │
│     ├─ User permissions check                                   │
│     └─ Rate limiting (10/hour)                                  │
│                                                                  │
│  3. Server-Side Validation                                      │
│     ├─ Re-validate MIME type                                    │
│     ├─ Re-validate file size                                    │
│     ├─ Check entity ownership                                   │
│     └─ Sanitize filename                                        │
│                                                                  │
│  4. Upload Security                                             │
│     ├─ Presigned URL (time-limited)                             │
│     ├─ CORS restrictions                                        │
│     ├─ Content-Type enforcement                                 │
│     └─ Direct-to-R2 (no server storage)                         │
│                                                                  │
│  5. Content Moderation                                          │
│     ├─ AI moderation (Claude Vision)                            │
│     ├─ Status: pending/approved/rejected                        │
│     ├─ Manual review queue                                      │
│     └─ Auto-delete flagged content                              │
│                                                                  │
│  6. Access Control                                              │
│     ├─ Public URLs only for approved images                     │
│     ├─ Ownership verification for deletes                       │
│     ├─ Entity-based permissions                                 │
│     └─ Audit logging                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Strategy                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Upload Phase:                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  1. Client-side compression (optional)                     │ │
│  │     └─ Reduce file size before upload                      │ │
│  │                                                             │ │
│  │  2. Direct-to-R2 upload                                    │ │
│  │     └─ Bypass server, save bandwidth                       │ │
│  │                                                             │ │
│  │  3. Progress tracking                                      │ │
│  │     └─ XHR progress events                                 │ │
│  │                                                             │ │
│  │  4. Async processing                                       │ │
│  │     └─ Variants generated in background                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Delivery Phase:                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  1. Global CDN (Cloudflare)                                │ │
│  │     └─ Low latency worldwide                               │ │
│  │                                                             │ │
│  │  2. Image variants                                         │ │
│  │     ├─ Thumbnail (128x128) - Fast loading                  │ │
│  │     ├─ Medium (600x600)    - List views                    │ │
│  │     └─ Large (1200x1200)   - Detail views                  │ │
│  │                                                             │ │
│  │  3. WebP format                                            │ │
│  │     └─ 30-50% smaller than JPEG                            │ │
│  │                                                             │ │
│  │  4. Browser caching                                        │ │
│  │     └─ Cache-Control headers                               │ │
│  │                                                             │ │
│  │  5. Lazy loading                                           │ │
│  │     └─ Load images as they enter viewport                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Upload Attempt
      │
      ├─ Client Validation Failed
      │  └─> Show inline error
      │      (File too large, wrong type, etc.)
      │
      ├─ Auth Failed
      │  └─> Redirect to login
      │
      ├─ Rate Limit Exceeded
      │  └─> Show "Try again in X minutes"
      │
      ├─ Presigned URL Request Failed
      │  ├─> Retry (3 attempts)
      │  └─> Show "Server error, try again"
      │
      ├─ R2 Upload Failed
      │  ├─> Retry upload (3 attempts)
      │  ├─> Show progress: "Retrying upload..."
      │  └─> Cleanup: Delete partial upload
      │
      ├─ Confirm Failed
      │  ├─> Keep file in R2 (for recovery)
      │  ├─> Log error for admin review
      │  └─> Show "Upload succeeded but processing failed"
      │
      ├─ Moderation Rejected
      │  ├─> Delete from R2
      │  ├─> Delete from database
      │  └─> Show reason: "Image contains [reason]"
      │
      └─ Success! ✅
         └─> Show uploaded image
             Return public URL
```

## Scalability Considerations

```
Current Design (< 100K users):
├─ Single R2 bucket
├─ Direct uploads (no queuing)
├─ Sync variant generation
└─ Simple moderation

Growth Phase (100K - 1M users):
├─ Multiple R2 buckets (by region/purpose)
├─ Background job queue for variants
│  └─ Use Inngest or BullMQ
├─ Batch moderation
└─ CDN optimization (custom rules)

Scale Phase (> 1M users):
├─ Sharded storage
├─ Dedicated image processing service
├─ ML-based moderation
├─ Advanced caching strategies
└─ Multi-CDN setup
```

## Monitoring Dashboard

```
Key Metrics to Track:

Upload Success Rate:
├─ Total uploads attempted
├─ Successful uploads
├─ Failed uploads (by reason)
└─ Average upload time

Storage Usage:
├─ Total storage (GB)
├─ Storage by entity type
├─ Growth rate
└─ Cost projection

Performance:
├─ Average upload time
├─ P95 upload time
├─ CDN hit rate
└─ Image load times

Moderation:
├─ Pending review count
├─ Rejection rate
├─ False positive rate
└─ Average review time

User Experience:
├─ Error rate by error type
├─ Retry success rate
├─ Mobile vs desktop uploads
└─ User feedback/complaints
```

## Cost Breakdown

```
Cloudflare R2 Pricing (monthly):

Storage: $0.015/GB
├─ 100 GB  = $1.50
├─ 500 GB  = $7.50
├─ 1 TB    = $15.00
└─ 10 TB   = $150.00

Operations (Class A - writes):
├─ $4.50 per million
├─ 10K uploads  = $0.05
├─ 100K uploads = $0.45
└─ 1M uploads   = $4.50

Operations (Class B - reads):
├─ $0.36 per million
├─ 100K views  = $0.04
├─ 1M views    = $0.36
└─ 10M views   = $3.60

Egress: $0 (FREE!)
├─ 1 GB   = $0
├─ 100 GB = $0
└─ 10 TB  = $0 (This is HUGE!)

Example Monthly Cost:
├─ Storage: 200GB           = $3.00
├─ Uploads: 50K/month       = $0.23
├─ Views: 5M/month          = $1.80
├─ Bandwidth: 500GB/month   = $0.00
└─ TOTAL                    = $5.03/month

Compare AWS S3 + CloudFront:
├─ Storage: 200GB           = $4.60
├─ Uploads: 50K             = $0.25
├─ Views: 5M                = $2.00
├─ Bandwidth: 500GB         = $40.00 ⚠️
└─ TOTAL                    = $46.85/month

Savings: $41.82/month or 89% cheaper! 💰
```

This architecture is designed to be:
- ✅ Secure (multi-layer validation)
- ✅ Scalable (handles millions of images)
- ✅ Cost-effective (R2 zero egress fees)
- ✅ Fast (direct uploads, CDN delivery)
- ✅ Reliable (error handling, retries)
- ✅ Maintainable (clean separation of concerns)
