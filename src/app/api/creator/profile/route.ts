export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

const profileUpdateSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
  profileImage: z.union([z.string().url().max(500), z.literal(''), z.null()]).optional(),
  coverImage: z.union([z.string().url().max(500), z.literal(''), z.null()]).optional(),
  featuredType: z.string().max(50).default('none'),
  featuredWorkId: z.string().optional().nullable(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3B82F6'),
  fontStyle: z.string().max(50).default('default'),
  backgroundStyle: z.string().max(50).default('solid'),
  isPublished: z.boolean().default(false),
  blocks: z.array(z.object({
    type: z.string().max(50),
    data: z.any(),
    gridX: z.number().int().optional(),
    gridY: z.number().int().optional(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    title: z.string().max(200).optional(),
    isVisible: z.boolean().optional(),
    order: z.number().int().optional(),
  })).max(50).optional(),
})

/**
 * GET /api/creator/profile
 * Fetch the authenticated creator's profile data for editing
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
        displayName: true,
        username: true,
        author: {
          select: {
            id: true,
            creatorProfile: {
              include: {
                blocks: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!user?.author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    const profile = user.author.creatorProfile

    if (!profile) {
      return NextResponse.json({
        displayName: user.displayName || '',
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

    return NextResponse.json({
      displayName: profile.displayName || user.displayName || '',
      bio: profile.bio || '',
      profileImage: profile.profileImage,
      coverImage: profile.coverImage,
      featuredType: profile.featuredType,
      featuredWorkId: profile.featuredWorkId,
      accentColor: profile.accentColor,
      fontStyle: profile.fontStyle,
      backgroundStyle: profile.backgroundStyle,
      isPublished: profile.isPublished,
      blocks: profile.blocks.map(b => ({
        ...b,
        data: typeof b.data === 'string' ? JSON.parse(b.data || '{}') : b.data,
      }))
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

    const rawData = await request.json()
    const parseResult = profileUpdateSchema.safeParse(rawData)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const data = parseResult.data

    const author = await prisma.author.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    const updateData: any = {
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
    }

    if (data.isPublished) {
      updateData.publishedAt = new Date()
    }

    // Upsert creator profile
    const profile = await prisma.creatorProfile.upsert({
      where: { authorId: author.id },
      update: updateData,
      create: {
        authorId: author.id,
        ...updateData,
        publishedAt: data.isPublished ? new Date() : null,
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
            data: typeof block.data === 'string' ? block.data : JSON.stringify(block.data || {}),
            gridX: block.gridX || 0,
            gridY: block.gridY || index,
            width: block.width || 1,
            height: block.height || 1,
            title: block.title,
            isVisible: block.isVisible !== false,
            order: block.order ?? index
          }))
        })
      }
    }

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
