export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'
import { getSectionCollaborationAccess } from '@/lib/collaborationAccess'
import { publishSectionEvent } from '@/lib/realtime'

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value))
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed))
  }
  return null
}

// GET /api/works/[id]/sections/[sectionId]/presence
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUserId = await resolveDbUserId(session)
  const { id: workId, sectionId } = await params

  const access = await getSectionCollaborationAccess(workId, dbUserId)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const activePresence = await prisma.sectionPresence.findMany({
    where: {
      sectionId,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    presence: activePresence.map((entry) => ({
      user: entry.user,
      cursorAnchor: entry.cursorAnchor,
      cursorHead: entry.cursorHead,
      selection: entry.selection,
      updatedAt: entry.updatedAt,
      expiresAt: entry.expiresAt,
      isSelf: entry.userId === dbUserId,
    })),
  })
}

// POST /api/works/[id]/sections/[sectionId]/presence
// Body: { cursorAnchor?: number, cursorHead?: number, selection?: string, ttlSeconds?: number }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUserId = await resolveDbUserId(session)
  const { id: workId, sectionId } = await params

  const access = await getSectionCollaborationAccess(workId, dbUserId)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  const cursorAnchor = parseNumber(body.cursorAnchor)
  const cursorHead = parseNumber(body.cursorHead)
  const selection = typeof body.selection === 'string' ? body.selection : null
  const ttlSeconds = Math.min(Math.max(parseInt(String(body.ttlSeconds ?? 45), 10) || 45, 15), 120)

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  const entry = await prisma.sectionPresence.upsert({
    where: {
      sectionId_userId: {
        sectionId,
        userId: dbUserId,
      },
    },
    create: {
      sectionId,
      userId: dbUserId,
      cursorAnchor,
      cursorHead,
      selection,
      expiresAt,
    },
    update: {
      cursorAnchor,
      cursorHead,
      selection,
      expiresAt,
    },
  })

  await publishSectionEvent(workId, sectionId, 'section.presence.updated', {
    userId: dbUserId,
    sectionId,
    cursorAnchor: entry.cursorAnchor,
    cursorHead: entry.cursorHead,
    expiresAt: entry.expiresAt,
  })

  return NextResponse.json({ success: true })
}

// DELETE /api/works/[id]/sections/[sectionId]/presence
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUserId = await resolveDbUserId(session)
  const { id: workId, sectionId } = await params

  await prisma.sectionPresence.deleteMany({
    where: {
      sectionId,
      userId: dbUserId,
    },
  })

  await publishSectionEvent(workId, sectionId, 'section.presence.left', {
    userId: dbUserId,
    sectionId,
  })

  return NextResponse.json({ success: true })
}
