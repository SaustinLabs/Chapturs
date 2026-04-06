/**
 * Module-level feed state cache for instant back-navigation.
 *
 * Lives in process memory for the lifetime of the browser session.
 * Resets on hard-reload (which is intentional — users expect a fresh feed there).
 * Keyed by hubMode ('reader' | 'creator') so both hubs are tracked independently.
 */

import type { FeedItem } from '@/types'

export interface FeedSnapshot {
  items: FeedItem[]
  page: number
  hasMore: boolean
  feedFilter: 'all' | 'following'
  scrollY: number
  timestamp: number
  /** userId at time of snapshot — don't restore for a different user */
  userId: string | null
}

const store = new Map<string, FeedSnapshot>()

/** Snapshots older than this are discarded and a fresh load is done instead. */
const MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes

export function saveFeedSnapshot(hubMode: string, snapshot: FeedSnapshot): void {
  store.set(hubMode, snapshot)
}

export function getFeedSnapshot(hubMode: string, userId: string | null): FeedSnapshot | null {
  const snapshot = store.get(hubMode)
  if (!snapshot) return null
  if (snapshot.userId !== userId) return null
  if (Date.now() - snapshot.timestamp > MAX_AGE_MS) {
    store.delete(hubMode)
    return null
  }
  return snapshot
}

/** Call this when you need a guaranteed fresh load (e.g. after taste-profile onboarding). */
export function clearFeedSnapshot(hubMode: string): void {
  store.delete(hubMode)
}
