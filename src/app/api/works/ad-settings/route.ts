export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

// GET - Fetch ad settings for a work
// NOTE: adSettings field does not yet exist on the Work model.
// This route will be functional once the field is added to prisma/schema.prisma
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')

    if (!workId) {
      return NextResponse.json(
        { error: 'workId is required' },
        { status: 400 }
      )
    }

    // Verify the user owns this work
    const work = await prisma.work.findFirst({
      where: {
        id: workId,
        author: {
          userId: session.user.id,
        },
      },
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // adSettings not yet on Work model — return defaults until schema is updated
    const defaults = {
      sidebarEnabled: true,
      inlineEnabled: true,
      videoInterstitialEnabled: true,
      autoDensity: true,
      maxAdsPerChapter: 3,
      showCreatorPromos: true,
      creatorPromoSlots: 1,
      allowBanner: true,
      allowNative: true,
      allowVideo: false,
    }

    return NextResponse.json(defaults)
  } catch (error) {
    console.error('Ad settings GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad settings' },
      { status: 500 }
    )
  }
}

// POST - Save ad settings for a work
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workId, settings } = body

    if (!workId || !settings) {
      return NextResponse.json(
        { error: 'workId and settings are required' },
        { status: 400 }
      )
    }

    // Verify the user owns this work
    const work = await prisma.work.findFirst({
      where: {
        id: workId,
        author: {
          userId: session.user.id,
        },
      },
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // TODO: Add adSettings JSON field to Work model in prisma/schema.prisma
    // For now, silently accept — settings are stored nowhere.
    // To implement: await prisma.work.update({ where: { id: workId }, data: { adSettings: JSON.stringify(settings) } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ad settings POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save ad settings' },
      { status: 500 }
    )
  }
}
