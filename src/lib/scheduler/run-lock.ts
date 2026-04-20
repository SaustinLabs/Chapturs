import crypto from 'crypto'
import { prisma } from '@/lib/database/PrismaService'

type RunLockPayload = {
  token: string
  lockName: string
  acquiredAt: string
  expiresAt: string
}

const LOCK_KEY_PREFIX = 'scheduler_lock:'

function parsePayload(raw: string | null): RunLockPayload | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as RunLockPayload
  } catch {
    return null
  }
}

export async function acquireRunLock(
  lockName: string,
  ttlSeconds: number
): Promise<{ acquired: boolean; token?: string }> {
  const key = `${LOCK_KEY_PREFIX}${lockName}`
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000)

  const current = await prisma.siteSettings.findUnique({
    where: { key },
    select: { value: true },
  })

  const payload = parsePayload(current?.value ?? null)
  if (payload && new Date(payload.expiresAt) > now) {
    return { acquired: false }
  }

  const token = crypto.randomUUID()
  const nextPayload: RunLockPayload = {
    token,
    lockName,
    acquiredAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  await prisma.siteSettings.upsert({
    where: { key },
    create: {
      key,
      value: JSON.stringify(nextPayload),
      type: 'text',
      label: `Scheduler lock: ${lockName}`,
      description: 'System-managed lock for scheduler replay safety',
      group: 'features',
    },
    update: {
      value: JSON.stringify(nextPayload),
      type: 'text',
      label: `Scheduler lock: ${lockName}`,
      description: 'System-managed lock for scheduler replay safety',
      group: 'features',
    },
  })

  return { acquired: true, token }
}

export async function releaseRunLock(lockName: string, token: string): Promise<boolean> {
  const key = `${LOCK_KEY_PREFIX}${lockName}`
  const current = await prisma.siteSettings.findUnique({
    where: { key },
    select: { value: true },
  })

  const payload = parsePayload(current?.value ?? null)
  if (!payload || payload.token !== token) {
    return false
  }

  await prisma.siteSettings.delete({ where: { key } }).catch(() => {})
  return true
}
