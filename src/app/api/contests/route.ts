export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId
} from '@/lib/api/errorHandling'

/**
 * GET /api/contests
 * List active and upcoming contests for public viewers
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const contests = await prisma.contest.findMany({
      where: {
        status: status === 'all' ? undefined : status,
        // For public, we usually only show active/voting/completed, not draft
        NOT: status === 'all' ? { status: 'draft' } : undefined
      },
      include: {
        _count: {
          select: { entries: true }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    return createSuccessResponse({ contests }, 'Contests retrieved', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
