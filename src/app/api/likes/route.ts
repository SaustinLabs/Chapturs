export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import DatabaseService from '@/lib/database/PrismaService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workId } = await request.json()
    
    if (!workId) {
      return NextResponse.json({ error: 'Work ID required' }, { status: 400 })
    }

    // Toggle like
    const isLiked = await DatabaseService.toggleLike(workId, session.user.id)
    
    return NextResponse.json({ 
      success: true, 
      liked: isLiked,
      message: isLiked ? 'Liked successfully' : 'Like removed successfully'
    })
  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json({ 
      error: 'Failed to toggle like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    
    if (!workId) {
      return NextResponse.json({ error: 'Work ID required' }, { status: 400 })
    }

    // Check like status
    const isLiked = await DatabaseService.checkUserLike(session.user.id, workId)
    
    return NextResponse.json({ 
      liked: isLiked
    })
  } catch (error) {
    console.error('Check like error:', error)
    return NextResponse.json({ 
      error: 'Failed to check like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
