// R2 Free Tier Usage Monitoring
// Track storage and operations to stay within limits

import { prisma } from '@/lib/database/PrismaService'

// Free tier limits from Cloudflare R2
const FREE_TIER_LIMITS = {
  storageGB: parseInt(process.env.FREE_TIER_STORAGE_GB || '10'),
  operationsPerMonth: parseInt(process.env.FREE_TIER_OPERATIONS || '1000000'),
  readsPerMonth: parseInt(process.env.FREE_TIER_READS || '10000000'),
}

export interface UsageStats {
  storage: {
    used: number // GB
    limit: number // GB
    percent: number
    images: number
  }
  operations: {
    count: number // This month
    limit: number
    percent: number
  }
  reads: {
    count: number // Estimated
    limit: number
    percent: number
  }
  status: 'safe' | 'warning' | 'critical'
}

/**
 * Check current free tier usage
 */
export async function checkFreeTierUsage(): Promise<UsageStats> {
  // Get total storage from all images
  const images = await prisma.image.findMany({
    select: { filesize: true },
  })

  const totalBytes = images.reduce((sum, img) => sum + img.filesize, 0)
  const totalGB = totalBytes / 1024 / 1024 / 1024

  // Get upload count this month (each upload = ~3 operations: upload + 2 variants)
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

  const operationsUsed = uploadCount * 3 // Upload + thumbnail + optimized

  // Estimate reads (each image view = 1 read, assume 10x views per upload)
  const estimatedReads = operationsUsed * 10

  // Calculate percentages
  const storagePercent = (totalGB / FREE_TIER_LIMITS.storageGB) * 100
  const operationsPercent = (operationsUsed / FREE_TIER_LIMITS.operationsPerMonth) * 100
  const readsPercent = (estimatedReads / FREE_TIER_LIMITS.readsPerMonth) * 100

  // Determine status
  let status: 'safe' | 'warning' | 'critical' = 'safe'
  const maxPercent = Math.max(storagePercent, operationsPercent)
  
  if (maxPercent > 90) {
    status = 'critical'
  } else if (maxPercent > 75) {
    status = 'warning'
  }

  return {
    storage: {
      used: totalGB,
      limit: FREE_TIER_LIMITS.storageGB,
      percent: storagePercent,
      images: images.length,
    },
    operations: {
      count: operationsUsed,
      limit: FREE_TIER_LIMITS.operationsPerMonth,
      percent: operationsPercent,
    },
    reads: {
      count: estimatedReads,
      limit: FREE_TIER_LIMITS.readsPerMonth,
      percent: readsPercent,
    },
    status,
  }
}

/**
 * Enforce free tier limits before allowing upload
 */
export async function enforceFreeTierLimit(
  entityType: string,
  estimatedSize: number // In bytes
): Promise<{ allowed: boolean; reason?: string; usage?: UsageStats }> {
  const usage = await checkFreeTierUsage()

  // Critical: Stop all uploads
  if (usage.status === 'critical') {
    return {
      allowed: false,
      reason: 'Storage limit reached. Please contact support to upgrade.',
      usage,
    }
  }

  // Check if this upload would push us over
  const sizeGB = estimatedSize / 1024 / 1024 / 1024
  if (usage.storage.used + sizeGB > FREE_TIER_LIMITS.storageGB) {
    return {
      allowed: false,
      reason: 'This upload would exceed storage limit.',
      usage,
    }
  }

  // Warning: Only allow essential uploads (profiles)
  if (usage.status === 'warning' && entityType !== 'profile') {
    return {
      allowed: false,
      reason: 'Approaching storage limit. Only profile uploads allowed.',
      usage,
    }
  }

  return { allowed: true, usage }
}

/**
 * Get breakdown by entity type
 */
export async function getStorageBreakdown(): Promise<{
  byType: Record<string, { count: number; bytes: number; percent: number }>
  total: number
}> {
  const images = await prisma.image.findMany({
    select: {
      entityType: true,
      filesize: true,
    },
  })

  const breakdown: Record<string, { count: number; bytes: number }> = {}
  let total = 0

  for (const img of images) {
    const type = img.entityType || 'unknown'
    if (!breakdown[type]) {
      breakdown[type] = { count: 0, bytes: 0 }
    }
    breakdown[type].count++
    breakdown[type].bytes += img.filesize
    total += img.filesize
  }

  // Calculate percentages
  const byType: Record<string, { count: number; bytes: number; percent: number }> = {}
  for (const [type, data] of Object.entries(breakdown)) {
    byType[type] = {
      ...data,
      percent: (data.bytes / total) * 100,
    }
  }

  return { byType, total }
}

/**
 * Cleanup old/unused images to free space
 */
export async function cleanupUnusedImages(dryRun = false): Promise<{
  deleted: number
  freedBytes: number
  images: string[]
}> {
  // Find pending images older than 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const unusedImages = await prisma.image.findMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
      uploadedFor: null, // No entity association
      status: 'pending',
    },
  })

  if (dryRun) {
    const totalBytes = unusedImages.reduce((sum, img) => sum + img.filesize, 0)
    return {
      deleted: 0,
      freedBytes: totalBytes,
      images: unusedImages.map(img => img.id),
    }
  }

  // Actually delete (implementation in API route)
  return {
    deleted: unusedImages.length,
    freedBytes: unusedImages.reduce((sum, img) => sum + img.filesize, 0),
    images: unusedImages.map(img => img.id),
  }
}

/**
 * Send alert when approaching limits
 */
export async function sendStorageAlert(usage: UsageStats): Promise<void> {
  if (usage.status !== 'safe') {
    console.warn(`[R2 Usage Alert] Status: ${usage.status}`, {
      storage: `${usage.storage.percent.toFixed(1)}%`,
      operations: `${usage.operations.percent.toFixed(1)}%`,
    })

    // TODO: Send email/notification to admin
    // await sendEmail({
    //   to: process.env.ALERT_EMAIL,
    //   subject: `R2 Storage Alert: ${usage.status}`,
    //   body: `Storage at ${usage.storage.percent}%...`
    // })
  }
}

/**
 * Daily monitoring check (run via cron)
 */
export async function dailyStorageCheck(): Promise<void> {
  const usage = await checkFreeTierUsage()
  
  console.log('[R2 Daily Check]', {
    storage: `${usage.storage.used.toFixed(2)}/${usage.storage.limit} GB (${usage.storage.percent.toFixed(1)}%)`,
    images: usage.storage.images,
    operations: `${usage.operations.count.toLocaleString()}/${usage.operations.limit.toLocaleString()} (${usage.operations.percent.toFixed(1)}%)`,
    status: usage.status,
  })

  await sendStorageAlert(usage)
}
