// Upload Confirm API - Process uploaded image and generate variants
// Free tier optimized with aggressive compression

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { getFromR2, uploadToR2, getPublicUrl, deleteFromR2 } from '@/lib/r2'
import {
  generateVariants,
  getImageMetadata,
  validateDimensions,
  needsModeration,
  EntityType,
} from '@/lib/image-processing'

interface ConfirmRequestBody {
  imageId: string
  storageKey: string
  entityType: EntityType
  entityId?: string
  altText?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request
    const body: ConfirmRequestBody = await request.json()
    const { imageId, storageKey, entityType, entityId, altText } = body

    // 3. Download original from R2
    console.log(`[Upload Confirm] Downloading ${storageKey}...`)
    const buffer = await getFromR2(storageKey)

    // 4. Get metadata
    const metadata = await getImageMetadata(buffer)
    console.log(`[Upload Confirm] Image: ${metadata.width}x${metadata.height}, ${(metadata.size / 1024).toFixed(0)}KB`)

    // 5. Validate dimensions
    const dimensionCheck = validateDimensions(
      metadata.width,
      metadata.height,
      entityType
    )
    if (!dimensionCheck.valid) {
      // Delete invalid upload
      await deleteFromR2(storageKey)
      return NextResponse.json(
        { error: dimensionCheck.error },
        { status: 400 }
      )
    }

    // 6. Generate optimized variants
    console.log(`[Upload Confirm] Generating variants...`)
    const variants = await generateVariants(buffer, entityType)
    
    console.log(`[Upload Confirm] Compression savings: ${(variants.totalSaved / 1024).toFixed(0)}KB`)

    // 7. Upload variants to R2
    const ext = 'webp' // All variants are WebP
    const baseKey = storageKey.replace(/\.[^.]+$/, '') // Remove extension

    const [thumbnailUrl, optimizedUrl] = await Promise.all([
      uploadToR2(
        `${baseKey}-thumbnail.${ext}`,
        variants.thumbnail.buffer,
        'image/webp',
        {
          width: String(variants.thumbnail.width),
          height: String(variants.thumbnail.height),
        }
      ),
      uploadToR2(
        `${baseKey}-optimized.${ext}`,
        variants.optimized.buffer,
        'image/webp',
        {
          width: String(variants.optimized.width),
          height: String(variants.optimized.height),
        }
      ),
    ])

    console.log(`[Upload Confirm] Variants uploaded`)

    // 8. Check if needs moderation
    const modCheck = await needsModeration(buffer)
    const status = modCheck.needsReview ? 'pending' : 'approved'

    console.log(`[Upload Confirm] Moderation: ${status} (${modCheck.confidence})`)

    // 9. Save to database
    const totalSize =
      metadata.size + variants.thumbnail.size + variants.optimized.size

    const image = await prisma.image.create({
      data: {
        id: imageId,
        filename: storageKey.split('/').pop()!,
        filesize: totalSize,
        mimeType: metadata.format === 'webp' ? 'image/webp' : 'image/jpeg',
        width: metadata.width,
        height: metadata.height,
        storageKey,
        publicUrl: getPublicUrl(storageKey),
        variants: JSON.stringify({
          thumbnail: thumbnailUrl,
          optimized: optimizedUrl,
        }),
        uploadedBy: session.user.id,
        uploadedFor: entityId || null,
        entityType,
        status,
        altText: altText || null,
        moderationNotes: modCheck.reason || null,
      },
    })

    console.log(`[Upload Confirm] Saved to database: ${image.id}`)

    // 10. Return success with URLs
    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        urls: {
          original: image.publicUrl,
          thumbnail: thumbnailUrl,
          optimized: optimizedUrl,
        },
        metadata: {
          width: image.width,
          height: image.height,
          size: totalSize,
          savedBytes: variants.totalSaved,
        },
        status: image.status,
        needsReview: modCheck.needsReview,
      },
    })
  } catch (error) {
    console.error('[Upload Confirm Error]', error)
    return NextResponse.json(
      {
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

