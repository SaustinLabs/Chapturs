export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

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

    // Verify the requesting user is the work's author
    const work = await prisma.work.findUnique({
      where: { id: suggestion.workId },
      select: { authorId: true }
    })
    if (!work || work.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: only the work author can approve suggestions' },
        { status: 403 }
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
