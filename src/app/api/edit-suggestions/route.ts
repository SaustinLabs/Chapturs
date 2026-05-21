export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { canModerateSuggestion, canSubmitSuggestion } from '@/lib/suggestions/suggestion-permissions'

const VALID_SUGGESTION_STATUSES = new Set(['pending', 'approved', 'rejected'])

// GET /api/edit-suggestions?workId=xxx&sectionId=xxx&status=pending
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const sectionId = searchParams.get('sectionId')
    const status = searchParams.get('status')
    const blockId = searchParams.get('blockId')

    if (!workId) {
      return NextResponse.json(
        { error: 'workId is required' },
        { status: 400 }
      )
    }

    if (status && !VALID_SUGGESTION_STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Allowed values: pending, approved, rejected' },
        { status: 400 }
      )
    }

    const moderationPermission = await canModerateSuggestion(session.user.id, workId)
    if (!moderationPermission.allowed) {
      return NextResponse.json(
        { error: moderationPermission.reason || 'Forbidden' },
        { status: 403 }
      )
    }

    const where: any = { workId }
    
    if (sectionId) where.sectionId = sectionId
    if (status) where.status = status
    if (blockId) where.blockId = blockId

    const suggestions = await prisma.editSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching edit suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch edit suggestions' },
      { status: 500 }
    )
  }
}

// POST /api/edit-suggestions - Submit an edit suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !session?.user?.name) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      workId,
      sectionId,
      blockId,
      type,
      originalText,
      suggestedText,
      reason
    } = body

    if (!workId || !sectionId || !blockId || !type || !originalText || !suggestedText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const submitPermission = await canSubmitSuggestion(session.user.id, workId, sectionId)
    if (!submitPermission.allowed) {
      return NextResponse.json(
        { error: submitPermission.reason || 'Forbidden' },
        { status: 403 }
      )
    }

    const suggestion = await prisma.editSuggestion.create({
      data: {
        workId,
        sectionId,
        blockId,
        type,
        originalText,
        suggestedText,
        userId: session.user.id,
        username: session.user.name,
        reason
      }
    })

    return NextResponse.json({ suggestion }, { status: 201 })
  } catch (error) {
    console.error('Error creating edit suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to create edit suggestion' },
      { status: 500 }
    )
  }
}

// PATCH /api/edit-suggestions/:id - Approve or reject suggestion
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const id = typeof body?.id === 'string' ? body.id : ''

    if (!id) {
      return NextResponse.json(
        { error: 'Suggestion id is required in request body' },
        { status: 400 }
      )
    }

    const { status } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status required (approved or rejected)' },
        { status: 400 }
      )
    }

    // Get the suggestion to verify ownership
    const suggestion = await prisma.editSuggestion.findUnique({
      where: { id },
      include: {
        work: {
          include: {
            author: true
          }
        }
      }
    })

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    const moderationPermission = await canModerateSuggestion(session.user.id, suggestion.workId)
    if (!moderationPermission.allowed) {
      return NextResponse.json(
        { error: moderationPermission.reason || 'Forbidden' },
        { status: 403 }
      )
    }

    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending suggestions can be reviewed' },
        { status: 409 }
      )
    }

    const updatedSuggestion = await prisma.editSuggestion.update({
      where: { id },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json({ suggestion: updatedSuggestion })
  } catch (error) {
    console.error('Error updating edit suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to update edit suggestion' },
      { status: 500 }
    )
  }
}
