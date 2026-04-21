/**
 * View Counter Service with Redis Batching
 *
 * Two-tier optimization strategy:
 * 1. In-memory aggregation (60s intervals)
 * 2. Redis batching (5min flush to database)
 *
 * Reduces database writes by 95%+
 *
 * Uses raw fetch() against the Upstash REST API instead of the @upstash/redis
 * SDK — the SDK is not reliably included in Next.js standalone bundles, causing
 * silent failures. fetch() is built into Node.js 18+ with no package dependency.
 */

// ---------------------------------------------------------------------------
// Upstash REST helpers (no SDK dependency)
// ---------------------------------------------------------------------------

function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

async function redisCommand(command: string[]): Promise<unknown> {
  const cfg = getRedisConfig()
  if (!cfg) return null
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  const data = await res.json() as { result: unknown }
  return data.result
}

async function redisPipeline(commands: string[][]): Promise<void> {
  const cfg = getRedisConfig()
  if (!cfg) return
  await fetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
}

// In-memory counter (flushes every 60s)
const memoryCounters = new Map<string, number>()
let lastMemoryFlush = Date.now()

/**
 * Track a view (increments in-memory counter)
 */
export async function trackView(workId: string, sectionId?: string) {
  const key = sectionId ? `view:${workId}:${sectionId}` : `view:${workId}`
  
  // Increment in-memory
  memoryCounters.set(key, (memoryCounters.get(key) || 0) + 1)
  
  // Auto-flush to Redis every 60 seconds
  const now = Date.now()
  if (now - lastMemoryFlush > 60000) {
    await flushMemoryToRedis()
    lastMemoryFlush = now
  }
}

/**
 * Flush in-memory counters to Redis
 */
async function flushMemoryToRedis() {
  if (!getRedisConfig()) {
    // No Redis - flush directly to database (fallback)
    await flushToDatabase(memoryCounters)
    memoryCounters.clear()
    return
  }

  // Batch increment in Redis via /pipeline endpoint
  const commands: string[][] = []
  for (const [key, count] of memoryCounters.entries()) {
    commands.push(['INCRBY', key, String(count)])
    commands.push(['EXPIRE', key, '3600'])
  }

  if (commands.length === 0) return

  try {
    await redisPipeline(commands)
    memoryCounters.clear()
  } catch (error) {
    console.error('Failed to flush to Redis:', error)
    // Fallback to direct DB write
    await flushToDatabase(memoryCounters)
    memoryCounters.clear()
  }
}

/**
 * Flush Redis counters to database (called by cron every 5 min)
 */
export async function flushRedisToDatabase() {
  if (!getRedisConfig()) {
    return { processed: 0, message: 'Redis not configured' }
  }

  try {
    // Get all view counter keys
    const keys = (await redisCommand(['KEYS', 'view:*'])) as string[]

    if (!keys || keys.length === 0) {
      return { processed: 0, message: 'No pending views' }
    }

    // Get all values via pipeline
    const cfg = getRedisConfig()!
    const getCommands = keys.map(k => ['GET', k])
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(getCommands),
    })
    const results = (await res.json()) as { result: unknown }[]
    const values = results.map(r => r.result)

    // Build counter map
    const counters = new Map<string, number>()
    keys.forEach((key: string, i: number) => {
      const value = values[i]
      if (value !== null && value !== undefined) {
        const n = typeof value === 'number' ? value : parseInt(String(value), 10)
        if (!isNaN(n)) counters.set(key, n)
      }
    })

    // Flush to database
    await flushToDatabase(counters)

    // Delete processed keys
    if (counters.size > 0) {
      await redisCommand(['DEL', ...Array.from(counters.keys())])
    }

    return {
      processed: counters.size,
      totalViews: Array.from(counters.values()).reduce((a, b) => a + b, 0)
    }

  } catch (error) {
    console.error('Failed to flush Redis to database:', error)
    throw error
  }
}

/**
 * Flush counters directly to database
 */
