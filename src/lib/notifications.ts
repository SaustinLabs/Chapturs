import { prisma } from '@/lib/database/PrismaService'

export type NotificationType = 'new_comment' | 'new_subscriber' | 'new_chapter' | 'new_like'

export async function createNotification({
  userId,
  type,
  title,
  message,
  url,
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  url?: string
}) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, url },
    })
  } catch (err) {
    console.error('[notifications] Failed to create notification:', err)
  }
}
