export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const fanArtSubmitSchema = z.object({
  characterId: z.string().optional(),
  characterName: z.string().min(1, 'Character name is required').max(120),
  imageUrl: z.string().url('Invalid image URL'),
  artistName: z.string().min(1, 'Artist name is required').max(100),
  artistLink: z.string().url('Invalid artist link').optional().or(z.literal('')),
  artistHandle: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  sectionId: z.string().optional(),
  selectedText: z.string().optional(),
})

function normalizeUsername(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalized.slice(0, 24) || 'reader'
}

async function ensureSubmissionUser(session: any): Promise<string> {
  const sessionUserId = session?.user?.id
  if (!sessionUserId) {
    throw new Error('Missing session user id')
  }

  const existingById = await prisma.user.findUnique({ where: { id: sessionUserId } })
  if (existingById) {
    return existingById.id
  }

  const email = session?.user?.email
  if (!email) {
    throw new Error('Missing session user email for fan art submission')
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } })
  if (existingByEmail) {
    return existingByEmail.id
  }

  const seed = session?.user?.name || email.split('@')[0] || 'reader'
  const baseUsername = normalizeUsername(seed)

  let username = baseUsername
  let attempt = 1
  while (attempt < 50) {
    const collision = await prisma.user.findUnique({ where: { username } })
    if (!collision) break
    attempt += 1
    username = `${baseUsername}_${attempt}`.slice(0, 30)
  }

  const created = await prisma.user.create({
    data: {
      id: sessionUserId,
      email,
      username,
      displayName: session?.user?.name || null,
      avatar: session?.user?.image || null,
    },
  })

  return created.id
}

async function ensureFanartSettingsColumns() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE creator_fan_content_settings
    ADD COLUMN IF NOT EXISTS "autoApproveFanArt" boolean NOT NULL DEFAULT false
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE creator_fan_content_settings
    ADD COLUMN IF NOT EXISTS "autoConfirmProvisionalCharacters" boolean NOT NULL DEFAULT false
  `)
}

export async function POST(request: NextRequest, props: RouteParams) {
  const params = await props.params

  try {
    await ensureFanartSettingsColumns()

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = fanArtSubmitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request payload' },
        { status: 400 }
      )
    }

    const { id: workId } = params
    const data = parsed.data
    const userId = await ensureSubmissionUser(session)

    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: {
        id: true,
        authorId: true,
        author: {
          select: {
            id: true,
          }
        }
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const creatorSettingsRows = await prisma.$queryRaw<Array<{
      autoApproveFanArt: boolean
      autoConfirmProvisionalCharacters: boolean
    }>>`
      SELECT
        COALESCE("autoApproveFanArt", false) as "autoApproveFanArt",
        COALESCE("autoConfirmProvisionalCharacters", false) as "autoConfirmProvisionalCharacters"
      FROM creator_fan_content_settings
      WHERE "creatorId" = ${work.author.id}
      LIMIT 1
    `

    const creatorSettings = creatorSettingsRows[0] || {
      autoApproveFanArt: false,
      autoConfirmProvisionalCharacters: false,
    }

    let targetCharacterId = data.characterId || ''
    let createdProvisionalCharacter = false

    if (targetCharacterId) {
      const existing = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM character_profiles
        WHERE id = ${targetCharacterId}
          AND "workId" = ${workId}
        LIMIT 1
      `

      if (existing.length === 0) {
        return NextResponse.json({ error: 'Character not found for this work' }, { status: 404 })
      }
    } else {
      const byName = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM character_profiles
        WHERE "workId" = ${workId}
          AND LOWER(name) = LOWER(${data.characterName.trim()})
        LIMIT 1
      `

      if (byName.length > 0) {
        targetCharacterId = byName[0].id
      } else {
        const metadata = {
          pendingAuthorConfirmation: !creatorSettings.autoConfirmProvisionalCharacters,
          source: 'fanart-submit-anyway',
          suggestedByUserId: userId,
          suggestedAt: new Date().toISOString(),
          fromSectionId: data.sectionId || null,
          fromSelectedText: data.selectedText || null,
        }

        const provisionalRole = creatorSettings.autoConfirmProvisionalCharacters
          ? 'supporting'
          : 'pending-confirmation'

        const provisionalGlance = creatorSettings.autoConfirmProvisionalCharacters
          ? 'Auto-created from fan art submission and auto-confirmed by creator settings.'
          : 'Auto-created from fan art submission. Author confirmation needed.'

        const createdCharacter = await prisma.$queryRaw<Array<{ id: string }>>`
          INSERT INTO character_profiles (
            id,
            "workId",
            name,
            aliases,
            role,
            "quickGlance",
            metadata,
            "allowUserSubmissions",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            gen_random_uuid()::text,
            ${workId},
            ${data.characterName.trim()},
            ${JSON.stringify([])},
            ${provisionalRole},
            ${provisionalGlance},
            ${JSON.stringify(metadata)},
            ${true},
            NOW(),
            NOW()
          )
          RETURNING id
        `

        targetCharacterId = createdCharacter[0].id
        createdProvisionalCharacter = true
      }
    }

    const submission = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO image_submissions (
        id,
        "characterId",
        "userId",
        "imageUrl",
        "artistName",
        "artistLink",
        "artistHandle",
        notes,
        status,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${targetCharacterId},
        ${userId},
        ${data.imageUrl},
        ${data.artistName.trim()},
        ${data.artistLink || null},
        ${data.artistHandle || null},
        ${data.notes || null},
        ${creatorSettings.autoApproveFanArt ? 'approved' : 'pending'},
        NOW(),
        NOW()
      )
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      submissionId: submission[0].id,
      characterId: targetCharacterId,
      provisionalCharacterCreated: createdProvisionalCharacter,
      autoApproved: creatorSettings.autoApproveFanArt,
      autoConfirmedCharacter: createdProvisionalCharacter
        ? creatorSettings.autoConfirmProvisionalCharacters
        : null,
      message: createdProvisionalCharacter
        ? creatorSettings.autoConfirmProvisionalCharacters
          ? 'Fan art submitted. Character was auto-confirmed by creator settings.'
          : 'Fan art submitted. A provisional character was created for author confirmation.'
        : creatorSettings.autoApproveFanArt
          ? 'Fan art submitted and auto-approved by creator settings.'
          : 'Fan art submitted for author review.'
    })
  } catch (error: any) {
    console.error('Fan art submit-anyway error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to submit fan art' },
      { status: 500 }
    )
  }
}