async function flushToDatabase(counters: Map<string, number>) {
  if (counters.size === 0) return

  const { prisma } = await import('@/lib/database/PrismaService')

  // Group by work vs section
  const workUpdates: Array<{ id: string; count: number }> = []
  const sectionUpdates: Array<{ id: string; count: number }> = []

  for (const [key, count] of counters.entries()) {
    const parts = key.replace('view:', '').split(':')
    
    if (parts.length === 1) {
      // Work view: view:workId
      workUpdates.push({ id: parts[0], count })
    } else if (parts.length === 2) {
      // Section view: view:workId:sectionId
      sectionUpdates.push({ id: parts[1], count })
      // Also increment work total
      workUpdates.push({ id: parts[0], count })
    }
  }

  // Batch update works
  await Promise.all(
    workUpdates.map(({ id, count }) =>
      prisma.work.update({
        where: { id },
        data: {
          viewCount: {
            increment: count
          }
        }
      }).catch(err => {
        console.error(`Failed to update work ${id}:`, err)
      })
    )
  )

  // Batch update sections
  await Promise.all(
    sectionUpdates.map(({ id, count }) =>
      prisma.section.update({
        where: { id },
        data: {
          viewCount: {
            increment: count
          }
        }
      }).catch(err => {
        console.error(`Failed to update section ${id}:`, err)
      })
    )
  )
}

/**
 * Track reading progress (milestone-based to reduce writes)
 */
export async function trackReadingProgress(
  userId: string,
  workId: string,
  sectionId: string,
  progress: number // 0-100
) {
  // Only save at milestones: 0%, 25%, 50%, 75%, 100%
  const milestone = Math.floor(progress / 25) * 25
  
  // Check if we've already saved this milestone
  const key = `progress:${userId}:${workId}:${sectionId}`
  
  if (getRedisConfig()) {
    const lastSaved = await redisCommand(['GET', key]) as string | null
    if (lastSaved && Number(lastSaved) >= milestone) {
      return // Already saved this milestone or higher
    }
    
    // Save new milestone to Redis (SETEX key seconds value)
    await redisCommand(['SETEX', key, '3600', String(milestone)])
  }

  // Save to database (only at milestones)
  const { prisma } = await import('@/lib/database/PrismaService')
  
  // Find existing or create new
  const existing = await prisma.readingHistory.findFirst({
    where: {
      userId,
      workId,
      sectionId
    }
  })

  if (existing) {
    await prisma.readingHistory.update({
      where: { id: existing.id },
      data: {
        progress: milestone,
        lastReadAt: new Date()
      }
    })
  } else {
    await prisma.readingHistory.create({
      data: {
        userId,
        workId,
        sectionId,
        progress: milestone,
        lastReadAt: new Date()
      }
    })
  }
}

/**
 * Get current view stats (combines Redis + DB)
 */
export async function getViewStats(workId: string, sectionId?: string) {
  const { prisma } = await import('@/lib/database/PrismaService')

  // Get DB stats
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { statistics: true, viewCount: true }
  })

  let dbViews = work?.viewCount || 0
  if (dbViews === 0 && work?.statistics) {
    try {
      const stats = JSON.parse(work.statistics)
      dbViews = stats.views || 0
    } catch (e) {
      console.error('Failed to parse statistics:', e)
    }
  }

  // Get Redis pending views
  let pendingViews = 0
  if (getRedisConfig()) {
    const key = sectionId ? `view:${workId}:${sectionId}` : `view:${workId}`
    const redisCount = await redisCommand(['GET', key]) as string | null
    pendingViews = redisCount ? parseInt(redisCount, 10) || 0 : 0
  }

  // Get in-memory pending views
  const memKey = sectionId ? `view:${workId}:${sectionId}` : `view:${workId}`
  const memoryViews = memoryCounters.get(memKey) || 0

  return {
    total: dbViews + pendingViews + memoryViews,
    saved: dbViews,
    pending: pendingViews + memoryViews
  }
}

