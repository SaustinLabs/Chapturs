export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'

/**
 * GET /api/admin/stats
 * Platform-wide overview statistics (Admin only)
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const session = await auth()
    if (!session?.user || !['admin', 'moderator'].includes((session.user as any).role)) {
      throw new ApiError('Unauthorized', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const [
      totalUsers,
      totalWorks,
      totalViews,
      activeContests,
      pendingReports,
      newUsersThisWeek
    ] = await Promise.all([
      prisma.user.count(),
      prisma.work.count(),
      prisma.work.aggregate({ _sum: { viewCount: true } }),
      prisma.contest.count({ where: { status: 'active' } }),
      prisma.commentReport.count({ where: { status: 'pending' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    const stats = {
      overview: {
        totalUsers,
        totalWorks,
        totalViews: totalViews._sum.viewCount || 0,
        activeContests,
        pendingReports,
        newUsersThisWeek
      },
      timestamp: new Date().toISOString()
    }

    return createSuccessResponse({ stats }, 'System stats retrieved', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
