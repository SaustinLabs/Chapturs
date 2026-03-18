export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

// GET /api/translations/suggestions?translationId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const translationId = searchParams.get('translationId')

    if (!translationId) {
      return NextResponse.json(
        { error: 'translationId is required' },
        { status: 400 }
      )
    }

    const suggestions = await prisma.translationSuggestion.findMany({
      where: { translationId },
      orderBy: [
        { upvotes: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching translation suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}

// POST /api/translations/suggestions - Submit a translation suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { translationId, suggestedText, reason } = body

    if (!translationId || !suggestedText) {
      return NextResponse.json(
        { error: 'translationId and suggestedText are required' },
        { status: 400 }
      )
    }

    const suggestion = await prisma.translationSuggestion.create({
      data: {
        translationId,
        suggestedText,
        reason,
        userId: session.user.id,
        status: 'pending'
      }
    })

    return NextResponse.json({ suggestion }, { status: 201 })
  } catch (error) {
    console.error('Error creating translation suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    )
  }
}
