export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

interface RouteParams {
  params: Promise<{
    id: string
    characterId: string
  }>
}

// PUT /api/works/[id]/characters/[characterId] - Update character profile
export async function PUT(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId, characterId } = params
    const body = await request.json()
    const {
      name,
      aliases,
      role,
      firstAppearance,
      imageUrl,
      physicalDescription,
      age,
      height,
      appearanceNotes,
      backstory,
      personalityTraits,
      motivations,
      characterArc,
      developmentTimeline,
      authorNotes,
      metadata,
      currentChapter // For creating a new version if data changed
    } = body

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

    // Update character profile using raw SQL
    await prisma.$executeRaw`
      UPDATE character_profiles SET
        name = ${name},
        aliases = ${aliases ? JSON.stringify(aliases) : null},
        role = ${role || null},
        "firstAppearance" = ${firstAppearance || null},
        "imageUrl" = ${imageUrl || null},
        "physicalDescription" = ${physicalDescription || null},
        age = ${age || null},
        height = ${height || null},
        "appearanceNotes" = ${appearanceNotes || null},
        backstory = ${backstory || null},
        "personalityTraits" = ${personalityTraits ? JSON.stringify(personalityTraits) : null},
        motivations = ${motivations || null},
        "characterArc" = ${characterArc || null},
        "developmentTimeline" = ${developmentTimeline ? JSON.stringify(developmentTimeline) : null},
        "authorNotes" = ${authorNotes || null},
        metadata = ${metadata ? JSON.stringify(metadata) : null},
        "updatedAt" = NOW()
      WHERE id = ${characterId} AND "workId" = ${workId}
    `

    // If currentChapter is provided and development data changed, create a new version
    if (currentChapter && (physicalDescription || backstory || personalityTraits || motivations)) {
      await prisma.$executeRaw`
        INSERT INTO character_versions (
          id, "characterId", "physicalDescription", 
          backstory, "personalityTraits", motivations, "developmentNotes",
          "fromChapter", "createdAt"
        )
        VALUES (
          gen_random_uuid()::text, ${characterId},
          ${physicalDescription || null}, ${backstory || null},
          ${personalityTraits ? JSON.stringify(personalityTraits) : null},
          ${motivations || null},
          ${'Updated in chapter ' + currentChapter},
          ${currentChapter}, NOW()
        )
      `
    }

    // Fetch updated character
    const result = await prisma.$queryRaw`
      SELECT * FROM character_profiles
      WHERE id = ${characterId}
    ` as any[]

    return NextResponse.json({
      success: true,
      character: result[0]
    })

  } catch (error: any) {
    console.error('Character profile update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update character profile',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/works/[id]/characters/[characterId] - Remove character profile
export async function DELETE(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId, characterId } = params

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

    const dbUserId2 = await resolveDbUserId(session)
    if (work.author.userId !== dbUserId2) {
      return NextResponse.json({ error: 'Unauthorized - You do not own this work' }, { status: 403 })
    }

    // Delete character profile (cascade will handle versions and relationships)
    await prisma.$executeRaw`
      DELETE FROM character_profiles
      WHERE id = ${characterId} AND "workId" = ${workId}
    `

    return NextResponse.json({
      success: true,
      message: 'Character profile deleted successfully'
    })

  } catch (error: any) {
    console.error('Character profile deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete character profile',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
