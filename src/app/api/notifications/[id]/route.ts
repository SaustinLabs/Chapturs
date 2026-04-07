export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/notifications/[id] — mark a single notification as read
export async function PATCH(_req: NextRequest, props: RouteParams) {
  const { id } = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications/[id]] PATCH error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
