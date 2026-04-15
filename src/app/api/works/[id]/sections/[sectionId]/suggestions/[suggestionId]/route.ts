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
 * PATCH - Accept/reject a suggestion
 */
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; sectionId: string; suggestionId: string }>
  }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUserId = await resolveDbUserId(session)
  const { id: workId, sectionId, suggestionId } = await params

  const access = await canEditSection(workId, dbUserId)
  if (!access.canPublish) {
    return NextResponse.json(
      { error: 'Only authors and publishers can review suggestions' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { status, authorComment } = body

  if (!status || !['accepted', 'rejected'].includes(status)) {
    return NextResponse.json(
      { error: 'status must be "accepted" or "rejected"' },
      { status: 400 }
    )
  }

  try {
    const suggestion = await prisma.sectionEditSuggestion.findUnique({
      where: { id: suggestionId },
    })

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending suggestions can be reviewed' },
        { status: 400 }
      )
    }

    // If accepting, update the section content
    if (status === 'accepted') {
      await prisma.section.update({
        where: { id: sectionId },
        data: { content: suggestion.proposedContent, updatedAt: new Date() },
      })
    }

    // Update suggestion status
    const updated = await prisma.sectionEditSuggestion.update({
      where: { id: suggestionId },
      data: {
        status,
        reviewedById: dbUserId,
        reviewedAt: new Date(),
        authorComment: authorComment || null,
      },
      include: {
        proposer: { select: { id: true, username: true, displayName: true } },
        reviewer: { select: { id: true, username: true, displayName: true } },
      },
    })

    // Log activity
    logActivity(workId, dbUserId, `suggestion_${status}`, {
      sectionId,
      suggestionId,
      proposedById: suggestion.proposedById,
    })

    return NextResponse.json({
      id: updated.id,
      sectionId: updated.sectionId,
      proposedBy: updated.proposer,
      reviewedBy: updated.reviewer,
      proposedContent: updated.proposedContent,
      status: updated.status,
      authorComment: updated.authorComment,
      reviewedAt: updated.reviewedAt,
    })
  } catch (error) {
    console.error('Failed to review suggestion:', error)
    return NextResponse.json({ error: 'Failed to review suggestion' }, { status: 500 })
  }
}

/**
 * DELETE - Retract a suggestion (only proposer if pending)
 */
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; sectionId: string; suggestionId: string }>
  }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUserId = await resolveDbUserId(session)
  const { id: workId, suggestionId } = await params

  try {
    const suggestion = await prisma.sectionEditSuggestion.findUnique({
      where: { id: suggestionId },
    })

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    // Only proposer can retract pending suggestions
    if (suggestion.proposedById !== dbUserId || suggestion.status !== 'pending') {
      return NextResponse.json({ error: 'Cannot retract this suggestion' }, { status: 403 })
    }

    await prisma.sectionEditSuggestion.update({
      where: { id: suggestionId },
      data: { status: 'retracted' },
    })

    // Log activity
    logActivity(workId, dbUserId, 'suggestion_retracted', { suggestionId })

    return NextResponse.json({}, { status: 204 })
  } catch (error) {
    console.error('Failed to retract suggestion:', error)
    return NextResponse.json({ error: 'Failed to retract suggestion' }, { status: 500 })
  }
}
