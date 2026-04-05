export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth-edge'
import {
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
  ApiError,
  ApiErrorType,
} from '@/lib/api/errorHandling'

function isAdmin(session: any) {
  return ['admin', 'superadmin'].includes((session?.user as any)?.role)
}

/** GET /api/admin/community-links — list all links */
export async function GET(req: NextRequest) {
  const requestId = generateRequestId()
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session)) {
      throw new ApiError('Unauthorized', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const links = await prisma.communityLink.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return createSuccessResponse({ links }, 'Community links retrieved', requestId)
  } catch (err) {
    return createErrorResponse(err, requestId)
  }
}

/** POST /api/admin/community-links — create a new link */
export async function POST(req: NextRequest) {
  const requestId = generateRequestId()
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session)) {
      throw new ApiError('Unauthorized', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const body = await req.json()
    const { slug, label, description, genres } = body

    if (!slug || !label) {
      throw new ApiError('slug and label are required', 400, ApiErrorType.VALIDATION_ERROR)
    }

    // Sanitise slug — lowercase, only alphanumeric + hyphens
    const safeSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!safeSlug) {
      throw new ApiError('Slug produced an empty string after sanitisation', 400, ApiErrorType.VALIDATION_ERROR)
    }

    const link = await prisma.communityLink.create({
      data: {
        slug: safeSlug,
        label,
        description: description || null,
        genres: genres ? JSON.stringify(genres) : null,
        createdBy: (session.user as any).id ?? null,
      },
    })

    return createSuccessResponse({ link }, 'Community link created', requestId)
  } catch (err) {
    return createErrorResponse(err, requestId)
  }
}

/** DELETE /api/admin/community-links?id=xxx — delete a link */
export async function DELETE(req: NextRequest) {
  const requestId = generateRequestId()
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session)) {
      throw new ApiError('Unauthorized', 401, ApiErrorType.AUTHORIZATION_ERROR)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      throw new ApiError('id query param required', 400, ApiErrorType.VALIDATION_ERROR)
    }

    await prisma.communityLink.delete({ where: { id } })

    return createSuccessResponse(null, 'Link deleted', requestId)
  } catch (err) {
    return createErrorResponse(err, requestId)
  }
}
