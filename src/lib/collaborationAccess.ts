import { prisma } from '@/lib/database/PrismaService'

export type CollaborationPermissions = {
  canEdit: boolean
  canPublish: boolean
  canInvite: boolean
  canDelete: boolean
}

export type CollaborationAccess = {
  allowed: boolean
  isAuthor: boolean
  canPublish: boolean
  canEdit: boolean
}

export function parseCollaboratorPermissions(raw: string | null | undefined): CollaborationPermissions {
  if (!raw) {
    return {
      canEdit: false,
      canPublish: false,
      canInvite: false,
      canDelete: false,
    }
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      canEdit: !!parsed.canEdit,
      canPublish: !!parsed.canPublish,
      canInvite: !!parsed.canInvite,
      canDelete: !!parsed.canDelete,
    }
  } catch {
    return {
      canEdit: false,
      canPublish: false,
      canInvite: false,
      canDelete: false,
    }
  }
}

export async function getSectionCollaborationAccess(
  workId: string,
  dbUserId: string
): Promise<CollaborationAccess> {
  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      author: { select: { userId: true } },
      collaborators: {
        where: { userId: dbUserId, status: 'active' },
        select: { permissions: true },
        take: 1,
      },
    },
  })

  if (!work) {
    return { allowed: false, isAuthor: false, canPublish: false, canEdit: false }
  }

  const isAuthor = work.author.userId === dbUserId
  if (isAuthor) {
    return { allowed: true, isAuthor: true, canPublish: true, canEdit: true }
  }

  const collaborator = work.collaborators[0]
  const permissions = parseCollaboratorPermissions(collaborator?.permissions)

  return {
    allowed: permissions.canEdit,
    isAuthor: false,
    canPublish: permissions.canPublish,
    canEdit: permissions.canEdit,
  }
}
