import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  checkRateLimit,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'

/**
 * POST /api/works/[id]/view
 * Atomic increment for work and section view counts with rate limiting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id: workId } = await params

  try {
    // 1. Identify user/session for rate limiting
    const session = await auth()
    const userId = session?.user?.id
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    
    // Rate limit: 1 increment per 30 minutes (1800000ms) per user/IP per work
    // We'll use a specific key for this: view_limit_workId_userId/ip
    const rateLimitKey = `view_limit_${workId}_${userId || ip}`
    
    try {
      checkRateLimit(rateLimitKey, 1, 1800000)
    } catch (e) {
      // If rate limited, we just return success without incrementing (silent ignore)
      return createSuccessResponse({ incremented: false }, 'Rate limited (silent)', requestId)
    }

    // 2. Parse body for optional sectionId
    let sectionId: string | undefined
    try {
      const body = await request.json()
      sectionId = body.sectionId
    } catch {
      // Optional body
    }

    // 3. Atomic increments
    const updates: any[] = [
      prisma.work.update({
        where: { id: workId },
        data: { viewCount: { increment: 1 } }
      })
    ]

    if (sectionId) {
      updates.push(
        prisma.section.update({
          where: { id: sectionId },
          data: { viewCount: { increment: 1 } }
        })
      )
    }

    await Promise.all(updates)

    return createSuccessResponse({ incremented: true }, 'View counted', requestId)
  } catch (error) {
    console.error('[View Counter Error]:', error)
    return createErrorResponse(error, requestId)
  }
}
