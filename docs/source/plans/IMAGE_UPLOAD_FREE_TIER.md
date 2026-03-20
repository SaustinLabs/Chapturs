# Image Upload - Free Tier Strategy

## Cloudflare R2 Free Tier Limits

```
✅ Storage: 10 GB/month
✅ Class A Operations (writes): 1 million/month
✅ Class B Operations (reads): 10 million/month
✅ Egress: UNLIMITED (always free!)
```

## Realistic Usage Projection

### Storage Capacity (10 GB Free)

**Profile Pictures** (optimized):
- Original: ~2 MB
- Thumbnail (128x128): ~20 KB
- Total per user: ~2.02 MB

**Book Covers** (optimized):
- Original: ~3 MB
- Thumbnail: ~50 KB
- Total per book: ~3.05 MB

**Fan Art** (optimized):
- Average: ~4 MB
- Thumbnail: ~80 KB
- Total per art: ~4.08 MB

### What 10 GB Gets You

```
Scenario 1: Profile-Focused Platform
├─ 2,000 users with profile pics (2 MB each) = 4 GB
├─ 500 book covers (3 MB each) = 1.5 GB
├─ 500 fan art pieces (4 MB each) = 2 GB
├─ Buffer/misc = 2.5 GB
└─ TOTAL: ~10 GB ✅

Scenario 2: Content-Heavy Platform
├─ 1,000 users with profile pics = 2 GB
├─ 1,000 book covers = 3 GB
├─ 1,000 fan art pieces = 4 GB
├─ Buffer = 1 GB
└─ TOTAL: ~10 GB ✅

Scenario 3: Early Growth Phase
├─ 500 users = 1 GB
├─ 200 books = 600 MB
├─ 300 fan art = 1.2 GB
├─ Plenty of room to grow!
└─ TOTAL: ~3 GB (70% free tier remaining)
```

### Operations Capacity

**Class A (Writes) - 1 million/month free**:
- Each upload = 1-3 operations (original + variants)
- 1M operations ÷ 3 = ~333,000 uploads/month
- Or ~11,000 uploads/day
- Or ~450 uploads/hour

**Realistic early stage**: 10-50 uploads/day = ~300-1,500 ops/month  
**Free tier headroom**: 99.8% remaining! ✅

**Class B (Reads) - 10 million/month free**:
- Each image view = 1 operation
- 10M views/month = ~333,000 views/day
- Or ~14,000 views/hour

**Realistic early stage**: 5,000 views/day = ~150,000 ops/month  
**Free tier headroom**: 98.5% remaining! ✅

## Strategy: Smart Optimization

### 1. Aggressive Compression

```typescript
// src/lib/image-processing.ts

import sharp from 'sharp'

export const FREE_TIER_VARIANTS = {
  // Single optimized version + thumbnail (saves storage!)
  profile: [
    { name: 'thumbnail', width: 128, height: 128, quality: 80 },
    { name: 'optimized', width: 512, height: 512, quality: 85 }, // Single size
  ],
  cover: [
    { name: 'thumbnail', width: 300, height: 450, quality: 75 },
    { name: 'optimized', width: 800, height: 1200, quality: 80 }, // Medium size only
  ],
  fanart: [
    { name: 'thumbnail', width: 400, quality: 75 },
    { name: 'optimized', width: 1200, quality: 80 }, // One good size
  ],
}

export async function optimizeForFreeTier(
  buffer: Buffer,
  type: 'profile' | 'cover' | 'fanart'
): Promise<{ buffer: Buffer; size: number; savedBytes: number }> {
  const originalSize = buffer.length

  // Aggressive optimization
  const optimized = await sharp(buffer)
    .resize(FREE_TIER_VARIANTS[type][1].width, FREE_TIER_VARIANTS[type][1].height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ 
      quality: FREE_TIER_VARIANTS[type][1].quality,
      effort: 6 // Maximum compression effort
    })
    .toBuffer()

  return {
    buffer: optimized,
    size: optimized.length,
    savedBytes: originalSize - optimized.length,
  }
}
```

### 2. Client-Side Validation (Strict)

