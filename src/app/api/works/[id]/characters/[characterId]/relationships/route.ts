export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

interface RouteParams {
  params: Promise<{
    id: string
    characterId: string
  }>
}

// POST /api/works/[id]/characters/[characterId]/relationships - Add character relationship
export async function POST(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId, characterId } = params
    const body = await request.json()
    const {
      relatedCharacterId,
      relationshipType,
      notes,
      fromChapter
    } = body

    if (!relatedCharacterId || !relationshipType) {
      return NextResponse.json(
        { error: 'Related character ID and relationship type are required' },
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
      return NextResponse.json({ error: 'Unauthorized - You do not own this work' }, { status: 403 })
    }

    // Create relationship using raw SQL
    const result = await prisma.$queryRaw`
      INSERT INTO character_relationships (
        id, "characterId", "relatedCharacterId", "relationshipType",
        notes, "fromChapter", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text, ${characterId}, ${relatedCharacterId},
        ${relationshipType}, ${notes || null}, ${fromChapter || null},
        NOW(), NOW()
      )
      RETURNING *
    ` as any[]

    return NextResponse.json({
      success: true,
      relationship: result[0]
    })

  } catch (error: any) {
    console.error('Character relationship creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create character relationship',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/works/[id]/characters/[characterId]/relationships - Get character relationships
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { characterId } = params

    // Get all relationships for this character
    const relationships = await prisma.$queryRaw`
      SELECT 
        cr.id,
        cr."characterId",
        cr."relatedCharacterId",
        cr."relationshipType",
        cr.notes,
        cr."fromChapter",
        cp.name as "relatedCharacterName",
        cp.role as "relatedCharacterRole",
        cp."imageUrl" as "relatedCharacterImage"
      FROM character_relationships cr
      JOIN character_profiles cp ON cr."relatedCharacterId" = cp.id
      WHERE cr."characterId" = ${characterId}
      ORDER BY cr."createdAt" ASC
    ` as any[]

    return NextResponse.json({
      success: true,
      relationships
    })

  } catch (error: any) {
    console.error('Character relationships fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch character relationships',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
