export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { z } from 'zod'

// === CLUSTER → GENRE/FORMAT MAPPING ===
// Must stay in sync with TASTE_CLUSTERS in TasteProfileSurvey.tsx

const CLUSTER_MAP: Record<string, { genres: string[]; formatBoosts: Record<string, number> }> = {
  epic: {
    genres: ['Fantasy', 'Science Fiction', 'Dystopian', 'Supernatural', 'Alternate History', 'Mythology'],
    formatBoosts: { novel: 0.9, comic: 0.7 },
  },
  edge: {
    genres: ['Thriller', 'Mystery', 'Horror', 'Crime', 'Suspense', 'Psychological'],
    formatBoosts: { novel: 0.9, comic: 0.5 },
  },
  heart: {
    genres: ['Romance', 'Drama', 'Literary Fiction', 'Coming of Age', 'Family'],
    formatBoosts: { novel: 0.95, comic: 0.4 },
  },
  visual: {
    genres: ['Action', 'Adventure', 'Slice of Life', 'Romance', 'Fantasy'],
    formatBoosts: { comic: 0.95, novel: 0.2 },
  },
  ideas: {
    genres: ['Philosophy', 'Essays', 'Cultural Analysis', 'Opinion', 'Sociology', 'Ethics'],
    formatBoosts: { article: 0.95, novel: 0.3 },
  },
  knowledge: {
    genres: ['Science', 'History', 'Technology', 'Biography', 'Academic', 'Medicine', 'Economics'],
    formatBoosts: { article: 0.9, novel: 0.3 },
  },
  current: {
    genres: ['News', 'Politics', 'Environment', 'Business', 'Society', 'International'],
    formatBoosts: { article: 0.9 },
  },
  poetry: {
    genres: ['Poetry', 'Experimental', 'Flash Fiction', 'Lyrical Fiction', 'Prose Poetry'],
    formatBoosts: { article: 0.7, novel: 0.6 },
  },
  grounded: {
    genres: ['Historical Fiction', 'Realistic Fiction', 'Slice of Life', 'Contemporary'],
    formatBoosts: { novel: 0.85, comic: 0.4 },
  },
}

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
  clusters:  z.array(z.string()).max(9),
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

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { genreAffinities: true },
  })

  return NextResponse.json({ needsOnboarding: profile?.genreAffinities == null })
}

// POST — process survey answers and persist to UserProfile
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

  const { clusters, pace, discovery, skipped } = parsed.data

  // Build genre affinity map — highest boost wins when clusters share genres
  const genreAffinities: Record<string, number> = {}
  const formatPreferences: Record<string, number> = {}

  if (!skipped && clusters.length > 0) {
    for (const key of clusters) {
      const cluster = CLUSTER_MAP[key]
      if (!cluster) continue

      for (const genre of cluster.genres) {
        genreAffinities[genre] = Math.max(genreAffinities[genre] ?? 0, 0.8)
      }
      for (const [format, boost] of Object.entries(cluster.formatBoosts)) {
        formatPreferences[format] = Math.max(formatPreferences[format] ?? 0, boost)
      }
    }
  } else {
    // Write a sentinel so we don't show onboarding again on skip
    genreAffinities['_onboarding_skipped'] = 1
  }

  const paceSettings      = PACE_SETTINGS[pace ?? 'varied']      ?? PACE_SETTINGS.varied
  const discoverySettings = DISCOVERY_SETTINGS[discovery ?? 'mixed'] ?? DISCOVERY_SETTINGS.mixed

  await prisma.userProfile.upsert({
    where:  { userId: session.user.id },
    create: {
      userId: session.user.id,
      genreAffinities:  JSON.stringify(genreAffinities),
      formatPreferences: JSON.stringify(formatPreferences),
      ...paceSettings,
      ...discoverySettings,
      lastUpdated: new Date(),
    },
    update: {
      genreAffinities:  JSON.stringify(genreAffinities),
      formatPreferences: JSON.stringify(formatPreferences),
      ...paceSettings,
      ...discoverySettings,
      lastUpdated: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
