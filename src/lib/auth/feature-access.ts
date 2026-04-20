import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

export type FeatureAccessUser = {
  id: string
  role: string
}

export async function getCurrentFeatureAccessUser(): Promise<FeatureAccessUser | null> {
  const session = await auth()
  const userId = session?.user?.id
  const role = (session?.user as any)?.role

  if (!userId) return null

  return {
    id: userId,
    role: typeof role === 'string' ? role : 'user',
  }
}

export async function isAdminUser(): Promise<boolean> {
  const user = await getCurrentFeatureAccessUser()
  return !!user && user.role === 'admin'
}

export async function canModerateWorkSuggestions(userId: string, workId: string): Promise<boolean> {
  const [ownerHit, collaboratorHit] = await Promise.all([
    prisma.work.findFirst({
      where: {
        id: workId,
        author: {
          userId,
        },
      },
      select: { id: true },
    }),
    prisma.workCollaborator.findFirst({
      where: {
        workId,
        userId,
        status: 'active',
        role: { in: ['owner', 'editor'] },
      },
      select: { id: true },
    }),
  ])

  return !!ownerHit || !!collaboratorHit
}

export async function canAccessWorldCouncil(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (user?.role === 'admin') return true

  const setting = await prisma.siteSettings.findUnique({
    where: { key: 'living_world_council_user_ids' },
    select: { value: true },
  })
  if (!setting?.value) return false

  try {
    const allowed = JSON.parse(setting.value)
    return Array.isArray(allowed) && allowed.includes(userId)
  } catch {
    return false
  }
}
