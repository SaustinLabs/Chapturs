export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

const ALLOWED_EMOJIS = ['❤️', '🔥', '😂', '😭', '🤯']

// Emoji → UserSignal value (used to weight recommendations)
const EMOJI_SIGNAL_VALUE: Record<string, number> = {
  '❤️': 0.8,
  '🔥': 0.9,
  '😂': 0.65,
  '😭': 0.75,
  '🤯': 0.85,
}

interface RouteParams {
  params: Promise<{ id: string; sectionId: string }>
}

// GET /api/works/[id]/sections/[sectionId]/react
// Returns aggregate counts and the current user's reactions
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: workId, sectionId } = await params

  const session = await auth()
  const userId = session?.user?.id ?? null

  const [rows, userReactions] = await Promise.all([
    prisma.chapterReaction.groupBy({
      by: ['emoji'],
      where: { sectionId },
      _count: { emoji: true },
    }),
    userId
      ? prisma.chapterReaction.findMany({
          where: { sectionId, userId },
          select: { emoji: true },
        })
      : Promise.resolve([]),
  ])

  const counts: Record<string, number> = {}
  for (const row of rows) {
    counts[row.emoji] = row._count.emoji
  }

  return NextResponse.json({
    counts,
    userReactions: userReactions.map((r: { emoji: string }) => r.emoji),
  })
}

// POST /api/works/[id]/sections/[sectionId]/react
// Toggle a reaction on/off for the current user
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: workId, sectionId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const { emoji } = await req.json()
  if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
  }

  // Toggle: delete if exists, create if not
  const existing = await prisma.chapterReaction.findUnique({
    where: { userId_sectionId_emoji: { userId, sectionId, emoji } },
  })

  if (existing) {
    await prisma.chapterReaction.delete({
      where: { id: existing.id },
    })
  } else {
    await prisma.chapterReaction.create({
      data: { userId, sectionId, workId, emoji },
    })

    // Fire-and-forget: write UserSignal for recommendation engine
    prisma.userSignal.create({
      data: {
        userId,
        workId,
        signalType: 'chapter_reaction',
        value: EMOJI_SIGNAL_VALUE[emoji] ?? 0.7,
        metadata: JSON.stringify({ emoji, sectionId }),
      },
    }).catch(() => {})
  }

  // Return fresh aggregate counts
  const rows = await prisma.chapterReaction.groupBy({
    by: ['emoji'],
    where: { sectionId },
    _count: { emoji: true },
  })

  const counts: Record<string, number> = {}
  for (const row of rows) {
    counts[row.emoji] = row._count.emoji
  }

  const userReactions = await prisma.chapterReaction.findMany({
    where: { sectionId, userId },
    select: { emoji: true },
  })

  return NextResponse.json({
    counts,
    userReactions: userReactions.map((r: { emoji: string }) => r.emoji),
    toggled: !existing,
  })
}
