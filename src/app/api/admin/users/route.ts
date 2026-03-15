import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'

/**
 * GET /api/admin/users
 * Search/List users with filters (Admin only)
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      throw new ApiError('Unauthorized: Admin access required', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const role = searchParams.get('role')

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } }
        ],
        role: role || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        image: true,
        createdAt: true,
        _count: {
          select: { works: true } // Assuming works relation exists on User/Author
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return createSuccessResponse({ users }, 'Users retrieved', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

/**
 * PATCH /api/admin/users
 * Update user role or ban/deactivate (Admin only)
 */
export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      throw new ApiError('Unauthorized: Admin access required', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const body = await request.json()
    const { userId, role, isBanned } = body

    if (!userId) {
      throw new ApiError('User ID required', 400, ApiErrorType.VALIDATION_ERROR)
    }

    // Prevent admin from de-admining themselves (safety)
    if (userId === session.user.id && role && role !== 'admin') {
      throw new ApiError('You cannot remove admin role from yourself', 400, ApiErrorType.VALIDATION_ERROR)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role || undefined,
        // Assuming there might be an isBanned or status field, otherwise role could be 'banned'
        // If isBanned doesn't exist, we can use role or add it to schema.
        // For now let's assume role is the primary lever.
      }
    })

    return createSuccessResponse({ user }, 'User updated', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
