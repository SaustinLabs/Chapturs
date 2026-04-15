import { prisma } from '@/lib/database/PrismaService'

export type ChapterLock = {
  sectionId: string
  userId: string
  username: string
  displayName?: string | null
  acquiredAt: Date
  expiresAt: Date
}

/**
 * Get current lock for a section, cleaning up expired locks
 * @param sectionId - Section ID to check lock status
 * @returns Current lock or null if no active lock
 */
export async function getChapterLock(sectionId: string): Promise<ChapterLock | null> {
  // Fetch the lock with user info
  const lock = await prisma.sectionLock.findUnique({
    where: { sectionId },
    include: {
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
  })

  // No lock found
  if (!lock) return null

  // Lock has expired; clean it up and return null
  if (lock.expiresAt <= new Date()) {
    await prisma.sectionLock.delete({ where: { id: lock.id } }).catch(() => {})
    return null
  }

  // Return formatted lock
  return {
    sectionId: lock.sectionId,
    userId: lock.userId,
    username: lock.user.username,
    displayName: lock.user.displayName,
    acquiredAt: lock.acquiredAt,
    expiresAt: lock.expiresAt,
  }
}

/**
 * Acquire or renew a chapter lock
 * If lock is held by a different user, returns acquired: false
 * If lock is held by same user or not held, renews/creates it
 * @param input - Lock acquisition parameters
 * @returns { acquired, lock }
 */
export async function acquireChapterLock(input: {
  sectionId: string
  userId: string
  username: string
  displayName?: string | null
  ttlMs: number
}) {
  // Get existing lock
  const existing = await prisma.sectionLock.findUnique({
    where: { sectionId: input.sectionId },
    include: {
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
  })

  // Check if lock is expired
  const isExpired = existing && existing.expiresAt <= new Date()

  // Lock held by different user and not expired
  if (existing && !isExpired && existing.userId !== input.userId) {
    return {
      acquired: false,
      lock: {
        sectionId: existing.sectionId,
        userId: existing.userId,
        username: existing.user.username,
        displayName: existing.user.displayName,
        acquiredAt: existing.acquiredAt,
        expiresAt: existing.expiresAt,
      },
    }
  }

  // Create or update lock
  const expiresAt = new Date(Date.now() + input.ttlMs)

  const lock = await prisma.sectionLock.upsert({
    where: { sectionId: input.sectionId },
    create: {
      sectionId: input.sectionId,
      userId: input.userId,
      expiresAt,
    },
    update: {
      userId: input.userId,
      expiresAt,
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
  })

  return {
    acquired: true,
    lock: {
      sectionId: lock.sectionId,
      userId: lock.userId,
      username: lock.user.username,
      displayName: lock.user.displayName,
      acquiredAt: lock.acquiredAt,
      expiresAt: lock.expiresAt,
    },
  }
}

/**
 * Release a chapter lock
 * @param sectionId - Section ID
 * @param userId - User ID attempting to release
 * @param force - If true, allow any user to release the lock (admin override)
 * @returns { released: boolean }
 */
export async function releaseChapterLock(
  sectionId: string,
  userId: string,
  force = false
): Promise<{ released: boolean }> {
  const existing = await prisma.sectionLock.findUnique({
    where: { sectionId },
  })

  if (!existing) return { released: false }

  // Only the lock holder or force can release
  if (!force && existing.userId !== userId) {
    return { released: false }
  }

  await prisma.sectionLock.delete({
    where: { sectionId },
  })

  return { released: true }
}
