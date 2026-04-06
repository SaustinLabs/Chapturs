/**
 * Resolves the canonical database user ID from a NextAuth session.
 *
 * NextAuth can generate a new `user.id` on every OAuth sign-in cycle, but the
 * signIn callback upserts by email — leaving the DB record's original ID
 * unchanged.  As a result `session.user.id` can differ from the DB `id`.
 *
 * This helper looks the user up by email (when available) so every author-
 * ownership check uses the real DB ID rather than the stale JWT sub.
 */
import { prisma } from '@/lib/database/PrismaService'

export async function resolveDbUserId(session: { user: { id: string; email?: string | null } }): Promise<string> {
  if (session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (dbUser) return dbUser.id
  }
  return session.user.id
}
