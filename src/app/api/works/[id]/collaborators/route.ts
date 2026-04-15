export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUserId = await resolveDbUserId(session)
    const { id: workId } = await params
    const { userId, role, revenueShare } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Allowed roles: editor, contributor' }, { status: 400 })
    }
    if (revenueShare !== undefined) {
      if (typeof revenueShare !== 'number' || isNaN(revenueShare)) {
        return NextResponse.json({ error: 'revenueShare must be a number' }, { status: 400 })
      }
      if (revenueShare < 0 || revenueShare > 100) {
        return NextResponse.json({ error: 'revenueShare must be between 0 and 100' }, { status: 400 })
      }
    }

    const work = await prisma.work.findUnique({ where: { id: workId } })
    if (!work || work.authorId !== dbUserId) {
      return NextResponse.json({ error: 'Only the author can update collaborators' }, { status: 403 })
    }

    const existing = await prisma.workCollaborator.findUnique({
      where: { workId_userId: { workId, userId } },
    })
    if (!existing || existing.status === 'removed') {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (revenueShare !== undefined) updateData.revenueShare = revenueShare
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.workCollaborator.update({
      where: { workId_userId: { workId, userId } },
      data: updateData,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } }
      }
    })

    await prisma.collaborationActivity.create({
      data: {
        workId,
        userId: dbUserId,
        action: 'updated_collaborator',
        details: JSON.stringify({ updatedUserId: userId, ...updateData }),
      },
    })

    return createSuccessResponse({ collaborator: updated }, 'Collaborator updated successfully')
  } catch (error) {
    console.error('[Update Collaborator Error]:', error)
    return createErrorResponse(error, 'update-collaborator')
  }
}
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/errorHandling'
import { resolveDbUserId } from '@/lib/resolveDbUserId'

const ALLOWED_ROLES = ['editor', 'contributor'] as const

function getDefaultPermissions(role: (typeof ALLOWED_ROLES)[number]) {
  if (role === 'editor') {
    return {
      canEdit: true,
      canPublish: false,
      canInvite: false,
      canDelete: false,
    }
  }

  return {
    canEdit: true,
    canPublish: false,
    canInvite: false,
    canDelete: false,
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUserId = await resolveDbUserId(session)

    const { id: workId } = await params

    const work = await prisma.work.findUnique({
      where: { id: workId }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const isAuthor = work.authorId === dbUserId
    
    // For now only the author or existing collaborators can view collaborators
    if (!isAuthor) {
      const isCollaborator = await prisma.workCollaborator.findUnique({
        where: { workId_userId: { workId, userId: dbUserId } }
      })
      if (!isCollaborator || isCollaborator.status === 'removed') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const collaborators = await prisma.workCollaborator.findMany({
      where: {
        workId,
        status: { in: ['active', 'pending'] },
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } }
      },
      orderBy: { invitedAt: 'desc' }
    })

    return createSuccessResponse({ collaborators })
  } catch (error) {
    console.error('[Get Collaborators Error]:', error)
    return createErrorResponse(error, 'get-collaborators')
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUserId = await resolveDbUserId(session)

    const { id: workId } = await params
    const { identity, role, revenueShare } = await req.json()

    if (!identity || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Allowed roles: editor, contributor' }, { status: 400 })
    }

    const work = await prisma.work.findUnique({ where: { id: workId } })
    if (!work || work.authorId !== dbUserId) {
      return NextResponse.json({ error: 'Only the author can invite collaborators' }, { status: 403 })
    }

    const normalizedIdentity = String(identity).trim()

    // Lookup user by username (primary) or email (backward-compatible)
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentity },
          { username: { equals: normalizedIdentity, mode: 'insensitive' } }
        ]
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.id === dbUserId) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 })
    }

    const existing = await prisma.workCollaborator.findUnique({
      where: {
        workId_userId: { workId, userId: targetUser.id }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'User is already a collaborator or invited' }, { status: 400 })
    }

    const defaultPermissions = JSON.stringify(getDefaultPermissions(role))

    const collaborator = await prisma.workCollaborator.create({
      data: {
        workId,
        userId: targetUser.id,
        role,
        permissions: defaultPermissions,
        revenueShare: revenueShare || 0,
        invitedBy: dbUserId,
        status: 'active',
        acceptedAt: new Date(),
      },
      include: {
        user: { select: { id: true, username: true, displayName: true } }
      }
    })

    // Log Activity
    await prisma.collaborationActivity.create({
      data: {
        workId,
        userId: dbUserId,
        action: 'invited_collaborator',
        details: JSON.stringify({ invitedUserId: targetUser.id, role })
      }
    })

    return createSuccessResponse({ collaborator }, 'Collaborator added successfully')
  } catch (error) {
    console.error('[Invite Collaborator Error]:', error)
    return createErrorResponse(error, 'invite-collaborator')
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUserId = await resolveDbUserId(session)
    const { id: workId } = await params
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const work = await prisma.work.findUnique({ where: { id: workId } })
    if (!work || work.authorId !== dbUserId) {
      return NextResponse.json({ error: 'Only the author can remove collaborators' }, { status: 403 })
    }

    const existing = await prisma.workCollaborator.findUnique({
      where: { workId_userId: { workId, userId } },
    })

    if (!existing || existing.status === 'removed') {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
    }

    await prisma.workCollaborator.update({
      where: { workId_userId: { workId, userId } },
      data: {
        status: 'removed',
      },
    })

    await prisma.collaborationActivity.create({
      data: {
        workId,
        userId: dbUserId,
        action: 'removed_collaborator',
        details: JSON.stringify({ removedUserId: userId }),
      },
    })

    return createSuccessResponse({ removed: true }, 'Collaborator removed')
  } catch (error) {
    console.error('[Remove Collaborator Error]:', error)
    return createErrorResponse(error, 'remove-collaborator')
  }
}
