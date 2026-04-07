import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { username?: string; genres?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { username, genres = [] } = body

  try {
    // Update username if provided
    if (username) {
      // Basic validation
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json({ error: 'Username must be 3–20 characters' }, { status: 400 })
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 })
      }
      if (/^[0-9]/.test(username)) {
        return NextResponse.json({ error: 'Username cannot start with a number' }, { status: 400 })
      }

      // Check uniqueness (exclude current user)
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { id: session.user.id } },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { username },
      })
    }

    // Save genre affinities if any genres were provided
    if (genres.length > 0) {
      // Build a genre affinity map with 0.8 as the initial score for explicit selections
      const scores: Record<string, number> = {}
      for (const genre of genres) {
        scores[genre] = 0.8
      }

      await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          genreAffinities: JSON.stringify(scores),
        },
        update: {
          genreAffinities: JSON.stringify(scores),
          lastUpdated: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true, hasSetUsername: true })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
