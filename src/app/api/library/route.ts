export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/database/PrismaService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Fetch user's bookmarks and subscriptions from database
    const bookmarks = await prisma.bookmark.findMany({ 
      where: { userId }, 
      include: { work: true } 
    })
    const subscriptions = await prisma.subscription.findMany({ 
      where: { userId }, 
      include: { 
        author: {
          include: {
            works: true,
            user: true
          }
        } 
      } 
    })    // Transform bookmarks into library items
    const bookmarkItems = bookmarks.map((bookmark: any) => {
      let genres = []
      try {
        genres = bookmark.work?.genres ? JSON.parse(bookmark.work.genres) : []
      } catch (error) {
        console.warn('Failed to parse genres for work:', bookmark.work?.id, error)
        genres = []
      }

      return {
        id: `bookmark-${bookmark.id}`,
        type: 'bookmark',
        title: String(bookmark.work?.title || 'Unknown Work'),
        author: String(bookmark.work?.author || 'Unknown Author'),
        workId: bookmark.workId,
        authorId: bookmark.work?.authorId,
        description: String(bookmark.work?.summary || bookmark.work?.description || ''),
        lastUpdated: bookmark.work?.updatedAt || bookmark.createdAt,
        coverImage: bookmark.work?.coverImage,
        genres: genres,
        status: String(bookmark.work?.status || 'unknown')
      }
    })

    // Transform subscriptions into library items
    const subscriptionItems = subscriptions.map((subscription: any) => {
      const authorName = subscription.author?.user?.displayName || subscription.author?.user?.username || 'Unknown Author'
      const authorBio = subscription.author?.user?.bio || `All works by ${authorName}`
      
      return {
        id: `subscription-${subscription.id}`,
        type: 'subscription',
        title: `${authorName}'s Works`,
        author: String(authorName), // Ensure it's a string
        authorId: subscription.authorId,
        description: String(authorBio), // Ensure it's a string
        lastUpdated: subscription.subscribedAt,
        genres: ['Various'],
        status: 'ongoing'
      }
    })

    const allItems = [...bookmarkItems, ...subscriptionItems]


    return NextResponse.json({
      items: allItems,
      bookmarkCount: bookmarks.length,
      subscriptionCount: subscriptions.length
    })
  } catch (error) {
    console.error('Library API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch library data' },
      { status: 500 }
    )
  }
}
