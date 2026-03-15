// Cloudflare R2 Client (S3-compatible)
// Free tier optimized for Chapturs image uploads

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Lazy R2 client — only instantiated on first use so Next.js static
// build collection doesn't fail when R2 env vars are not set.
let _r2Client: S3Client | null = null

function getR2Config() {
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME

  if (!R2_ACCOUNT_ID) throw new Error('Missing R2_ACCOUNT_ID environment variable')
  if (!R2_ACCESS_KEY_ID) throw new Error('Missing R2_ACCESS_KEY_ID environment variable')
  if (!R2_SECRET_ACCESS_KEY) throw new Error('Missing R2_SECRET_ACCESS_KEY environment variable')
  if (!R2_BUCKET_NAME) throw new Error('Missing R2_BUCKET_NAME environment variable')

  return { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME }
}

function getClient(): S3Client {
  if (!_r2Client) {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = getR2Config()
    _r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    })
  }
  return _r2Client
}

// Export a proxy so existing `r2Client.send(...)` calls still work
export const r2Client: S3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    return (getClient() as any)[prop]
  }
})

export const getR2PublicUrl = () => {
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
  return R2_PUBLIC_URL || `https://pub-${R2_ACCOUNT_ID}.r2.dev`
}

/**
 * Generate presigned URL for direct upload to R2
 * Free tier optimized: short expiry, strict limits
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  maxSize: number
): Promise<string> {
  const { R2_BUCKET_NAME } = getR2Config()
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    // Don't set ContentType in presigned URL - it triggers CORS preflight
    // R2 will auto-detect content type from file extension
  })

  // 10 minute expiry (security best practice)
  return await getSignedUrl(r2Client, command, { 
    expiresIn: 600,
  })
}

/**
 * Upload buffer directly to R2
 * Used for processed/optimized images
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const { R2_BUCKET_NAME } = getR2Config()
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
  })

  await r2Client.send(command)
  return getPublicUrl(key)
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const { R2_BUCKET_NAME } = getR2Config()
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * Get file from R2
 * Rarely needed since we use public URLs
 */
export async function getFromR2(key: string): Promise<Buffer> {
  const { R2_BUCKET_NAME } = getR2Config()
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  const response = await r2Client.send(command)
  const stream = response.Body as any
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

/**
 * Generate storage key for organized R2 bucket
 * Format: {entityType}/{year}/{month}/{uuid}.{ext}
 */
export function generateStorageKey(
  entityType: string,
  filename: string,
  uuid: string
): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${entityType}/${year}/${month}/${uuid}.${ext}`
}

/**
 * Get public URL for R2 object
 */
export function getPublicUrl(key: string): string {
  return `${getR2PublicUrl()}/${key}`
}
