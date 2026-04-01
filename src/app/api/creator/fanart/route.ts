export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseMetadata(value: unknown): Record<string, any> {
  if (!value) return {}
  if (typeof value === 'object') return value as Record<string, any>
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return {}
}

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
        cp.metadata as "characterMetadata",
        cp."allowUserSubmissions" as "characterAllowUserSubmissions",
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

// PATCH /api/creator/fanart - confirm provisional character and optionally approve submission
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      submissionId,
      characterId,
      workId,
      action,
      characterName,
      approveSubmission,
    } = body

    if (!submissionId || !characterId || !workId || action !== 'confirm-character') {
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      )
    }

    const author = await prisma.author.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    const ownership = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT w.id
      FROM works w
      WHERE w.id = ${workId}
        AND w."authorId" = ${author.id}
      LIMIT 1
    `

    if (ownership.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized for this work' },
        { status: 403 }
      )
    }

    const characterRows = await prisma.$queryRaw<Array<{
      id: string
      name: string
      role: string | null
      metadata: any
    }>>`
      SELECT cp.id, cp.name, cp.role, cp.metadata
      FROM character_profiles cp
      WHERE cp.id = ${characterId}
        AND cp."workId" = ${workId}
      LIMIT 1
    `

    if (characterRows.length === 0) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const currentCharacter = characterRows[0]
    const parsedMetadata = parseMetadata(currentCharacter.metadata)
    const updatedMetadata = {
      ...parsedMetadata,
      pendingAuthorConfirmation: false,
      confirmedByAuthorId: author.id,
      confirmedAt: new Date().toISOString(),
      confirmationSource: 'creator-fanart-review',
    }

    const nextName = (typeof characterName === 'string' && characterName.trim())
      ? characterName.trim()
      : currentCharacter.name

    const nextRole = currentCharacter.role === 'pending-confirmation'
      ? 'supporting'
      : currentCharacter.role

    await prisma.$executeRaw`
      UPDATE character_profiles
      SET
        name = ${nextName},
        role = ${nextRole},
        metadata = ${JSON.stringify(updatedMetadata)},
        "allowUserSubmissions" = true,
        "updatedAt" = NOW()
      WHERE id = ${characterId}
    `

    if (approveSubmission) {
      await prisma.$executeRaw`
        UPDATE image_submissions
        SET
          status = 'approved',
          "reviewedAt" = NOW(),
          "reviewedBy" = ${session.user.id},
          "updatedAt" = NOW()
        WHERE id = ${submissionId}
          AND "characterId" = ${characterId}
      `
    }

    return NextResponse.json({
      success: true,
      message: approveSubmission
        ? 'Character confirmed and submission approved'
        : 'Character confirmed successfully'
    })
  } catch (error: any) {
    console.error('Patch creator fanart error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update fanart character confirmation',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
