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
  details: Record<string, unknown>
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
  const takeParam = url.searchParams.get('take')
  const skipParam = url.searchParams.get('skip')
  const pageParam = url.searchParams.get('page')
  const pageSizeParam = url.searchParams.get('pageSize')

  const pageSize = Math.min(Math.max(parseInt(pageSizeParam || takeParam || '50', 10) || 50, 1), 100)
  const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1)
  const skip = skipParam ? Math.max(parseInt(skipParam, 10) || 0, 0) : (page - 1) * pageSize
  const take = pageSize

  try {
    const where = {
      sectionId,
      status: status === 'all' ? undefined : status,
    }

    const [total, suggestions] = await Promise.all([
      prisma.sectionEditSuggestion.count({ where }),
      prisma.sectionEditSuggestion.findMany({
        where,
        include: {
          proposer: { select: { id: true, username: true, displayName: true } },
          reviewer: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ])

    const mappedSuggestions = suggestions.map((suggestion) => ({
      id: suggestion.id,
      sectionId: suggestion.sectionId,
      proposedBy: suggestion.proposer,
      reviewedBy: suggestion.reviewer,
      proposedContent: suggestion.proposedContent,
      proposerComment: suggestion.proposerComment,
      authorComment: suggestion.authorComment,
      status: suggestion.status,
      createdAt: suggestion.createdAt,
      reviewedAt: suggestion.reviewedAt,
    }))

    return NextResponse.json({
      suggestions: mappedSuggestions,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Failed to fetch suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}
