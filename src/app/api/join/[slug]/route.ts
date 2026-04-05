export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

/**
 * GET /api/join/[slug]
 * Increments click count for the community link, sets a community_ref cookie,
 * and redirects the visitor to the home page so the feed can be pre-weighted.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const link = await prisma.communityLink.findUnique({ where: { slug } })

    if (!link || !link.active) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Increment click count (fire-and-forget, don't block the redirect)
    prisma.communityLink.update({
      where: { slug },
      data: { clickCount: { increment: 1 } },
    }).catch(() => {/* non-critical */})

    const res = NextResponse.redirect(new URL('/', req.url))

    // Cookie expires in 30 days – enough time to capture a signup
    res.cookies.set('community_ref', slug, {
      httpOnly: false, // readable by client-side JS for feed weighting
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    })

    // Also store the genres pre-seed so the feed API can use it immediately
    if (link.genres) {
      res.cookies.set('community_genres', link.genres, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        secure: process.env.NODE_ENV === 'production',
      })
    }

    return res
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
