import { prisma } from './database/PrismaService'

/**
 * Log a collaboration activity event.
 * @param workId - The work ID
 * @param userId - The user ID of the actor
 * @param action - Action string (e.g. 'edited_section', 'deleted_section', 'created_character', etc.)
 * @param details - Arbitrary JSON-serializable details object
 */
export async function logCollaborationActivity({
  workId,
  userId,
  action,
  details = {}
}: {
  workId: string
  userId: string
  action: string
  details?: any
}) {
  try {
    await prisma.collaborationActivity.create({
      data: {
        workId,
        userId,
        action,
        details: JSON.stringify(details),
      },
    })
  } catch (err) {
    // Log but do not throw
    console.error('[collab] Failed to log collaboration activity:', err)
  }
}