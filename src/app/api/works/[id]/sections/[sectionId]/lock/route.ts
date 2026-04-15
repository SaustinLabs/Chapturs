export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'
import { acquireChapterLock, getChapterLock, releaseChapterLock } from '@/lib/chapterLockStore'

function parsePermissions(raw: string | null | undefined) {
  if (!raw) return { canEdit: false }
  try {
    const parsed = JSON.parse(raw)
    return { canEdit: !!parsed.canEdit }
  } catch {
    return { canEdit: false }
  }
}

async function canEditSection(workId: string, dbUserId: string) {
  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      author: true,
      collaborators: {
        where: {
          userId: dbUserId,
          status: 'active',
        },
        select: { permissions: true },
        take: 1,
      },
    },
  })

  if (!work) return { allowed: false, isAuthor: false }

  const isAuthor = work.author.userId === dbUserId
  if (isAuthor) return { allowed: true, isAuthor: true }

  const collaborator = work.collaborators[0]
  const perms = parsePermissions(collaborator?.permissions)

  return { allowed: perms.canEdit, isAuthor: false }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUserId = await resolveDbUserId(session)
  const { id: workId, sectionId } = await params

  const access = await canEditSection(workId, dbUserId)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const lock = getChapterLock(sectionId)
  return NextResponse.json({ lock })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUserId = await resolveDbUserId(session)
  const { id: workId, sectionId } = await params

  const access = await canEditSection(workId, dbUserId)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const ttlMs = Math.max(30_000, Math.min(10 * 60_000, Number(body?.ttlMs) || 90_000))

  const lockResult = acquireChapterLock({
    sectionId,
    userId: dbUserId,
    username: session.user.name || session.user.email || 'unknown',
    displayName: session.user.name,
    ttlMs,
  })

  if (!lockResult.acquired) {
    return NextResponse.json(
      {
        error: 'Chapter is currently being edited by another collaborator',
        lock: lockResult.lock,
      },
      { status: 423 }
    )
  }

  return NextResponse.json({ acquired: true, lock: lockResult.lock })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUserId = await resolveDbUserId(session)
  const { id: workId, sectionId } = await params

  const access = await canEditSection(workId, dbUserId)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const released = releaseChapterLock(sectionId, dbUserId, access.isAuthor)
  return NextResponse.json(released)
}
