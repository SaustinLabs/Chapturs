/**
 * Social Media API Cache
 * 
 * Simple in-memory cache with TTL for social media API responses.
 * Helps stay under rate limits and improves performance.
 * 
 * Future: Replace with Redis for production multi-instance deployments
 */

interface CacheEntry<T = any> {
  data: T
  expiresAt: number
  lastFetch: number
}

class SocialCache {
  private cache: Map<string, CacheEntry>
  
  constructor() {
    this.cache = new Map()
  }

  /**
   * Get cached data if not expired
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cached data with TTL in milliseconds
   */
  set<T = any>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      lastFetch: Date.now()
    })
  }

  /**
   * Delete cached data
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  stats() {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    return {
      totalEntries: entries.length,
      activeEntries: entries.filter(([_, entry]) => entry.expiresAt > now).length,
      expiredEntries: entries.filter(([_, entry]) => entry.expiresAt <= now).length,
      oldestEntry: entries.reduce((oldest, [_, entry]) => 
        Math.min(oldest, entry.lastFetch), 
        now
      ),
      memoryEstimate: entries.length * 1024 // Rough estimate in bytes
    }
  }

  /**
   * Cleanup expired entries (call periodically)
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key)
        removed++
      }
    }
    
    return removed
  }
}

// Singleton instance
const socialCache = new SocialCache()

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const removed = socialCache.cleanup()
    if (removed > 0) {
    }
  }, 10 * 60 * 1000)
}

// Platform-specific TTL configurations (in milliseconds)
export const CACHE_TTL = {
  twitch: 5 * 60 * 1000,      // 5 minutes (live data changes frequently)
  discord: 5 * 60 * 1000,     // 5 minutes (member count updates)
  youtube: 60 * 60 * 1000,    // 1 hour (subscriber count changes slowly)
  twitter: 15 * 60 * 1000,    // 15 minutes (rate limit window)
} as const

export type Platform = keyof typeof CACHE_TTL

/**
 * Helper function to get cached data or fetch if missing/expired
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  const cached = socialCache.get<T>(key)
  
  if (cached !== null) {
    return cached
  }

  const data = await fetchFn()
  socialCache.set(key, data, ttlMs)
  
  return data
}

export default socialCache
