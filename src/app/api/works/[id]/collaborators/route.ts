export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/errorHandling'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId } = await params

    const work = await prisma.work.findUnique({
      where: { id: workId }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const isAuthor = work.authorId === session.user.id
    
    // For now only the author or existing collaborators can view collaborators
    if (!isAuthor) {
      const isCollaborator = await prisma.workCollaborator.findUnique({
        where: { workId_userId: { workId, userId: session.user.id } }
      })
      if (!isCollaborator) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const collaborators = await prisma.workCollaborator.findMany({
      where: { workId },
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

    const { id: workId } = await params
    const { identity, role, revenueShare } = await req.json()

    if (!identity || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const work = await prisma.work.findUnique({ where: { id: workId } })
    if (!work || work.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Only the author can invite collaborators' }, { status: 403 })
    }

    // Lookup user by email or username
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identity },
          { username: identity }
        ]
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.id === session.user.id) {
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

    const defaultPermissions = role === 'editor' 
      ? JSON.stringify({ canEdit: true, canPublish: false })
      : JSON.stringify({ canEdit: true, canPublish: true, canInvite: true })

    const collaborator = await prisma.workCollaborator.create({
      data: {
        workId,
        userId: targetUser.id,
        role,
        permissions: defaultPermissions,
        revenueShare: revenueShare || 0,
        invitedBy: session.user.id,
        status: 'pending'
      },
      include: {
        user: { select: { id: true, username: true, displayName: true } }
      }
    })

    // Log Activity
    await prisma.collaborationActivity.create({
      data: {
        workId,
        userId: session.user.id,
        action: 'invited_collaborator',
        details: JSON.stringify({ invitedUserId: targetUser.id, role })
      }
    })

    return createSuccessResponse({ collaborator }, 'Invitation sent successfully')
  } catch (error) {
    console.error('[Invite Collaborator Error]:', error)
    return createErrorResponse(error, 'invite-collaborator')
  }
}
