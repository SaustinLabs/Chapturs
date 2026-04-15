export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

function parsePermissions(raw: string | null | undefined) {
  if (!raw) return { canEdit: false, canPublish: false }
  try {
    return JSON.parse(raw)
  } catch {
    return { canEdit: false, canPublish: false }
  }
}

async function canEditSection(workId: string, dbUserId: string) {
  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      author: true,
      collaborators: {
        where: { userId: dbUserId, status: 'active' },
        select: { permissions: true },
        take: 1,
      },
    },
  })

  if (!work) return { allowed: false, isAuthor: false, canPublish: false }

  const isAuthor = work.author.userId === dbUserId
  if (isAuthor) return { allowed: true, isAuthor: true, canPublish: true }

  const collaborator = work.collaborators[0]
  const perms = parsePermissions(collaborator?.permissions)

  return { allowed: perms.canEdit, isAuthor: false, canPublish: perms.canPublish }
}

async function logActivity(
  workId: string,
  userId: string,
  action: string,
  details: Record<string, any>
) {
  prisma.collaborationActivity
    .create({
      data: {
        workId,
        userId,
        action,
        details: JSON.stringify(details),
      },
    })
    .catch(() => {})
}

/**
 * POST - Propose a new edit suggestion for a section
 */
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
  if (!access.allowed || access.canPublish) {
    // Only editors without publish rights can propose (or owners/publishers can too, but proposal is for lower-perm)
    return NextResponse.json(
      { error: 'You do not have permission to propose suggestions' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { proposedContent, proposerComment } = body

  if (!proposedContent || typeof proposedContent !== 'string') {
    return NextResponse.json({ error: 'proposedContent is required' }, { status: 400 })
  }

  try {
    const suggestion = await prisma.sectionEditSuggestion.create({
      data: {
        workId,
        sectionId,
        proposedById: dbUserId,
        proposedContent,
        proposerComment: proposerComment || null,
        status: 'pending',
      },
      include: {
        proposer: { select: { id: true, username: true, displayName: true } },
      },
    })

    // Log activity
    logActivity(workId, dbUserId, 'suggestion_proposed', {
      sectionId,
      suggestionId: suggestion.id,
    })

    return NextResponse.json(
      {
        id: suggestion.id,
        sectionId: suggestion.sectionId,
        proposedBy: suggestion.proposer,
        proposedContent: suggestion.proposedContent,
        proposerComment: suggestion.proposerComment,
        status: suggestion.status,
        createdAt: suggestion.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create suggestion:', error)
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 })
  }
}

/**
 * GET - List suggestions for a section
 */
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

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'pending'
  const take = Math.min(parseInt(url.searchParams.get('take') || '50'), 100)
  const skip = Math.max(parseInt(url.searchParams.get('skip') || '0'), 0)

  try {
    const suggestions = await prisma.sectionEditSuggestion.findMany({
      where: {
        sectionId,
        status: status === 'all' ? undefined : status,
      },
      include: {
        proposer: { select: { id: true, username: true, displayName: true } },
        reviewer: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    })

    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        id: s.id,
        sectionId: s.sectionId,
        proposedBy: s.proposer,
        reviewedBy: s.reviewer,
        proposedContent: s.proposedContent,
        proposerComment: s.proposerComment,
        authorComment: s.authorComment,
        status: s.status,
        createdAt: s.createdAt,
        reviewedAt: s.reviewedAt,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}
