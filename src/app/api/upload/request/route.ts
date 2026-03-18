// Upload Request API - Generate presigned URL for direct R2 upload
// Free tier optimized with strict validation

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { v4 as uuidv4 } from 'uuid'
import { generatePresignedUploadUrl, generateStorageKey } from '@/lib/r2'
import { enforceFreeTierLimit } from '@/lib/r2-usage'
import { EntityType } from '@/lib/image-processing'

// Free tier file size limits (in bytes)
const FILE_SIZE_LIMITS: Record<EntityType, number> = {
  profile: 3 * 1024 * 1024, // 3 MB
  cover: 5 * 1024 * 1024, // 5 MB
  fanart: 8 * 1024 * 1024, // 8 MB
  chapter: 6 * 1024 * 1024, // 6 MB
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

interface UploadRequestBody {
  filename: string
  contentType: string
  fileSize: number
  entityType: EntityType
  entityId?: string // Optional: work ID, profile ID, etc.
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body: UploadRequestBody = await request.json()
    const { filename, contentType, fileSize, entityType, entityId } = body

    // 3. Validate entity type
    if (!['profile', 'cover', 'fanart', 'chapter'].includes(entityType)) {
      return NextResponse.json(
        { error: `Invalid entity type: ${entityType}` },
        { status: 400 }
      )
    }

    // 4. Validate file type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // 5. Validate file size
    const maxSize = FILE_SIZE_LIMITS[entityType]
    if (fileSize > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum ${maxSize / 1024 / 1024}MB for ${entityType}`,
          maxSize,
        },
        { status: 400 }
      )
    }

    // 6. Check free tier limits
    const limitCheck = await enforceFreeTierLimit(entityType, fileSize)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          usage: limitCheck.usage,
        },
        { status: 429 } // Too Many Requests
      )
    }

    // 7. Generate unique ID and storage key
    const imageId = uuidv4()
    const storageKey = generateStorageKey(entityType, filename, imageId)

    // 8. Generate presigned URL (10 min expiry)
    const uploadUrl = await generatePresignedUploadUrl(
      storageKey,
      contentType,
      maxSize
    )

    // 9. Return upload URL and metadata
    return NextResponse.json({
      uploadUrl,
      imageId,
      storageKey,
      expiresIn: 600, // seconds
      maxSize,
      usage: limitCheck.usage, // Show current usage
    })
  } catch (error) {
    console.error('[Upload Request Error]', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET - Check upload status and limits
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return current usage stats
    const { enforceFreeTierLimit: checkLimit } = await import('@/lib/r2-usage')
    const check = await checkLimit('profile', 0) // Check without upload

    return NextResponse.json({
      limits: FILE_SIZE_LIMITS,
      allowedTypes: ALLOWED_MIME_TYPES,
      usage: check.usage,
      status: check.usage?.status || 'unknown',
    })
  } catch (error) {
    console.error('[Upload Status Error]', error)
    return NextResponse.json(
      { error: 'Failed to check upload status' },
      { status: 500 }
    )
  }
}
