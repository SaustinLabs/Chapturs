export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import DatabaseService from '@/lib/database/PrismaService'
import { prisma } from '@/lib/database/PrismaService'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workId } = await request.json()
    
    if (!workId) {
      return NextResponse.json({ error: 'Work ID required' }, { status: 400 })
    }

    // Toggle like
    const isLiked = await DatabaseService.toggleLike(workId, session.user.id)

    // Fire-and-forget: notify work author when a new like is added
    if (isLiked) {
      ;(async () => {
        try {
          const work = await prisma.work.findUnique({
            where: { id: workId },
            select: {
              title: true,
              author: { select: { userId: true } },
            },
          })
          if (!work || work.author.userId === session.user.id) return

          const liker = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { displayName: true, username: true },
          })
          const likerName = liker?.displayName ?? liker?.username ?? 'A reader'

          await createNotification({
            userId: work.author.userId,
            type: 'new_like',
            title: 'New like',
            message: `${likerName} liked your work "${work.title}"`,
            url: `/story/${workId}`,
          })
        } catch {}
      })()
    }
    
    return NextResponse.json({ 
      success: true, 
      liked: isLiked,
      message: isLiked ? 'Liked successfully' : 'Like removed successfully'
    })
  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json({ 
      error: 'Failed to toggle like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    
    if (!workId) {
      return NextResponse.json({ error: 'Work ID required' }, { status: 400 })
    }

    // Check like status
    const isLiked = await DatabaseService.checkUserLike(session.user.id, workId)
    
    return NextResponse.json({ 
      liked: isLiked
    })
  } catch (error) {
    console.error('Check like error:', error)
    return NextResponse.json({ 
      error: 'Failed to check like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
