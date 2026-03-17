// Upload Delete API - Remove image from R2 and database
// Includes authorization checks

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { deleteFromR2 } from '@/lib/r2'

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get image ID from query
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing image ID' },
        { status: 400 }
      )
    }

    // 3. Find image
    const image = await prisma.image.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // 4. Authorization check - only uploader or admin can delete
    const isOwner = image.uploadedBy === session.user.id
    const isAdmin = (session.user as any).role === 'admin' // Type assertion for role

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this image' },
        { status: 403 }
      )
    }

    // 5. Delete from R2
    console.log(`[Delete Image] Removing ${image.storageKey}...`)

    // Delete original
    await deleteFromR2(image.storageKey)

    // Delete variants
    if (image.variants) {
      try {
        const variants = JSON.parse(image.variants as string)
        for (const variantUrl of Object.values(variants)) {
          const key = (variantUrl as string).split('/').pop()
          if (key) {
            await deleteFromR2(key).catch(err =>
              console.warn(`Failed to delete variant ${key}:`, err)
            )
          }
        }
      } catch (err) {
        console.warn('Failed to parse variants:', err)
      }
    }

    // 6. Delete from database
    await prisma.image.delete({
      where: { id: imageId },
    })

    console.log(`[Delete Image] Removed ${imageId}`)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      freedBytes: image.filesize,
    })
  } catch (error) {
    console.error('[Delete Image Error]', error)
    return NextResponse.json(
      {
        error: 'Failed to delete image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET - Get image details
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing image ID' },
        { status: 400 }
      )
    }

    const image = await prisma.image.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: image.id,
      filename: image.filename,
      filesize: image.filesize,
      width: image.width,
      height: image.height,
      url: image.publicUrl,
      variants: image.variants ? JSON.parse(image.variants as string) : null,
      entityType: image.entityType,
      status: image.status,
      altText: image.altText,
      uploadedBy: image.uploadedBy,
      uploadedAt: image.createdAt,
    })
  } catch (error) {
    console.error('[Get Image Error]', error)
    return NextResponse.json(
      { error: 'Failed to get image' },
      { status: 500 }
    )
  }
}

