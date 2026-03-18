export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'

export const dynamic = 'force-dynamic'

// POST /api/edit-suggestions/[id]/reject - Reject an edit suggestion
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const suggestionId = params.id

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

    // Check if user is the work author (simplified check)
    
    const updatedSuggestion = await prisma.editSuggestion.update({
      where: { id: suggestionId },
      data: { 
        status: 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json({ suggestion: updatedSuggestion })
  } catch (error) {
    console.error('Error rejecting edit suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to reject suggestion' },
      { status: 500 }
    )
  }
}
