export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

// GET /api/image/cover/[id] - Serve cover image for a work
// If the work.coverImage is a data URL, decode and stream it with proper headers.
// Otherwise, return 302 redirect to the external URL (future-proof when R2/CDN is restored).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const work = await prisma.work.findUnique({ where: { id }, select: { coverImage: true, updatedAt: true } })
    if (!work) {
      return new NextResponse('Not found', { status: 404 })
    }

    const cover = work.coverImage || ''

    // If it's an absolute URL (http/https), redirect to it
    if (/^https?:\/\//i.test(cover)) {
      return NextResponse.redirect(cover, { status: 302 })
    }

    // Expect a data URL: data:<mime>;base64,<payload>
    const match = /^data:([^;]+);base64,(.+)$/i.exec(cover)
    if (!match) {
      // Unknown format; no content
      return new NextResponse('No image', { status: 204 })
    }

    const mime = match[1]
    const b64 = match[2]
    let bytes: Buffer
    try {
      bytes = Buffer.from(b64, 'base64')
    } catch {
      return new NextResponse('Invalid image data', { status: 422 })
    }

    const etag = 'W/"' + bytes.length + ':' + (work.updatedAt?.getTime?.() ?? Date.now()) + '"'

    // Convert Buffer to a Uint8Array to satisfy BodyInit
    const body = new Uint8Array(bytes)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(bytes.length),
        // Cache for a long time; update busts via ETag change when cover updates
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
      },
    })
  } catch (err) {
    console.error('[GET /api/image/cover/[id]] error:', err)
    return new NextResponse('Server error', { status: 500 })
  }
}
