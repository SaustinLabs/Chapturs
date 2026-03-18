import { NextResponse } from 'next/server'
import { supabaseQuery, supabaseUpdate } from '@/lib/supabase-edge'

export const runtime = 'edge'

interface RouteParams {
  params: Promise<{
    username: string
  }>
}

// GET /api/profile/[username] - Get public profile data
export async function GET(request: Request, props: RouteParams) {
  const params = await props.params
  try {
    const { username } = params

    // Fetch user by username
    const user = await supabaseQuery<any>('users', {
      select: 'id,username,displayName,avatar,verified',
      filter: { username: `eq.${username}` },
      single: true,
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch author profile
    const author = await supabaseQuery<any>('authors', {
      select: 'id,verified,userId',
      filter: { userId: `eq.${user.id}` },
      single: true,
    })

    let profile = null
    let blocks: any[] = []

    if (author) {
      // Fetch creator profile
      profile = await supabaseQuery<any>('creator_profiles', {
        select: 'id,displayName,bio,profileImage,coverImage,featuredType,featuredWorkId,featuredBlockId,accentColor,fontStyle,backgroundStyle,profileViews,isPublished,authorId',
        filter: { authorId: `eq.${author.id}` },
        single: true,
      })

      if (profile) {
        // Fetch visible blocks
        blocks = await supabaseQuery<any[]>('profile_blocks', {
          select: 'id,type,data,gridX,gridY,width,height,title,order',
          filter: { profileId: `eq.${profile.id}`, isVisible: 'eq.true' },
          order: 'order.asc',
        }) || []
      }
    }

    // If profile exists but not published, return limited data
    if (profile && !profile.isPublished) {
      return NextResponse.json({
        user: {
          username: user.username,
          displayName: user.displayName,
        },
        profile: {
          isPublished: false,
        },
      })
    }

    // Fetch featured work if applicable
    let featuredWork = null
    if (profile?.featuredType === 'work' && profile.featuredWorkId) {
      featuredWork = await supabaseQuery<any>('works', {
        select: 'id,title,description,coverImage,genres,status',
        filter: { id: `eq.${profile.featuredWorkId}` },
        single: true,
      })
    }

    // Track profile view (increment view count)
    if (profile) {
      await supabaseUpdate('creator_profiles', { id: `eq.${profile.id}` }, {
        profileViews: (profile.profileViews ?? 0) + 1,
        lastViewedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        verified: user.verified,
      },
      author: author ? {
        id: author.id,
        verified: author.verified,
      } : null,
      profile: profile ? {
        id: profile.id,
        displayName: profile.displayName,
        bio: profile.bio,
        profileImage: profile.profileImage,
        coverImage: profile.coverImage,
        featuredType: profile.featuredType,
        accentColor: profile.accentColor,
        fontStyle: profile.fontStyle,
        backgroundStyle: profile.backgroundStyle,
        profileViews: profile.profileViews,
        isPublished: profile.isPublished,
        blocks,
      } : null,
      featuredWork,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
