import { r2Client, getR2PublicUrl } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

/**
 * Download cover image from Gutendex and upload to Cloudflare R2.
 * Non-fatal: returns null on failure (work is created without cover).
 */
export async function uploadCoverToR2(
  gutenbergId: number,
  coverUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(coverUrl, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null

    const buf = Buffer.from(await res.arrayBuffer())
    const key = `covers/gutenberg-${gutenbergId}.jpg`

    await r2Client.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME!,
      Key:         key,
      Body:        buf,
      ContentType: 'image/jpeg',
    }))

    return `${getR2PublicUrl()}/${key}`
  } catch {
    return null // Non-fatal: work is created without cover
  }
}
