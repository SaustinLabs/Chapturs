type ChapterLock = {
  sectionId: string
  userId: string
  username: string
  displayName?: string | null
  acquiredAt: number
  expiresAt: number
}

const lockStore = new Map<string, ChapterLock>()

function now() {
  return Date.now()
}

function cleanupExpired(sectionId: string) {
  const existing = lockStore.get(sectionId)
  if (!existing) return
  if (existing.expiresAt <= now()) {
    lockStore.delete(sectionId)
  }
}

export function getChapterLock(sectionId: string): ChapterLock | null {
  cleanupExpired(sectionId)
  return lockStore.get(sectionId) ?? null
}

export function acquireChapterLock(input: {
  sectionId: string
  userId: string
  username: string
  displayName?: string | null
  ttlMs: number
}) {
  cleanupExpired(input.sectionId)

  const existing = lockStore.get(input.sectionId)
  const timestamp = now()

  if (existing && existing.userId !== input.userId) {
    return {
      acquired: false,
      lock: existing,
    }
  }

  const next: ChapterLock = {
    sectionId: input.sectionId,
    userId: input.userId,
    username: input.username,
    displayName: input.displayName,
    acquiredAt: existing?.acquiredAt ?? timestamp,
    expiresAt: timestamp + input.ttlMs,
  }

  lockStore.set(input.sectionId, next)

  return {
    acquired: true,
    lock: next,
  }
}

export function releaseChapterLock(sectionId: string, userId: string, force = false) {
  cleanupExpired(sectionId)

  const existing = lockStore.get(sectionId)
  if (!existing) return { released: false }

  if (!force && existing.userId !== userId) {
    return { released: false }
  }

  lockStore.delete(sectionId)
  return { released: true }
}
