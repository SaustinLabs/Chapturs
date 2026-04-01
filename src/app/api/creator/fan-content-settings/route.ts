export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

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

export async function GET(request: NextRequest) {
  try {
    await ensureFanartSettingsColumns()

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get author profile
    const author = await prisma.author.findUnique({
      where: { userId: session.user.id },
      include: {
        fanContentSettings: true,
      },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author profile not found' },
        { status: 404 }
      )
    }

    // Create default settings if they don't exist
    if (!author.fanContentSettings) {
      const settings = await prisma.creatorFanContentSettings.create({
        data: {
          creatorId: author.id,
        },
      })
      return NextResponse.json({
        settings: {
          ...settings,
          autoApproveFanArt: false,
          autoConfirmProvisionalCharacters: false,
        },
      })
    }

    const fanartSettings = await prisma.$queryRaw<Array<{
      autoApproveFanArt: boolean
      autoConfirmProvisionalCharacters: boolean
    }>>`
      SELECT
        COALESCE("autoApproveFanArt", false) as "autoApproveFanArt",
        COALESCE("autoConfirmProvisionalCharacters", false) as "autoConfirmProvisionalCharacters"
      FROM creator_fan_content_settings
      WHERE "creatorId" = ${author.id}
      LIMIT 1
    `

    const automation = fanartSettings[0] || {
      autoApproveFanArt: false,
      autoConfirmProvisionalCharacters: false,
    }

    return NextResponse.json({
      settings: {
        ...author.fanContentSettings,
        ...automation,
      },
    })
  } catch (error) {
    console.error('Failed to fetch fan content settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureFanartSettingsColumns()

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      allowTier3Translations,
      allowTier3Audiobooks,
      defaultTranslationRevenueShare,
      defaultAudiobookRevenueShare,
      requireCustomDealApproval,
      autoApproveFanArt,
      autoConfirmProvisionalCharacters,
    } = body

    // Get author profile
    const author = await prisma.author.findUnique({
      where: { userId: session.user.id },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author profile not found' },
        { status: 404 }
      )
    }

    // Upsert settings
    const settings = await prisma.creatorFanContentSettings.upsert({
      where: { creatorId: author.id },
      create: {
        creatorId: author.id,
        allowTier3Translations:
          allowTier3Translations !== undefined ? allowTier3Translations : true,
        allowTier3Audiobooks:
          allowTier3Audiobooks !== undefined ? allowTier3Audiobooks : true,
        defaultTranslationRevenueShare:
          defaultTranslationRevenueShare !== undefined
            ? defaultTranslationRevenueShare
            : 0.3,
        defaultAudiobookRevenueShare:
          defaultAudiobookRevenueShare !== undefined
            ? defaultAudiobookRevenueShare
            : 0.4,
        requireCustomDealApproval:
          requireCustomDealApproval !== undefined
            ? requireCustomDealApproval
            : false,
      },
      update: {
        ...(allowTier3Translations !== undefined && { allowTier3Translations }),
        ...(allowTier3Audiobooks !== undefined && { allowTier3Audiobooks }),
        ...(defaultTranslationRevenueShare !== undefined && {
          defaultTranslationRevenueShare,
        }),
        ...(defaultAudiobookRevenueShare !== undefined && {
          defaultAudiobookRevenueShare,
        }),
        ...(requireCustomDealApproval !== undefined && {
          requireCustomDealApproval,
        }),
      },
    })

    if (
      autoApproveFanArt !== undefined ||
      autoConfirmProvisionalCharacters !== undefined
    ) {
      await prisma.$executeRaw`
        UPDATE creator_fan_content_settings
        SET
          "autoApproveFanArt" = COALESCE(${autoApproveFanArt as boolean | null}, "autoApproveFanArt"),
          "autoConfirmProvisionalCharacters" = COALESCE(${autoConfirmProvisionalCharacters as boolean | null}, "autoConfirmProvisionalCharacters")
        WHERE "creatorId" = ${author.id}
      `
    }

    const fanartSettings = await prisma.$queryRaw<Array<{
      autoApproveFanArt: boolean
      autoConfirmProvisionalCharacters: boolean
    }>>`
      SELECT
        COALESCE("autoApproveFanArt", false) as "autoApproveFanArt",
        COALESCE("autoConfirmProvisionalCharacters", false) as "autoConfirmProvisionalCharacters"
      FROM creator_fan_content_settings
      WHERE "creatorId" = ${author.id}
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        ...(fanartSettings[0] || {
          autoApproveFanArt: false,
          autoConfirmProvisionalCharacters: false,
        }),
      },
    })
  } catch (error) {
    console.error('Failed to update fan content settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
