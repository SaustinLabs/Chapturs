export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    if (/^[0-9]/.test(username)) {
      return NextResponse.json(
        { error: 'Username cannot start with a number' },
        { status: 400 }
      )
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Update the user's username
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true
      }
    })

    console.log('✅ Username updated:', {
      userId: updatedUser.id,
      newUsername: updatedUser.username,
      email: updatedUser.email
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error setting username:', error)
    return NextResponse.json(
      { error: 'Failed to set username' },
      { status: 500 }
    )
  }
}
