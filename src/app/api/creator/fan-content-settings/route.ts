export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ settings })
    }

    return NextResponse.json({ settings: author.fanContentSettings })
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

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Failed to update fan content settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
