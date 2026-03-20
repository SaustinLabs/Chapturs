# Image Upload System - Complete Implementation Guide

## Overview

A robust, reusable image upload system for the entire Chapturs platform that handles:
- Profile pictures & cover images
- Book/work covers
- Fan art submissions
- Chapter illustrations
- Character reference images
- Community content

## Architecture Decision: Storage Provider

### Option 1: Cloudflare R2 (Recommended) ✅

**Pros**:
- Zero egress fees (no bandwidth costs!)
- S3-compatible API (easy migration)
- Fast global CDN built-in
- Simple pricing: $0.015/GB storage
- Great for image-heavy platform
- Built-in hotlink protection

**Cons**:
- Relatively new service
- Fewer features than S3

**Best For**: Cost-effective image hosting with global delivery

### Option 2: AWS S3 + CloudFront

**Pros**:
- Industry standard, battle-tested
- Extensive features (lifecycle policies, versioning)
- Deep integration with AWS ecosystem
- Advanced access controls

**Cons**:
- Egress fees can be expensive
- More complex setup
- Higher operational costs

**Best For**: Enterprise features, existing AWS infrastructure

### Option 3: Vercel Blob Storage

**Pros**:
- Integrated with Vercel deployment
- Simple API
- Automatic edge caching
- Easy to set up

**Cons**:
- More expensive at scale
- Vendor lock-in
- Limited to 5GB free tier

**Best For**: Quick prototyping, MVP

### Recommendation: Cloudflare R2

For Chapturs, **Cloudflare R2** is ideal because:
1. **Zero egress fees** - Critical for user-generated content
2. **Global CDN** - Fast image delivery worldwide
3. **S3-compatible** - Easy to migrate if needed
4. **Cost-effective** - Important for community platform

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  - File selection                                        │
│  - Image preview                                         │
│  - Upload progress                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 1. Request upload URL
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Route                          │
│  /api/upload/request                                    │
│  - Validate user permissions                            │
│  - Generate unique filename                             │
│  - Create presigned URL                                 │
│  - Return upload URL + file ID                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 2. Return presigned URL
                   ▼
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  - Upload directly to R2                                │
│  - Show progress bar                                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 3. Direct upload (no server)
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  Cloudflare R2 Bucket                   │
│  - Receive file                                          │
│  - Store with unique ID                                 │
│  - Return success/failure                               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 4. Confirm upload
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Route                          │
│  /api/upload/confirm                                    │
│  - Save metadata to database                            │
│  - Create image record                                  │
│  - Return public URL                                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 5. Use public URL
                   ▼
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  - Display uploaded image                               │
│  - Save reference to entity (profile, work, etc.)       │
└─────────────────────────────────────────────────────────┘
```

## Step 1: Cloudflare R2 Setup

### 1.1 Create R2 Bucket

```bash
# Using Cloudflare Dashboard:
# 1. Go to Cloudflare Dashboard > R2
# 2. Click "Create bucket"
# 3. Name: "chapturs-images" (or your choice)
# 4. Location: Automatic (optimal global distribution)
# 5. Create
```

### 1.2 Generate API Tokens

```bash
# In Cloudflare Dashboard:
# 1. R2 > Manage R2 API Tokens
# 2. Create API Token
# 3. Permissions:
#    - Object Read & Write
#    - Bucket Read
# 4. TTL: Forever (or as needed)
# 5. Copy: Access Key ID, Secret Access Key
```

### 1.3 Get Account ID

```bash
# In Cloudflare Dashboard:
# Account > Workers & Pages > Account ID (right sidebar)
# Copy the Account ID
```

### 1.4 Environment Variables

Add to `.env.local`:
```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=chapturs-images
R2_PUBLIC_URL=https://images.chapturs.com # Your custom domain or R2 dev URL

