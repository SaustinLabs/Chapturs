export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

// GET /api/creator/moderation/comments - Get reported/flagged comments for creator's works
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's author profile
    const author = await prisma.author.findUnique({
      where: { userId: session.user.id }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author profile not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all works by this creator
    const works = await prisma.work.findMany({
      where: { authorId: author.id },
      select: { id: true }
    })

    const workIds = works.map((w: { id: string }) => w.id)

    if (workIds.length === 0) {
      return NextResponse.json({
        reports: [],
        total: 0
      })
    }

    // Get reported comments on these works
    const reports = await prisma.commentReport.findMany({
      where: {
        status: status === 'all' ? undefined : status,
        comment: {
          workId: {
            in: workIds
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        comment: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            work: {
              select: {
                id: true,
                title: true
              }
            },
            section: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })

    // Get counts by status
    const counts = await prisma.commentReport.groupBy({
      by: ['status'],
      where: {
        comment: {
          workId: {
            in: workIds
          }
        }
      },
      _count: true
    })

    const statusCounts = counts.reduce((acc: Record<string, number>, item: { status: string; _count: number }) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      reports,
      counts: statusCounts,
      total: reports.length
    })
  } catch (error) {
    console.error('Error fetching moderation reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