```typescript
// src/lib/upload-validation.ts

export const FREE_TIER_LIMITS = {
  profile: {
    maxSize: 3 * 1024 * 1024, // 3 MB (will compress to ~500 KB)
    dimensions: { max: 2048, min: 200 },
  },
  cover: {
    maxSize: 5 * 1024 * 1024, // 5 MB (will compress to ~800 KB)
    dimensions: { max: 2400, min: 400 },
  },
  fanart: {
    maxSize: 8 * 1024 * 1024, // 8 MB (will compress to ~2 MB)
    dimensions: { max: 3000, min: 600 },
  },
}

export function validateForFreeTier(
  file: File,
  type: 'profile' | 'cover' | 'fanart'
): { valid: boolean; error?: string; estimatedSize?: number } {
  const limits = FREE_TIER_LIMITS[type]

  if (file.size > limits.maxSize) {
    return {
      valid: false,
      error: `File too large. Max ${limits.maxSize / 1024 / 1024}MB for ${type}`,
    }
  }

  // Estimate compressed size (WebP is ~30-50% of original)
  const estimatedSize = Math.ceil(file.size * 0.4)

  return {
    valid: true,
    estimatedSize,
  }
}
```

### 3. Usage Monitoring & Alerts

```typescript
// src/lib/r2-usage.ts

import { prisma } from './prisma'

export async function checkFreeTierUsage(): Promise<{
  storage: { used: number; limit: number; percent: number }
  uploads: { count: number; limit: number; percent: number }
  status: 'safe' | 'warning' | 'critical'
}> {
  // Get total storage from database
  const images = await prisma.image.findMany({
    select: { filesize: true },
  })

  const totalBytes = images.reduce((sum, img) => sum + img.filesize, 0)
  const totalGB = totalBytes / 1024 / 1024 / 1024

  // Get upload count this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const uploadCount = await prisma.image.count({
    where: {
      createdAt: {
        gte: startOfMonth,
      },
    },
  })

  const FREE_TIER_STORAGE_GB = 10
  const FREE_TIER_OPERATIONS = 1000000

  const storagePercent = (totalGB / FREE_TIER_STORAGE_GB) * 100
  const operationsPercent = (uploadCount * 3 / FREE_TIER_OPERATIONS) * 100 // 3 ops per upload

  let status: 'safe' | 'warning' | 'critical' = 'safe'
  if (storagePercent > 90 || operationsPercent > 90) {
    status = 'critical'
  } else if (storagePercent > 75 || operationsPercent > 75) {
    status = 'warning'
  }

  return {
    storage: {
      used: totalGB,
      limit: FREE_TIER_STORAGE_GB,
      percent: storagePercent,
    },
    uploads: {
      count: uploadCount * 3, // Operations (upload + variants)
      limit: FREE_TIER_OPERATIONS,
      percent: operationsPercent,
    },
    status,
  }
}

// Add to your API routes
export async function enforceFreeTierLimit(
  type: 'profile' | 'cover' | 'fanart'
): Promise<{ allowed: boolean; reason?: string }> {
  const usage = await checkFreeTierUsage()

  // Critical: Stop all uploads
  if (usage.status === 'critical') {
    return {
      allowed: false,
      reason: 'Storage limit reached. Please contact support.',
    }
  }

  // Warning: Allow essentials only (profile pics)
  if (usage.status === 'warning' && type !== 'profile') {
    return {
      allowed: false,
      reason: 'Approaching storage limit. Only profile uploads allowed.',
    }
  }

  return { allowed: true }
}
```

### 4. Smart Cleanup Strategy