# Image Upload Settings
MAX_IMAGE_SIZE=10485760 # 10MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
```

Add to Vercel/production environment variables as well.

### 1.5 Custom Domain (Optional but Recommended)

```bash
# In Cloudflare Dashboard > R2 > Your Bucket > Settings
# 1. Connect Domain
# 2. Add: images.chapturs.com (or subdomain of choice)
# 3. Verify DNS (automatic if using Cloudflare DNS)
# 4. Enable public access for this domain
```

Benefits:
- Professional URLs (`images.chapturs.com/xyz.jpg`)
- Better SEO
- Control over caching headers
- Easier migration if needed

## Step 2: Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp uuid
```

**Packages**:
- `@aws-sdk/client-s3` - S3-compatible client for R2
- `@aws-sdk/s3-request-presigner` - Generate presigned upload URLs
- `sharp` - Image optimization and transformation
- `uuid` - Generate unique file IDs

## Step 3: Database Schema

Add image tracking table to your schema:

```prisma
// prisma/schema.prisma

model Image {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // File information
  filename    String   // Original filename
  filesize    Int      // Size in bytes
  mimeType    String   // image/jpeg, image/png, etc.
  width       Int?     // Image dimensions
  height      Int?
  
  // Storage
  storageKey  String   @unique // R2 object key
  publicUrl   String   // Full public URL
  
  // Metadata
  uploadedBy  String   // User ID who uploaded
  uploadedFor String?  // Entity ID (work, profile, etc.)
  entityType  String?  // 'profile', 'work_cover', 'fanart', 'chapter', etc.
  altText     String?  // Accessibility
  
  // Variants (for responsive images)
  variants    Json?    // { thumbnail: "url", medium: "url", large: "url" }
  
  // Moderation
  status      String   @default("pending") // pending, approved, rejected
  moderatedBy String?
  moderatedAt DateTime?
  
  // Relations
  user        User     @relation(fields: [uploadedBy], references: [id])
  
  @@index([uploadedBy])
  @@index([entityType, uploadedFor])
  @@index([status])
}

// Add to User model
model User {
  // ... existing fields
  uploadedImages Image[]
}
```

Run migration:
```bash
npx prisma migrate dev --name add_image_model
npx prisma generate
```

## Step 4: R2 Client Setup

Create R2 client utility:

```typescript
// src/lib/r2.ts

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const r2 = {
  client: r2Client,
  bucketName: process.env.R2_BUCKET_NAME!,
  publicUrl: process.env.R2_PUBLIC_URL!,
}

/**
 * Generate a presigned URL for direct upload from browser
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: r2.bucketName,
    Key: key,
    ContentType: contentType,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

/**
 * Delete an object from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: r2.bucketName,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * Get public URL for a stored object
 */
export function getPublicUrl(key: string): string {
  return `${r2.publicUrl}/${key}`
}
```

## Step 5: Image Processing Utility

Create image optimization utility:

```typescript
// src/lib/image-processing.ts

import sharp from 'sharp'

export interface ImageVariant {
  name: string
  width: number
  height?: number
  quality?: number
}

export const IMAGE_VARIANTS = {
  profile: [
    { name: 'thumbnail', width: 128, height: 128, quality: 85 },
    { name: 'medium', width: 256, height: 256, quality: 90 },
    { name: 'large', width: 512, height: 512, quality: 95 },
  ],
  cover: [
    { name: 'thumbnail', width: 300, height: 450, quality: 80 },
    { name: 'medium', width: 600, height: 900, quality: 85 },
    { name: 'large', width: 1200, height: 1800, quality: 90 },
  ],
  fanart: [
    { name: 'thumbnail', width: 400, quality: 80 },
    { name: 'medium', width: 800, quality: 85 },
    { name: 'large', width: 1600, quality: 90 },
  ],
}

/**
 * Process image and create variants
 */
export async function processImage(
  buffer: Buffer,
  variants: ImageVariant[]
): Promise<{ buffer: Buffer; metadata: { width: number; height: number } }[]> {
  const results = []

  for (const variant of variants) {
    const processed = sharp(buffer)
      .resize(variant.width, variant.height, {
        fit: variant.height ? 'cover' : 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: variant.quality || 85 })

    const outputBuffer = await processed.toBuffer()
    const metadata = await sharp(outputBuffer).metadata()

    results.push({
      buffer: outputBuffer,
      metadata: {
        width: metadata.width!,
        height: metadata.height!,
      },
    })
  }

  return results
}

/**
 * Validate image file
 */
export function validateImage(file: File): {
  valid: boolean
  error?: string
} {
  const maxSize = parseInt(process.env.MAX_IMAGE_SIZE || '10485760')
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',')

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}
```

