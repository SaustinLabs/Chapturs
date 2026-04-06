export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import PrismaService from '../../../lib/database/PrismaService'
import { prisma } from '@/lib/database/PrismaService'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  requireAuth,
  validateRequest,
  checkRateLimit,
  addCorsHeaders,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'
import { createWorkSchema, searchWorksSchema } from '@/lib/api/schemas'

// use shared prisma instance from PrismaService

// POST /api/works - Create new work with auto Author profile creation
export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting - creators can create max 5 works per hour
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`create_work_${clientId}`, 5, 3600000) // 5 works per hour

    // Authentication
    const session = await auth()
    requireAuth(session)

    console.log('[POST /api/works] Creating work for user:', session.user.id, session.user.email)
    console.log('[POST /api/works] Session user ID:', session.user.id)

    // Validation
    const validatedData = await validateRequest(request, createWorkSchema)
    const {
      title,
      description,
      formatType,
      coverImage,
      genres,
      tags,
      maturityRating,
      status
    } = validatedData

    // Ensure user exists in database (in case auth callback failed)
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // Fallback: if session ID doesn't match any DB record, try by email.
    // This handles re-auth cycles where NextAuth generates a new user.id but
    // the upsert in signIn keeps the original DB ID unchanged.
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      if (user) {
        console.log('[POST /api/works] Found user by email fallback:', user.id)
      }
    }

    if (!user) {
      // True new user: create them
      console.log('User not found in database, creating user:', session.user.email)
      const emailFallback = session.user.email ?? `user_${session.user.id}@unknown.invalid`
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: emailFallback,
          username: emailFallback.split('@')[0] + '_' + Date.now(),
          displayName: session.user.name || undefined,
          avatar: session.user.image || undefined,
        }
      })
    }

    // Get or create author profile for this user
    // Use user.id (the confirmed DB ID) — not session.user.id which may differ on re-auth
    let author = await prisma.author.findUnique({
      where: { userId: user.id }
    })

    if (!author) {
      console.log('[POST /api/works] Author profile not found, creating for user:', user.id)
      // Create author profile automatically
      author = await prisma.author.create({
        data: {
          userId: user.id,
          verified: false,
          socialLinks: '[]',
        }
      })
      console.log('[POST /api/works] Created author with ID:', author.id, 'for userId:', author.userId)
    } else {
      console.log('[POST /api/works] Found existing author with ID:', author.id, 'for userId:', author.userId)
    }

    // Create work using Prisma directly for better type safety
    console.log('[POST /api/works] Creating work with authorId:', author.id)
    const work = await prisma.work.create({
      data: {
        title,
        description,
        authorId: author.id,
        formatType,
        coverImage,
        status,
        maturityRating,
        genres: JSON.stringify(genres),
        tags: JSON.stringify(tags),
        statistics: JSON.stringify({
          views: 0,
          subscribers: 0,
          bookmarks: 0,
          likes: 0,
          comments: 0,
          averageRating: 0,
          ratingCount: 0,
          completionRate: 0
        })
      },
      include: {
        author: {
          include: {
            user: true
          }
        }
      }
    })

    console.log('[POST /api/works] ✁EWork created successfully!')
    console.log('[POST /api/works] Work ID:', work.id)
    console.log('[POST /api/works] Work authorId:', work.authorId)
    console.log('[POST /api/works] Work title:', work.title)
    console.log('[POST /api/works] Author ID:', work.author.id)
    console.log('[POST /api/works] Author userId:', work.author.userId)
    console.log('[POST /api/works] Session user.id:', session.user.id)
    console.log('[POST /api/works] Session user.email:', session.user.email)
    console.log('[POST /api/works] ✁EIDs match:', work.author.userId === session.user.id ? 'YES' : `NO - author.userId=${work.author.userId} vs session.user.id=${session.user.id}`)

    const response = createSuccessResponse({
      work: {
        id: work.id,
        title: work.title,
        description: work.description,
        formatType: work.formatType,
        status: work.status,
        author: {
          id: work.author.id,
          username: work.author.user.username,
          displayName: work.author.user.displayName
        },
        createdAt: work.createdAt
      }
    }, 'Work created successfully', requestId)
    
    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

// GET /api/works - Get user's works or search works
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting - more generous for GET requests
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`get_works_${clientId}`, 100, 60000) // 100 requests per minute

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const userId = searchParams.get('userId')

    // If searching, handle as search request (no auth required for public search)
    if (query) {
      const filters = {
        formatType: searchParams.get('formatType'),
        genres: searchParams.getAll('genres'),
        status: searchParams.get('status')
      }

      const works = await PrismaService.searchWorks(query, filters)
      
      const response = createSuccessResponse({
        works,
        total: works.length,
        query,
        filters
      }, `Found ${works.length} works`, requestId)
      
      return addCorsHeaders(response)
    }

    // For user's own works, require authentication
    const session = await auth()
    requireAuth(session)

    console.log('GET /api/works - Fetching for user:', session.user.id)

    // Get the author profile for this user
    let author = await prisma.author.findUnique({
      where: { userId: session.user.id }
    })
    
    console.log('Author profile found:', author?.id)
    
    if (!author) {
      // Return empty works list if no author profile exists yet
      console.log('No author profile found for user:', session.user.id)
      const response = createSuccessResponse({
        works: [],
        total: 0,
        authorId: null
      }, 'No author profile found - create your first work to get started', requestId)
      
      return addCorsHeaders(response)
    }

    // Get user's works directly with Prisma for better performance
    console.log('Fetching works for author:', author.id)
    const works = await prisma.work.findMany({
      where: { authorId: author.id },
      include: {
        author: {
          include: { user: true }
        },
        sections: {
          select: {
            id: true,
            title: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            sections: true,
            bookmarks: true,
            likes: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    console.log('Found works for author:', author.id, 'Count:', works.length)

    const response = createSuccessResponse({
      works: works.map((work: any) => {
        try {
          return {
            id: work.id,
            title: work.title,
            description: work.description,
            formatType: work.formatType,
            coverImage: work.coverImage,
            status: work.status,
            maturityRating: work.maturityRating,
            genres: typeof work.genres === 'string' ? JSON.parse(work.genres) : (work.genres || []),
            tags: typeof work.tags === 'string' ? JSON.parse(work.tags) : (work.tags || []),
            statistics: typeof work.statistics === 'string' ? JSON.parse(work.statistics) : (work.statistics || {}),
            createdAt: work.createdAt,
            updatedAt: work.updatedAt,
            sections: work.sections || [], // Include actual sections array
            _count: {
              sections: work._count?.sections || 0,
              bookmarks: work._count?.bookmarks || 0,
              likes: work._count?.likes || 0
            }
          }
        } catch (parseError) {
          console.error('Error parsing work:', work.id, parseError)
          // Return minimal safe work object
          return {
            id: work.id,
            title: work.title || 'Untitled',
            description: work.description || '',
            formatType: work.formatType,
            coverImage: work.coverImage,
            status: work.status,
            maturityRating: work.maturityRating,
            genres: [],
            tags: [],
            statistics: {},
            createdAt: work.createdAt,
            updatedAt: work.updatedAt,
            sections: [],
            _count: { sections: 0, bookmarks: 0, likes: 0 }
          }
        }
      }),
      total: works.length,
      authorId: author.id
    }, `Found ${works.length} works`, requestId)

    return addCorsHeaders(response)

  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
