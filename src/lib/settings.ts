import { prisma } from '@/lib/database/PrismaService'

/**
 * Read a single SiteSettings value by key.
 * Returns null if the key doesn't exist.
 */
export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.siteSettings.findUnique({ where: { key } })
  return setting?.value ?? null
}

/**
 * Returns true when the premium_enabled SiteSettings key is 'true'.
 * Defaults to false — Stripe stays off until an admin explicitly flips the flag.
 */
export async function getPremiumEnabled(): Promise<boolean> {
  const value = await getSetting('premium_enabled')
  return value === 'true'
}
