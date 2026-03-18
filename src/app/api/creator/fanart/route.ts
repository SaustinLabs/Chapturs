export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/creator/fanart - Get all fanart submissions across all creator's works
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending' // pending, approved, rejected, all

    // Get author record
    const author = await prisma.author.findFirst({
      where: { userId: session.user.id }
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    // Build status filter
    let statusFilter = ''
    if (status !== 'all') {
      statusFilter = `AND ims.status = '${status}'`
    }

    // Get all submissions for this creator's works
    const submissions = await prisma.$queryRaw`
      SELECT 
        ims.id,
        ims."imageUrl",
        ims."artistName",
        ims."artistLink",
        ims."artistHandle",
        ims.notes,
        ims.status,
        ims."submittedBy",
        ims."createdAt",
        ims."reviewedAt",
        ims."reviewedBy",
        w.id as "workId",
        w.title as "workTitle",
        cp.id as "characterId",
        cp.name as "characterName",
        u.name as "submitterName",
        u.email as "submitterEmail"
      FROM image_submissions ims
      JOIN character_profiles cp ON cp.id = ims."characterId"
      JOIN works w ON w.id = cp."workId"
      LEFT JOIN users u ON u.id = ims."submittedBy"
      WHERE w."authorId" = ${author.id}
      ${statusFilter ? prisma.$queryRawUnsafe(statusFilter) : prisma.$queryRawUnsafe('')}
      ORDER BY 
        CASE WHEN ims.status = 'pending' THEN 0 ELSE 1 END,
        ims."createdAt" DESC
    `

    // Get counts by status
    const counts = await prisma.$queryRaw<Array<{ status: string, count: number }>>`
      SELECT 
        ims.status,
        COUNT(*)::int as count
      FROM image_submissions ims
      JOIN character_profiles cp ON cp.id = ims."characterId"
      JOIN works w ON w.id = cp."workId"
      WHERE w."authorId" = ${author.id}
      GROUP BY ims.status
    `

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    }

    counts.forEach(({ status, count }) => {
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts] = count
      }
    })

    return NextResponse.json({
      success: true,
      submissions,
      counts: statusCounts,
      total: (submissions as any[]).length
    })

  } catch (error: any) {
    console.error('Fetch creator fanart error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch fanart submissions',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