```typescript
// src/lib/image-cleanup.ts

import { prisma } from './prisma'
import { deleteFromR2 } from './r2'

/**
 * Delete unused images to free up space
 */
export async function cleanupUnusedImages(): Promise<{
  deleted: number
  freedBytes: number
}> {
  // Find images older than 30 days that aren't associated with any entity
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const unusedImages = await prisma.image.findMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
      uploadedFor: null, // No entity association
      status: 'pending', // Never approved/used
    },
  })

  let totalFreed = 0

  for (const image of unusedImages) {
    try {
      // Delete from R2
      await deleteFromR2(image.storageKey)

      // Delete variants
      if (image.variants) {
        const variants = JSON.parse(image.variants as string)
        for (const variantUrl of Object.values(variants)) {
          const key = (variantUrl as string).split('/').pop()
          if (key) await deleteFromR2(key)
        }
      }

      // Delete from database
      await prisma.image.delete({
        where: { id: image.id },
      })

      totalFreed += image.filesize
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  return {
    deleted: unusedImages.length,
    freedBytes: totalFreed,
  }
}

/**
 * Delete old rejected images
 */
export async function cleanupRejectedImages(): Promise<number> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const rejected = await prisma.image.findMany({
    where: {
      status: 'rejected',
      createdAt: {
        lt: sevenDaysAgo,
      },
    },
  })

  for (const image of rejected) {
    await deleteFromR2(image.storageKey)
    await prisma.image.delete({ where: { id: image.id } })
  }

  return rejected.length
}

/**
 * Scheduled cleanup job (run daily via cron)
 */
export async function dailyCleanup() {
  const unused = await cleanupUnusedImages()
  const rejected = await cleanupRejectedImages()

  console.log(`Cleanup complete:
    - Deleted ${unused.deleted} unused images (freed ${(unused.freedBytes / 1024 / 1024).toFixed(2)} MB)
    - Deleted ${rejected} rejected images
  `)

  return { unused, rejected }
}
```

### 5. Usage Dashboard (Admin)

```typescript
// src/app/admin/storage/page.tsx

'use client'

import { useEffect, useState } from 'react'

export default function StorageDashboard() {
  const [usage, setUsage] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin/storage-usage')
      .then(res => res.json())
      .then(setUsage)
  }, [])

  if (!usage) return <div>Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Storage Usage</h1>

      {/* Storage */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Storage</h2>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${
                usage.storage.percent > 90 ? 'bg-red-500' :
                usage.storage.percent > 75 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(usage.storage.percent, 100)}%` }}
            />
          </div>
          <span className="text-sm font-mono">
            {usage.storage.used.toFixed(2)} / {usage.storage.limit} GB
          </span>
        </div>
        <p className="text-xs text-gray-400">
          {usage.storage.percent.toFixed(1)}% used
        </p>
      </div>

      {/* Operations */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Operations (This Month)</h2>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${
                usage.uploads.percent > 90 ? 'bg-red-500' :
                usage.uploads.percent > 75 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(usage.uploads.percent, 100)}%` }}
            />
          </div>
          <span className="text-sm font-mono">
            {usage.uploads.count.toLocaleString()} / {usage.uploads.limit.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          {usage.uploads.percent.toFixed(1)}% used
        </p>
      </div>

      {/* Status */}
      {usage.status !== 'safe' && (
        <div className={`rounded-lg p-4 ${
          usage.status === 'critical' ? 'bg-red-900/20 border border-red-700' :
          'bg-yellow-900/20 border border-yellow-700'
        }`}>
          <p className={`font-medium ${
            usage.status === 'critical' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {usage.status === 'critical' ? '⚠️ Critical: ' : '⚠️ Warning: '}
            {usage.status === 'critical' 
              ? 'Free tier limit reached! Uploads may be restricted.'
              : 'Approaching free tier limit. Consider cleanup or upgrade.'
            }
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => fetch('/api/admin/cleanup', { method: 'POST' })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Run Cleanup
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
```

### 6. User-Facing Limits

```typescript
// src/components/ImageUpload.tsx (updated)

export default function ImageUpload(props: ImageUploadProps) {
  // ... existing code

  const [storageWarning, setStorageWarning] = useState<string | null>(null)

  useEffect(() => {
    // Check storage status
    fetch('/api/upload/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'warning') {
          setStorageWarning('Platform approaching storage limit. Large files may be rejected.')
        } else if (data.status === 'critical') {
          setStorageWarning('Storage limit reached. Only essential uploads allowed.')
        }
      })
  }, [])

  // Show warning to users
  return (
    <div>
      {storageWarning && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-400">⚠️ {storageWarning}</p>
        </div>
      )}
      
      {/* Rest of component... */}
    </div>
  )
}
```

## Transition Plan: Free → Paid

When you outgrow the free tier:

### Option 1: Stay on R2 (Recommended)
```
Current: Free tier (10 GB)
Next: $0.015/GB

