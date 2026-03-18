export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

// GET /api/moderation/queue - Get moderation queue
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['moderator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'queued'
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      status: status === 'all' ? undefined : status
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    const items = await prisma.contentModerationQueue.findMany({
      where,
      include: {
        work: {
          select: {
            id: true,
            title: true,
            description: true,
            author: {
              select: {
                displayName: true,
                username: true
              }
            }
          }
        },
        section: {
          select: {
            id: true,
            title: true,
            content: true,
            wordCount: true,
            work: {
              select: {
                title: true,
                author: {
                  select: {
                    displayName: true,
                    username: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' }, // urgent > high > normal > low
        { createdAt: 'asc' }  // oldest first
      ],
      take: limit
    })

    return NextResponse.json({
      success: true,
      items,
      total: items.length
    })

  } catch (error) {
    console.error('Moderation queue fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    )
  }
}