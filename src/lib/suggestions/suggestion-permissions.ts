import { prisma } from '@/lib/database/PrismaService'
import { canModerateWorkSuggestions } from '@/lib/auth/feature-access'

export type SuggestionPermissionResult = {
  allowed: boolean
  reason?: string
}

export async function canSubmitSuggestion(
  userId: string,
  workId: string,
  sectionId: string
): Promise<SuggestionPermissionResult> {
  if (!userId) {
    return { allowed: false, reason: 'Authentication required' }
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      workId: true,
      work: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  if (!section || section.workId !== workId) {
    return { allowed: false, reason: 'Section not found for this work' }
  }

  if (section.work?.status !== 'published') {
    return { allowed: false, reason: 'Suggestions are only allowed on published works' }
  }

  return { allowed: true }
}

export async function canModerateSuggestion(
  userId: string,
  workId: string
): Promise<SuggestionPermissionResult> {
  if (!userId) {
    return { allowed: false, reason: 'Authentication required' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === 'admin' || user?.role === 'moderator') {
    return { allowed: true }
  }

  const canModerate = await canModerateWorkSuggestions(userId, workId)
  if (!canModerate) {
    return { allowed: false, reason: 'Only work owners or moderators can review suggestions' }
  }

  return { allowed: true }
}

export async function canApplySuggestion(
  userId: string,
  workId: string
): Promise<SuggestionPermissionResult> {
  return canModerateSuggestion(userId, workId)
}