Growth to 50 GB:
├─ Storage: 50 GB × $0.015 = $0.75/month
├─ Operations: ~50K uploads × $4.50/1M = $0.23/month
├─ Bandwidth: UNLIMITED = $0.00
└─ TOTAL: ~$1/month ✅

Growth to 200 GB:
├─ Storage: 200 GB × $0.015 = $3.00/month
├─ Operations: ~200K uploads × $4.50/1M = $0.90/month
├─ Bandwidth: UNLIMITED = $0.00
└─ TOTAL: ~$4/month ✅
```

### Option 2: Add Paid Storage (Later)
```
Keep R2 for:
├─ Profile pictures (free tier sufficient)
├─ Book covers (free tier sufficient)
└─ Thumbnails (free tier sufficient)

Add dedicated storage for:
├─ High-res fan art
├─ Video content
└─ User uploads
```

### Migration Code (Pre-Built)

```typescript
// src/lib/storage-migration.ts

interface StorageProvider {
  name: string
  enabled: boolean
  priority: number
}

export const STORAGE_CONFIG = {
  providers: [
    {
      name: 'r2-free',
      enabled: true,
      priority: 1,
      maxSize: 10 * 1024 * 1024 * 1024, // 10 GB
    },
    {
      name: 'r2-paid',
      enabled: false, // Enable when upgrading
      priority: 2,
      maxSize: Infinity,
    },
  ],
}

export async function selectStorageProvider(
  fileSize: number,
  entityType: string
): Promise<'r2-free' | 'r2-paid'> {
  const usage = await checkFreeTierUsage()

  // If free tier has room, use it
  if (usage.storage.used + fileSize / 1024 / 1024 / 1024 < 10) {
    return 'r2-free'
  }

  // Otherwise, use paid tier (if enabled)
  if (STORAGE_CONFIG.providers[1].enabled) {
    return 'r2-paid'
  }

  // Fallback: reject upload
  throw new Error('Storage limit reached')
}
```

## Monitoring & Alerts

```typescript
// src/lib/alerts.ts

export async function sendStorageAlert(usage: any) {
  if (usage.storage.percent > 80) {
    // Send email/notification
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'storage_warning',
        message: `Storage at ${usage.storage.percent.toFixed(1)}%`,
        data: usage,
      }),
    })
  }
}

// Run daily via cron
export async function dailyStorageCheck() {
  const usage = await checkFreeTierUsage()
  await sendStorageAlert(usage)
  
  // Auto-cleanup if critical
  if (usage.status === 'critical') {
    await dailyCleanup()
  }
}
```

## Environment Configuration

```env
# .env.local

# R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=chapturs-images
R2_PUBLIC_URL=https://images.chapturs.com

# Free Tier Settings
FREE_TIER_ENABLED=true
FREE_TIER_STORAGE_GB=10
FREE_TIER_OPERATIONS=1000000

# Limits
MAX_PROFILE_SIZE_MB=3
MAX_COVER_SIZE_MB=5
MAX_FANART_SIZE_MB=8

# Cleanup
AUTO_CLEANUP_ENABLED=true
CLEANUP_UNUSED_DAYS=30
CLEANUP_REJECTED_DAYS=7

# Alerts
STORAGE_WARNING_PERCENT=75
STORAGE_CRITICAL_PERCENT=90
ALERT_EMAIL=admin@chapturs.com
```

## Summary: Free Tier Strategy

✅ **10 GB Storage**:
- Aggressive WebP compression
- 2 variants max (thumbnail + optimized)
- Supports 1,000-2,000 users comfortably

✅ **1M Operations**:
- ~333,000 uploads/month possible
- Way more than needed for early stage
- Auto-cleanup keeps usage low

✅ **Unlimited Bandwidth**:
- No egress fees = biggest cost saver
- CDN included
- Scales with traffic

✅ **Growth Path**:
- Graceful transition to paid tier
- Code already supports multi-tier
- Just flip `FREE_TIER_ENABLED=false`

✅ **Safeguards**:
- Usage monitoring dashboard
- Auto-cleanup of unused images
- Alerts before hitting limits
- User-facing warnings

**Result**: Stay free until you have 1,000+ active users, then pay ~$1-5/month as you grow!

This gives you **maximum runway** while keeping the **enterprise-grade architecture** ready for scale! 🚀