## Step 6: API Routes

### 6.1 Request Upload URL

```typescript
// src/app/api/upload/request/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePresignedUploadUrl } from '@/lib/r2'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request
    const body = await request.json()
    const { filename, contentType, entityType, entityId } = body

    // Validate
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || '').split(',')
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Generate unique key
    const fileId = uuidv4()
    const extension = filename.split('.').pop()
    const storageKey = `${entityType || 'misc'}/${session.user.id}/${fileId}.${extension}`

    // Generate presigned URL (valid for 1 hour)
    const uploadUrl = await generatePresignedUploadUrl(
      storageKey,
      contentType,
      3600
    )

    // Return upload details
    return NextResponse.json({
      uploadUrl,
      fileId,
      storageKey,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('Upload request error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
```

### 6.2 Confirm Upload

```typescript
// src/app/api/upload/confirm/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPublicUrl } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request
    const body = await request.json()
    const {
      fileId,
      storageKey,
      filename,
      filesize,
      mimeType,
      width,
      height,
      entityType,
      entityId,
      altText,
    } = body

    // Validate
    if (!fileId || !storageKey || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create database record
    const image = await prisma.image.create({
      data: {
        id: fileId,
        filename,
        filesize: parseInt(filesize),
        mimeType,
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
        storageKey,
        publicUrl: getPublicUrl(storageKey),
        uploadedBy: session.user.id,
        uploadedFor: entityId,
        entityType,
        altText,
        status: 'pending', // Will be moderated
      },
    })

    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        url: image.publicUrl,
        width: image.width,
        height: image.height,
      },
    })
  } catch (error) {
    console.error('Upload confirm error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm upload' },
      { status: 500 }
    )
  }
}
```

### 6.3 Delete Image

```typescript
// src/app/api/upload/delete/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromR2 } from '@/lib/r2'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'Missing image ID' }, { status: 400 })
    }

    // Get image
    const image = await prisma.image.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Check permissions
    if (image.uploadedBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from R2
    await deleteFromR2(image.storageKey)

    // Delete from database
    await prisma.image.delete({
      where: { id: imageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
```

## Step 7: React Upload Component

Create reusable upload component:

```typescript
// src/components/ImageUpload.tsx

'use client'

import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string // Current image URL
  onChange: (url: string, imageId: string) => void
  onDelete?: () => void
  entityType?: string // 'profile', 'cover', 'fanart', etc.
  entityId?: string
  aspectRatio?: string // '1/1', '3/4', '16/9', etc.
  maxSize?: number // MB
  label?: string
  className?: string
}

export default function ImageUpload({
  value,
  onChange,
  onDelete,
  entityType = 'misc',
  entityId,
  aspectRatio = '1/1',
  maxSize = 10,
  label = 'Upload Image',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      // Validate file
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSize}MB`)
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Step 1: Request upload URL
      setProgress(10)
      const requestResponse = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          entityType,
          entityId,
        }),
      })

      if (!requestResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, fileId, storageKey } = await requestResponse.json()

      // Step 2: Upload to R2
      setProgress(30)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      setProgress(70)

      // Get image dimensions
      const img = await createImageBitmap(file)
      const width = img.width
      const height = img.height

      // Step 3: Confirm upload
      const confirmResponse = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          storageKey,
          filename: file.name,
          filesize: file.size,
          mimeType: file.type,
          width,
          height,
          entityType,
          entityId,
        }),
      })

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload')
      }

      const { image } = await confirmResponse.json()

      setProgress(100)
      setPreview(image.url)
      onChange(image.url, image.id)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      setPreview(null)
      onDelete()
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>

      <div
        className="relative bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
        style={{ aspectRatio }}
      >
        {preview ? (
          <div className="relative w-full h-full group">
            <Image
              src={preview}
              alt="Upload preview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                disabled={uploading}
              >
                Change
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                  disabled={uploading}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center p-6 hover:bg-gray-800 transition-colors"
            disabled={uploading}
          >
            {uploading ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-400">
                  Uploading... {progress}%
                </p>
              </div>
            ) : (
              <>
                <PhotoIcon className="w-12 h-12 text-gray-500 mb-3" />
                <p className="text-sm text-gray-400 text-center">
                  Click to upload
                  <span className="block text-xs text-gray-600 mt-1">
                    Max {maxSize}MB
                  </span>
                </p>
              </>
            )}
          </button>
        )}

        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 mt-2">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
