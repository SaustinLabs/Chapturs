export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
    characterId: string
  }>
}

// Validation schema for image submissions
const imageSubmissionSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  artistName: z.string().min(1, 'Artist name is required').max(100, 'Artist name too long'),
  artistLink: z.string().url('Invalid URL').optional(),
  artistHandle: z.string().max(50, 'Handle too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional()
})

// POST /api/works/[id]/characters/[characterId]/submissions - Submit fanart
export async function POST(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId, characterId } = params
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = imageSubmissionSchema.parse(body)

    // Check if character exists and allows submissions
    const character = await prisma.$queryRaw`
      SELECT 
        cp.id, 
        cp."allowUserSubmissions",
        cp."workId"
      FROM character_profiles cp
      WHERE cp.id = ${characterId} AND cp."workId" = ${workId}
    ` as any[]

    if (character.length === 0) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    if (!character[0].allowUserSubmissions) {
      return NextResponse.json(
        { error: 'This character does not accept user submissions' },
        { status: 403 }
      )
    }

    // Create image submission
    const result = await prisma.$queryRaw`
      INSERT INTO image_submissions (
        id, "characterId", "userId", "imageUrl", "artistName",
        "artistLink", "artistHandle", notes, status,
        "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text, ${characterId}, ${session.user.id},
        ${validatedData.imageUrl}, ${validatedData.artistName},
        ${validatedData.artistLink || null}, ${validatedData.artistHandle || null},
        ${validatedData.notes || null}, 'pending',
        NOW(), NOW()
      )
      RETURNING *
    ` as any[]

    return NextResponse.json({
      success: true,
      submission: result[0]
    })

  } catch (error: any) {
    console.error('Image submission error:', error)
    
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to submit image',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/works/[id]/characters/[characterId]/submissions - Get submissions (for creator review)
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId, characterId } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // all, pending, approved, rejected

    // Verify user owns this work (for viewing pending submissions)
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { 
        authorId: true,
        author: {
          select: { userId: true }
        }
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const isCreator = work.author.userId === session.user.id

    // Build status filter
    let statusFilter = ''
    if (status !== 'all') {
      if (!isCreator && status === 'pending') {
        // Regular users can't see pending submissions
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      statusFilter = `AND ims.status = '${status}'`
    } else if (!isCreator) {
      // Regular users only see approved submissions
      statusFilter = `AND ims.status = 'approved'`
    }

    const submissions = await prisma.$queryRaw`
      SELECT 
        ims.id,
        ims."characterId",
        ims."userId",
        ims."imageUrl",
        ims."artistName",
        ims."artistLink",
        ims."artistHandle",
        ims.notes,
        ims.status,
        ims."reviewedAt",
        ims."reviewedBy",
        ims."createdAt",
        u.username as "submitterUsername",
        u."displayName" as "submitterDisplayName"
      FROM image_submissions ims
      JOIN users u ON u.id = ims."userId"
      WHERE ims."characterId" = ${characterId}
      ${statusFilter !== '' ? prisma.$queryRawUnsafe(statusFilter) : prisma.$queryRawUnsafe('')}
      ORDER BY ims."createdAt" DESC
    ` as any[]

    return NextResponse.json({
      success: true,
      submissions
    })

  } catch (error: any) {
    console.error('Fetch submissions error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch submissions',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PATCH /api/works/[id]/characters/[characterId]/submissions/[submissionId] - Approve/reject submission
export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId, characterId } = params
    const body = await request.json()
    const { submissionId, action } = body // action: 'approve' or 'reject'

    if (!submissionId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide submissionId and action (approve/reject)' },
        { status: 400 }
      )
    }

    // Verify user owns this work
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { 
        authorId: true,
        author: {
          select: { userId: true }
        }
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const dbUserId = await resolveDbUserId(session)
    if (work.author.userId !== dbUserId) {
      return NextResponse.json({ error: 'Unauthorized - Only creator can review submissions' }, { status: 403 })
    }

    // Update submission status
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const result = await prisma.$executeRaw`
      UPDATE image_submissions
      SET status = ${newStatus},
          "reviewedAt" = NOW(),
          "reviewedBy" = ${session.user.id},
          "updatedAt" = NOW()
      WHERE id = ${submissionId} AND "characterId" = ${characterId}
    `

    if (result === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Submission ${action}d successfully`
    })

  } catch (error: any) {
    console.error('Review submission error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to review submission',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
