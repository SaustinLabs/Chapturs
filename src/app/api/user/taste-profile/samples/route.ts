export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

export interface SampleWork {
  id: string
  title: string
  coverImage: string | null
  genres: string[]
  formatType: string
  authorName: string
}

/**
 * Returns a diverse set of published works to populate the taste-profile picker.
 * Strategy: fetch 60 recent published works, then apply a genre-diversity pass
 * (max 3 per primary genre) to give a representative 24-card sample.
 */
export async function GET() {
  try {
    const raw = await prisma.work.findMany({
      where: { status: { in: ['published', 'ongoing', 'completed'] } },
      select: {
        id: true,
        title: true,
        coverImage: true,
        genres: true,
        formatType: true,
        author: {
          select: {
            user: { select: { displayName: true, username: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 60,
    })

    const parsed: SampleWork[] = raw.map((w: typeof raw[number]) => ({
      id: w.id,
      title: w.title,
      coverImage: w.coverImage ?? null,
      genres: (() => {
        try { return JSON.parse((w as any).genres || '[]') } catch { return [] }
      })(),
      formatType: w.formatType,
      authorName:
        w.author?.user?.displayName ||
        w.author?.user?.username ||
        'Unknown',
    }))

    // Genre-diversity pass: max 3 per primary genre, target 24 total
    const genreCount = new Map<string, number>()
    const selected: SampleWork[] = []
    const MAX_PER_GENRE = 3
    const TOTAL = 24

    for (const work of parsed) {
      if (selected.length >= TOTAL) break
      const primary = work.genres[0] || '_other'
      const n = genreCount.get(primary) ?? 0
      if (n < MAX_PER_GENRE) {
        selected.push(work)
        genreCount.set(primary, n + 1)
      }
    }

    // Back-fill any remaining slots without genre constraint
    if (selected.length < TOTAL) {
      const taken = new Set(selected.map(w => w.id))
      for (const work of parsed) {
        if (selected.length >= TOTAL) break
        if (!taken.has(work.id)) { selected.push(work); taken.add(work.id) }
      }
    }

    // Shuffle so repeated visits feel fresh (Fisher-Yates)
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[selected[i], selected[j]] = [selected[j], selected[i]]
    }

    return NextResponse.json({ works: selected })
  } catch (error) {
    console.error('Failed to fetch taste-profile samples:', error)
    return NextResponse.json({ works: [] })
  }
}
