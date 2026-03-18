import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { supabaseQuery, supabaseInsert, supabaseUpdate, supabaseDelete } from '@/lib/supabase-edge'

export const runtime = 'edge'

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
    const author = await supabaseQuery('authors', {
      select: 'id,userId',
      filter: { userId: `eq.${session.user.id}` },
      single: true
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    const user = await supabaseQuery('users', {
      select: 'displayName',
      filter: { id: `eq.${session.user.id}` },
      single: true
    })

    const profile = await supabaseQuery('creator_profiles', {
      filter: { authorId: `eq.${author.id}` },
      single: true
    })

    // If no profile exists, return default empty profile
    if (!profile) {
      return NextResponse.json({
        displayName: user?.displayName || '',
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

    const blocks = await supabaseQuery('profile_blocks', {
      filter: { profileId: `eq.${profile.id}` },
      order: 'order.asc'
    })

    // Return existing profile
    return NextResponse.json({
      displayName: profile.displayName || user?.displayName || '',
      bio: profile.bio || '',
      profileImage: profile.profileImage,
      coverImage: profile.coverImage,
      featuredType: profile.featuredType,
      featuredWorkId: profile.featuredWorkId,
      accentColor: profile.accentColor,
      fontStyle: profile.fontStyle,
      backgroundStyle: profile.backgroundStyle,
      isPublished: profile.isPublished,
      blocks: Array.isArray(blocks) ? blocks : []
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
    const author = await supabaseQuery('authors', {
      select: 'id,userId',
      filter: { userId: `eq.${session.user.id}` },
      single: true
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    const existingProfile = await supabaseQuery('creator_profiles', {
      filter: { authorId: `eq.${author.id}` },
      single: true
    })

    const basePayload = {
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
      isPublished: data.isPublished || false
    }

    const publishedAt = data.isPublished ? new Date().toISOString() : null

    let profileResult: any

    if (existingProfile) {
      const updateData: Record<string, any> = {
        displayName: data.displayName,
        bio: data.bio,
        profileImage: data.profileImage,
        coverImage: data.coverImage,
        featuredType: data.featuredType,
        featuredWorkId: data.featuredWorkId,
        accentColor: data.accentColor,
        fontStyle: data.fontStyle,
        backgroundStyle: data.backgroundStyle,
        isPublished: data.isPublished
      }

      if (data.isPublished) {
        updateData.publishedAt = new Date().toISOString()
      }

      const updated = await supabaseUpdate('creator_profiles', { id: `eq.${existingProfile.id}` }, updateData)
      profileResult = Array.isArray(updated) ? updated[0] : updated
    } else {
      const created = await supabaseInsert('creator_profiles', {
        ...basePayload,
        publishedAt
      })
      profileResult = Array.isArray(created) ? created[0] : created
    }

    const profileId = profileResult?.id || existingProfile?.id

    // Handle blocks if provided
    if (data.blocks && Array.isArray(data.blocks) && profileId) {
      // Delete existing blocks
      await supabaseDelete('profile_blocks', {
        profileId: `eq.${profileId}`
      })

      // Create new blocks
      if (data.blocks.length > 0) {
        const blocksPayload = data.blocks.map((block: any, index: number) => ({
          profileId,
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

        await supabaseInsert('profile_blocks', blocksPayload as any)
      }
    }

    // Get username for redirect
    const user = await supabaseQuery('users', {
      select: 'username',
      filter: { id: `eq.${session.user.id}` },
      single: true
    })

    return NextResponse.json({
      success: true,
      username: user?.username,
      profileId
    })
  } catch (error) {
    console.error('Error updating creator profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
