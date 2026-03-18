export const runtime = 'nodejs'

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
 * GET /api/translations
 * List translations pending review or by specific criteria
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const language = searchParams.get('lang')

    const translations = await prisma.translation.findMany({
      where: {
        isReviewed: status === 'reviewed',
        language: language || undefined
      },
      include: {
        section: {
          select: {
            title: true,
            workId: true,
            work: { select: { title: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })

    return createSuccessResponse({ translations }, 'Translations retrieved', requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