```

## Step 8: Usage Examples

### 8.1 Profile Picture Upload

```typescript
// In BasicInfoEditor.tsx

import ImageUpload from '@/components/ImageUpload'

<ImageUpload
  value={profileData.profileImage}
  onChange={(url, imageId) => {
    onUpdate('profileImage', url)
    // Optionally store imageId for later reference
  }}
  onDelete={() => onUpdate('profileImage', '')}
  entityType="profile"
  entityId={userId}
  aspectRatio="1/1"
  maxSize={5}
  label="Profile Picture"
/>
```

### 8.2 Book Cover Upload

```typescript
// In BookEditor.tsx

<ImageUpload
  value={bookData.coverImage}
  onChange={(url, imageId) => {
    setBookData({ ...bookData, coverImage: url, coverImageId: imageId })
  }}
  entityType="work_cover"
  entityId={bookData.id}
  aspectRatio="2/3"
  maxSize={10}
  label="Book Cover"
/>
```

### 8.3 Fan Art Upload

```typescript
// In FanArtSubmission.tsx

<ImageUpload
  value={fanartData.imageUrl}
  onChange={(url, imageId) => {
    setFanartData({ ...fanartData, imageUrl: url, imageId })
  }}
  entityType="fanart"
  entityId={workId}
  aspectRatio="auto"
  maxSize={15}
  label="Fan Art Image"
/>
```

### 8.4 Multiple Images (Gallery)

```typescript
// In ChapterEditor.tsx for illustrations

const [images, setImages] = useState<string[]>([])

<div className="grid grid-cols-2 gap-4">
  {images.map((url, index) => (
    <ImageUpload
      key={index}
      value={url}
      onChange={(newUrl) => {
        const updated = [...images]
        updated[index] = newUrl
        setImages(updated)
      }}
      onDelete={() => {
        setImages(images.filter((_, i) => i !== index))
      }}
      entityType="chapter_illustration"
      entityId={chapterId}
      aspectRatio="16/9"
      maxSize={8}
      label={`Illustration ${index + 1}`}
    />
  ))}
  
  <button
    onClick={() => setImages([...images, ''])}
    className="border-2 border-dashed border-gray-700 rounded-lg p-8 hover:border-blue-500"
  >
    + Add Image
  </button>
</div>
```

## Step 9: Image Optimization (Optional but Recommended)

For better performance, generate multiple sizes:

```typescript
// src/app/api/upload/confirm/route.ts (enhanced)

import { processImage, IMAGE_VARIANTS } from '@/lib/image-processing'
import { r2 } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

// After main upload confirmation...

// Generate variants based on entity type
const variants = IMAGE_VARIANTS[entityType as keyof typeof IMAGE_VARIANTS] || []

