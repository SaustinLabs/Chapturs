import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

/**
 * GET /api/creator/profile
 * Fetch the authenticated creator's profile data for editing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's author record
    const author = await prisma.author.findUnique({
      where: { userId: session.user.id },
      include: {
        creatorProfile: {
          include: {
            blocks: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    // If no profile exists, return default empty profile
    if (!author.creatorProfile) {
      return NextResponse.json({
        displayName: author.displayName || '',
        bio: '',
        profileImage: undefined,
        coverImage: undefined,
        featuredType: 'none',
        accentColor: '#3B82F6',
        fontStyle: 'default',
        backgroundStyle: 'solid',
        isPublished: false,
        blocks: []
      })
    }

    // Return existing profile
    const profile = author.creatorProfile
    return NextResponse.json({
      displayName: profile.displayName || author.displayName || '',
      bio: profile.bio || '',
      profileImage: profile.profileImage,
      coverImage: profile.coverImage,
      featuredType: profile.featuredType,
      featuredWorkId: profile.featuredWorkId,
      accentColor: profile.accentColor,
      fontStyle: profile.fontStyle,
      backgroundStyle: profile.backgroundStyle,
      isPublished: profile.isPublished,
      blocks: profile.blocks
    })
  } catch (error) {
    console.error('Error fetching creator profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/creator/profile
 * Update the authenticated creator's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Get user's author record
    const author = await prisma.author.findUnique({
      where: { userId: session.user.id }
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    // Upsert the profile
    const profile = await prisma.creatorProfile.upsert({
      where: { authorId: author.id },
      create: {
        authorId: author.id,
        displayName: data.displayName,
        bio: data.bio,
        profileImage: data.profileImage,
        coverImage: data.coverImage,
        featuredType: data.featuredType || 'none',
        featuredWorkId: data.featuredWorkId,
        accentColor: data.accentColor || '#3B82F6',
        fontStyle: data.fontStyle || 'default',
        backgroundStyle: data.backgroundStyle || 'solid',
        isPublished: data.isPublished || false,
        publishedAt: data.isPublished ? new Date() : null
      },
      update: {
        displayName: data.displayName,
        bio: data.bio,
        profileImage: data.profileImage,
        coverImage: data.coverImage,
        featuredType: data.featuredType,
        featuredWorkId: data.featuredWorkId,
        accentColor: data.accentColor,
        fontStyle: data.fontStyle,
        backgroundStyle: data.backgroundStyle,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : undefined
      }
    })

    // Handle blocks if provided
    if (data.blocks && Array.isArray(data.blocks)) {
      // Delete existing blocks
      await prisma.profileBlock.deleteMany({
        where: { profileId: profile.id }
      })

      // Create new blocks
      if (data.blocks.length > 0) {
        await prisma.profileBlock.createMany({
          data: data.blocks.map((block: any, index: number) => ({
            profileId: profile.id,
            type: block.type,
            data: typeof block.data === 'string' ? block.data : JSON.stringify(block.data),
            gridX: block.gridX || 0,
            gridY: block.gridY || index,
            width: block.width || 1,
            height: block.height || 1,
            title: block.title,
            isVisible: block.isVisible !== false,
            order: block.order || index
          }))
        })
      }
    }

    // Get username for redirect
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true }
    })

    return NextResponse.json({
      success: true,
      username: user?.username,
      profileId: profile.id
    })
  } catch (error) {
    console.error('Error updating creator profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

