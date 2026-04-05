export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { SUPPORTED_LANGUAGES } from '@/lib/translation'

/**
 * GET /api/user/profile
 * Get current user's basic profile info (username, etc.)
 */
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        verified: true,
        preferredLanguage: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/profile
 * Update mutable profile fields. Currently supports: preferredLanguage.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferredLanguage } = body

    const update: Record<string, unknown> = {}

    if (preferredLanguage !== undefined) {
      const valid = preferredLanguage === 'en' || SUPPORTED_LANGUAGES.includes(preferredLanguage)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid language code' }, { status: 400 })
      }
      update.preferredLanguage = preferredLanguage
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: update,
      select: { id: true, preferredLanguage: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

