export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { emoji } = await req.json()

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Invalid emoji provided' }, { status: 400 })
    }

    // Fetch existing comment to parse current reactions
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { reactions: true, id: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    let reactions: Array<{ emoji: string, userIds: string[] }> = []
    if (comment.reactions) {
      try {
        reactions = JSON.parse(comment.reactions)
      } catch (e) {
        reactions = []
      }
    }

    // Determine if user is adding or removing the reaction
    const userId = session.user.id
    const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji)
    
    if (existingReactionIndex >= 0) {
      const userIndex = reactions[existingReactionIndex].userIds.indexOf(userId)
      if (userIndex >= 0) {
        // User already reacted with this emoji, removing it (toggle off)
        reactions[existingReactionIndex].userIds.splice(userIndex, 1)
        
        // Remove the emoji object entirely if no users are left
        if (reactions[existingReactionIndex].userIds.length === 0) {
          reactions.splice(existingReactionIndex, 1)
        }
      } else {
        // Emoji exists but user hasn't reacted with it, adding user
        reactions[existingReactionIndex].userIds.push(userId)
      }
    } else {
      // New emoji reaction
      reactions.push({ emoji, userIds: [userId] })
    }

    // Save updated reactions back to DB
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        reactions: JSON.stringify(reactions)
      }
    })

    return NextResponse.json({ 
      success: true, 
      reactions: reactions // Send back parsed array for frontend ease of use
    })

  } catch (error) {
    console.error('Failed to update emoji reaction:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
