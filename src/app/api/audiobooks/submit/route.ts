export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'
import { uploadToR2, generateStorageKey } from '@/lib/r2'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const workId = formData.get('workId') as string
    const chapterId = formData.get('chapterId') as string
    const durationSeconds = parseInt(formData.get('durationSeconds') as string)
    const narratorNotes = formData.get('narratorNotes') as string | null
    const audioFile = formData.get('audioFile') as File

    // Validate required fields
    if (!workId || !chapterId || !durationSeconds || !audioFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if creator allows Tier 3 audiobooks
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: {
          include: {
            fanContentSettings: true,
          },
        },
      },
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const settings = work.author.fanContentSettings
    if (settings && !settings.allowTier3Audiobooks) {
      return NextResponse.json(
        { error: 'Creator does not allow Tier 3 audiobooks' },
        { status: 403 }
      )
    }

    // Upload audio file to R2
    const fileBuffer = Buffer.from(await audioFile.arrayBuffer())
    const fileExtension = audioFile.name.split('.').pop() || 'mp3'
    const storageKey = generateStorageKey(
      'audiobooks',
      `${uuidv4()}.${fileExtension}`,
      uuidv4()
    )

    const audioUrl = await uploadToR2(
      storageKey,
      fileBuffer,
      audioFile.type || 'audio/mpeg',
      {
        workId,
        chapterId,
        narratorId: session.user.id,
      }
    )

    // Create audiobook entry
    const audiobook = await prisma.fanAudiobook.create({
      data: {
        workId,
        chapterId,
        tier: 'TIER_3_PROFESSIONAL',
        narratorId: session.user.id,
        audioUrl,
        durationSeconds,
        narratorNotes,
        status: 'active',
      },
    })

    // Create Tier 3 deal if required
    if (settings?.requireCustomDealApproval) {
      await prisma.tier3Deal.create({
        data: {
          workId,
          creatorId: work.authorId,
          contributorId: session.user.id,
          contentType: 'AUDIOBOOK',
          revenueSharePercent: settings.defaultAudiobookRevenueShare,
          status: 'pending_creator',
        },
      })
    }

    return NextResponse.json({
      success: true,
      audiobook: {
        id: audiobook.id,
        tier: audiobook.tier,
        status: audiobook.status,
        audioUrl,
        message: 'Audiobook uploaded! It will appear in the menu immediately.',
      },
    })
  } catch (error) {
    console.error('Failed to submit audiobook:', error)
    return NextResponse.json(
      { error: 'Failed to submit audiobook' },
      { status: 500 }
    )
  }
}
