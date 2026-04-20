export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'
import { getSectionCollaborationAccess } from '@/lib/collaborationAccess'
import { recordSectionVersion } from '@/lib/sectionVersioning'
import { publishSectionEvent } from '@/lib/realtime'

// GET /api/works/[id]/sections/[sectionId]/versions
export async function GET(
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

  const url = new URL(request.url)
  const take = Math.min(Math.max(parseInt(url.searchParams.get('take') || '20', 10) || 20, 1), 100)
  const skip = Math.max(parseInt(url.searchParams.get('skip') || '0', 10) || 0, 0)

  const where = { workId, sectionId }

  const [total, versions] = await Promise.all([
    prisma.sectionVersion.count({ where }),
    prisma.sectionVersion.findMany({
      where,
      orderBy: { versionNumber: 'desc' },
      take,
      skip,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    }),
  ])

  return NextResponse.json({
    versions,
    total,
    take,
    skip,
  })
}

// POST /api/works/[id]/sections/[sectionId]/versions
// Body: { versionId: string, summary?: string }
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
  if (!access.canPublish) {
    return NextResponse.json(
      { error: 'Only authors and publishers can restore a prior version' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const versionId = typeof body.versionId === 'string' ? body.versionId : ''
  const summary = typeof body.summary === 'string' ? body.summary : 'Restored section version'

  if (!versionId) {
    return NextResponse.json({ error: 'versionId is required' }, { status: 400 })
  }

  const targetVersion = await prisma.sectionVersion.findFirst({
    where: {
      id: versionId,
      workId,
      sectionId,
    },
  })

  if (!targetVersion) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  await prisma.section.update({
    where: { id: sectionId },
    data: {
      content: targetVersion.content,
      updatedAt: new Date(),
    },
  })

  const restoreVersion = await recordSectionVersion({
    workId,
    sectionId,
    content: targetVersion.content,
    createdById: dbUserId,
    source: 'restore',
    summary,
  })

  await publishSectionEvent(workId, sectionId, 'section.content.updated', {
    sectionId,
    updatedById: dbUserId,
    source: 'restore',
    restoredFromVersionId: versionId,
  })

  return NextResponse.json({
    success: true,
    restoredToVersionNumber: targetVersion.versionNumber,
    createdVersionNumber: restoreVersion.versionNumber,
  })
}