if (variants.length > 0) {
  // Fetch the uploaded image
  const response = await fetch(getPublicUrl(storageKey))
  const buffer = Buffer.from(await response.arrayBuffer())

  // Process variants
  const processed = await processImage(buffer, variants)

  const variantUrls: Record<string, string> = {}

  // Upload each variant
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]
    const processedData = processed[i]
    
    const variantKey = storageKey.replace(
      `.${extension}`,
      `-${variant.name}.webp`
    )

    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucketName,
        Key: variantKey,
        Body: processedData.buffer,
        ContentType: 'image/webp',
      })
    )

    variantUrls[variant.name] = getPublicUrl(variantKey)
  }

  // Save variant URLs to database
  await prisma.image.update({
    where: { id: fileId },
    data: {
      variants: variantUrls,
    },
  })
}
```

## Step 10: Image Moderation (Important!)

Add content moderation for uploaded images:

```typescript
// src/lib/image-moderation.ts

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function moderateImage(imageUrl: string): Promise<{
  safe: boolean
  reason?: string
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: 'Is this image safe for a general audience? Reply only "SAFE" or "UNSAFE: [reason]"',
            },
          ],
        },
      ],
    })

    const result = response.content[0].text
    const safe = result.startsWith('SAFE')

    return {
      safe,
      reason: safe ? undefined : result.replace('UNSAFE: ', ''),
    }
  } catch (error) {
    console.error('Moderation error:', error)
    // Default to manual review on error
    return { safe: false, reason: 'Pending manual review' }
  }
}
```

Use in confirm endpoint:

```typescript
// In /api/upload/confirm/route.ts

import { moderateImage } from '@/lib/image-moderation'

// After creating image record...
const publicUrl = getPublicUrl(storageKey)

// Moderate the image
const moderation = await moderateImage(publicUrl)

// Update status
await prisma.image.update({
  where: { id: fileId },
  data: {
    status: moderation.safe ? 'approved' : 'rejected',
  },
})

if (!moderation.safe) {
  // Optionally notify user or delete image
  console.warn(`Image rejected: ${moderation.reason}`)
}
```

## Step 11: Security Best Practices

### 11.1 File Validation

```typescript
// src/lib/upload-validation.ts

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateUpload(file: File): {
  valid: boolean
  error?: string
} {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
    }
  }

  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase()
  const expectedExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
  }

  const validExtensions = expectedExtensions[file.type] || []
  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'File extension does not match file type',
    }
  }

  return { valid: true }
}
```

### 11.2 Rate Limiting

```typescript
// src/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
  analytics: true,
})
```

Use in API routes:

```typescript
// In /api/upload/request/route.ts

import { uploadRateLimit } from '@/lib/rate-limit'

// At the start of POST handler...
const identifier = session.user.id
const { success } = await uploadRateLimit.limit(identifier)

if (!success) {
  return NextResponse.json(
    { error: 'Too many uploads. Please try again later.' },
    { status: 429 }
  )
}
```

### 11.3 CORS Headers (for R2)

```typescript
// Configure in Cloudflare R2 bucket settings or via API

const corsConfig = {
  AllowedOrigins: ['https://chapturs.com', 'https://www.chapturs.com'],
  AllowedMethods: ['GET', 'PUT'],
  AllowedHeaders: ['*'],
  ExposeHeaders: ['ETag'],
  MaxAgeSeconds: 3000,
}
```

## Step 12: Monitoring & Analytics

Track upload metrics:

```typescript
// src/lib/analytics.ts

export async function trackUpload(data: {
  userId: string
  entityType: string
  fileSize: number
  success: boolean
  error?: string
}) {
  // Log to your analytics service
  await fetch('https://analytics.chapturs.com/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'image_upload',
      timestamp: new Date().toISOString(),
      ...data,
    }),
  })
}
```

## Summary

This complete system provides:

✅ **Cloudflare R2 Integration** - Cost-effective, global CDN  
✅ **Presigned URLs** - Secure direct uploads  
✅ **Database Tracking** - Full metadata and history  
✅ **Image Processing** - Multiple sizes/formats  
✅ **Reusable Component** - Drop-in upload UI  
✅ **Content Moderation** - AI-powered safety checks  
✅ **Security** - Validation, rate limiting, permissions  
✅ **Multiple Use Cases** - Profiles, covers, fan art, illustrations  

The system is production-ready, scalable, and can handle all image upload needs across your platform! 🚀

## Cost Estimates

**Cloudflare R2** (per month):
- Storage: $0.015/GB → 100GB = $1.50
- Class A ops (writes): $4.50/million → 10,000 uploads = $0.05
- Class B ops (reads): $0.36/million → 1M views = $0.36
- Egress: **$0** (no bandwidth fees!)

**Total for 100GB + 10K uploads + 1M views**: ~$2/month

Compare to S3+CloudFront: ~$15-20/month for same usage! 💰
