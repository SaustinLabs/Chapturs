export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'
import { canApplySuggestion } from '@/lib/suggestions/suggestion-permissions'

// POST /api/edit-suggestions/[id]/approve - Approve an edit suggestion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: suggestionId } = await params
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the suggestion
    const suggestion = await prisma.editSuggestion.findUnique({
      where: { id: suggestionId }
    })

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    const permission = await canApplySuggestion(session.user.id, suggestion.workId)
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || 'Forbidden' },
        { status: 403 }
      )
    }

    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending suggestions can be approved' },
        { status: 409 }
      )
    }
    
    const updatedSuggestion = await prisma.editSuggestion.update({
      where: { id: suggestionId },
      data: { 
        status: 'approved',
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json({ suggestion: updatedSuggestion })
  } catch (error) {
    console.error('Error approving edit suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to approve suggestion' },
      { status: 500 }
    )
  }
}
