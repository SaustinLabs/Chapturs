import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  requireAuth,
  addCorsHeaders
} from '@/lib/api/errorHandling'
import { generateStorageKey, getR2PublicUrl } from '@/lib/r2'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME

// POST /api/upload/cover - Upload cover image server-side
export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Authentication
    const session = await auth()
    requireAuth(session)

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return createErrorResponse(
        new Error('No file provided'),
        requestId
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return createErrorResponse(
        new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed'),
        requestId
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return createErrorResponse(
        new Error('File size too large. Maximum size is 5MB'),
        requestId
      )
    }

    // Read file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
      // Generate storage keys
      const baseKey = generateStorageKey('covers', file.name, uuidv4())
      const optimizedKey = baseKey.replace(/\.[^/.]+$/, '_optimized.webp')
      const thumbnailKey = baseKey.replace(/\.[^/.]+$/, '_thumb.webp')
      const originalKey = baseKey.replace(/\.[^/.]+$/, '_original.webp')

      // Generate optimized version  
      const optimized = await sharp(buffer)
        .webp({ quality: 85 })
        .resize(800, 1200, { fit: 'inside', withoutEnlargement: true })
        .toBuffer()
      
      // Generate thumbnail
      const thumbnail = await sharp(buffer)
        .webp({ quality: 70 })
        .resize(200, 300, { fit: 'cover' })
        .toBuffer()
      
      // Upload to R2 directly server-side
      const { uploadToR2 } = await import('@/lib/r2')
      
      const [originalUrl, optimizedUrl, thumbnailUrl] = await Promise.all([
        uploadToR2(originalKey, buffer, file.type),
        uploadToR2(optimizedKey, optimized, 'image/webp'),
        uploadToR2(thumbnailKey, thumbnail, 'image/webp')
      ])

      const response = createSuccessResponse({
        original: originalUrl,
        optimized: optimizedUrl,
        thumbnail: thumbnailUrl,
        filename: file.name,
        size: file.size,
        type: file.type
      }, 'Cover image uploaded successfully', requestId)
    
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Cover upload error:', error)
    return createErrorResponse(error, requestId)
  }
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}
