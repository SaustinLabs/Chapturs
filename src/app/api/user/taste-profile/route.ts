export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { z } from 'zod'

const PACE_SETTINGS: Record<string, { qualityPreference: number; freshnessPreference: number }> = {
  deep:    { qualityPreference: 0.75, freshnessPreference: 0.25 },
  varied:  { qualityPreference: 0.6,  freshnessPreference: 0.5  },
  snack:   { qualityPreference: 0.5,  freshnessPreference: 0.8  },
}

const DISCOVERY_SETTINGS: Record<string, { diversityPreference: number }> = {
  familiar:    { diversityPreference: 0.15 },
  mixed:       { diversityPreference: 0.45 },
  adventurous: { diversityPreference: 0.8  },
}

const tasteProfileSchema = z.object({
  // Primary signal: IDs of works the user picked from the content card grid
  selectedWorkIds: z.array(z.string()).max(100).optional(),
  pace:      z.enum(['deep', 'varied', 'snack']).nullable().optional(),
  discovery: z.enum(['familiar', 'mixed', 'adventurous']).nullable().optional(),
  skipped:   z.boolean().optional(),
})

// GET — check whether this user still needs onboarding
export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ needsOnboarding: false })
  }

  // Don't trigger the survey until there are at least a few published works for
  // the content picker to offer meaningful genre variety.
  const workCount = await prisma.work.count({
    where: { status: { in: ['published', 'ongoing', 'completed'] } },
  })
  if (workCount < 3) {
    return NextResponse.json({ needsOnboarding: false })
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { genreAffinities: true },
  })

  return NextResponse.json({ needsOnboarding: profile?.genreAffinities == null })
}

// POST — process survey and persist genre affinities to UserProfile
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = tasteProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { selectedWorkIds, pace, discovery, skipped } = parsed.data

  const genreAffinities: Record<string, number> = {}
  const formatPreferences: Record<string, number> = {}

  if (!skipped && selectedWorkIds && selectedWorkIds.length > 0) {
    // Fetch the actual works the user picked and aggregate their genre/format tags
    const works = await prisma.work.findMany({
      where: { id: { in: selectedWorkIds } },
      select: { genres: true, formatType: true },
    })

    const genreCounter = new Map<string, number>()
    const formatCounter = new Map<string, number>()

    for (const work of works) {
      let genres: string[] = []
      try { genres = JSON.parse((work as any).genres || '[]') } catch { /* skip */ }
      for (const g of genres) genreCounter.set(g, (genreCounter.get(g) ?? 0) + 1)
      formatCounter.set(work.formatType, (formatCounter.get(work.formatType) ?? 0) + 1)
    }

    // Score 0.4–1.0: works that appear in more selected items score higher
    const maxGenre  = Math.max(...genreCounter.values(),  1)
    const maxFormat = Math.max(...formatCounter.values(), 1)

    for (const [genre,  n] of genreCounter)  genreAffinities[genre]    = 0.4 + (n / maxGenre)  * 0.6
    for (const [format, n] of formatCounter) formatPreferences[format]  = 0.4 + (n / maxFormat) * 0.6
  } else {
    // Skipped or nothing selected — write sentinel so we don't show again
    genreAffinities['_onboarding_skipped'] = 1
  }

  const paceSettings      = PACE_SETTINGS[pace      ?? 'varied'] ?? PACE_SETTINGS.varied
  const discoverySettings = DISCOVERY_SETTINGS[discovery ?? 'mixed'] ?? DISCOVERY_SETTINGS.mixed

  try {
    await prisma.userProfile.upsert({
      where:  { userId: session.user.id },
      create: {
        userId:            session.user.id,
        genreAffinities:   JSON.stringify(genreAffinities),
        formatPreferences: JSON.stringify(formatPreferences),
        ...paceSettings,
        ...discoverySettings,
        lastUpdated: new Date(),
      },
      update: {
        genreAffinities:   JSON.stringify(genreAffinities),
        formatPreferences: JSON.stringify(formatPreferences),
        ...paceSettings,
        ...discoverySettings,
        lastUpdated: new Date(),
      },
    })
  } catch (err) {
    console.error('taste-profile upsert failed — userId:', session.user.id, err)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

