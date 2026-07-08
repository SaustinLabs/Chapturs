export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

// DELETE /api/reading-lists/[id]/items/[itemId] — remove an item (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the item exists and belongs to a list owned by the user
    const item = await prisma.readingListItem.findUnique({
      where: { id: itemId },
      include: { readingList: { select: { userId: true } } },
    })

    if (!item || item.readingListId !== id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    if (item.readingList.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.readingListItem.delete({ where: { id: itemId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/reading-lists/[id]/items/[itemId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
