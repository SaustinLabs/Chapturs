export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

// POST /api/translations/vote - Vote on a translation
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
    const { translationId, vote } = body

    if (!translationId || !vote || !['up', 'down'].includes(vote)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide translationId and vote (up/down)' },
        { status: 400 }
      )
    }

    // Check if user already voted
    const existingVote = await prisma.translationVote.findUnique({
      where: {
        userId_translationId: {
          userId: session.user.id,
          translationId
        }
      }
    })

    let translation

    if (existingVote) {
      // Update existing vote or delete if same vote
      if (existingVote.vote === vote) {
        // Remove vote (toggle off)
        await prisma.translationVote.delete({
          where: { id: existingVote.id }
        })

        // Update translation counts
        if (vote === 'up') {
          translation = await prisma.translation.update({
            where: { id: translationId },
            data: { upvotes: { decrement: 1 } }
          })
        } else {
          translation = await prisma.translation.update({
            where: { id: translationId },
            data: { downvotes: { decrement: 1 } }
          })
        }
      } else {
        // Change vote
        await prisma.translationVote.update({
          where: { id: existingVote.id },
          data: { vote }
        })

        // Update translation counts (decrement old, increment new)
        const oldVote = existingVote.vote
        const updateData: any = {}
        
        if (oldVote === 'up') {
          updateData.upvotes = { decrement: 1 }
        } else {
          updateData.downvotes = { decrement: 1 }
        }

        if (vote === 'up') {
          updateData.upvotes = updateData.upvotes || { increment: 1 }
          if (updateData.upvotes.decrement) {
            delete updateData.upvotes.decrement
          }
        } else {
          updateData.downvotes = updateData.downvotes || { increment: 1 }
          if (updateData.downvotes.decrement) {
            delete updateData.downvotes.decrement
          }
        }

        translation = await prisma.translation.update({
          where: { id: translationId },
          data: updateData
        })
      }
    } else {
      // Create new vote
      await prisma.translationVote.create({
        data: {
          userId: session.user.id,
          translationId,
          vote
        }
      })

      // Update translation counts
      if (vote === 'up') {
        translation = await prisma.translation.update({
          where: { id: translationId },
          data: { upvotes: { increment: 1 } }
        })
      } else {
        translation = await prisma.translation.update({
          where: { id: translationId },
          data: { downvotes: { increment: 1 } }
        })
      }
    }

    // Update rank based on upvotes - downvotes
    await prisma.translation.update({
      where: { id: translationId },
      data: {
        rank: translation.upvotes - translation.downvotes
      }
    })

    return NextResponse.json({ success: true, translation })
  } catch (error) {
    console.error('Error voting on translation:', error)
    return NextResponse.json(
      { error: 'Failed to vote on translation' },
      { status: 500 }
    )
  }
}
