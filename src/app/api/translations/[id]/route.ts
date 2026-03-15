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
 * GET /api/translations/[id]
 * Get translation details and source section content for review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id } = await params
  
  try {
    const translation = await prisma.sectionTranslation.findUnique({
      where: { id },
      include: {
        section: true
      }
    })

    if (!translation) throw new ApiError('Translation not found', 404, ApiErrorType.NOT_FOUND_ERROR)

    return createSuccessResponse({ translation }, 'Translation details retrieved', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

/**
 * PATCH /api/translations/[id]
 * Save edits and mark translation as reviewed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError('Authentication required', 401, ApiErrorType.AUTHENTICATION_ERROR)
    }

    const body = await request.json()
    const { content, isReviewed } = body

    const translation = await prisma.sectionTranslation.update({
      where: { id },
      data: {
        content: content || undefined,
        isReviewed: isReviewed !== undefined ? isReviewed : undefined,
        reviewedBy: isReviewed ? session.user.id : undefined
      }
    })

    return createSuccessResponse({ translation }, 'Translation updated', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
