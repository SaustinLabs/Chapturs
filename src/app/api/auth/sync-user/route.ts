import { NextResponse, NextRequest } from 'next/server'

export const runtime = 'nodejs'

// User sync endpoint - called client-side after OAuth login
// Creates/updates user in database via Supabase REST API (edge-compatible)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, image, id } = body

    // Read the community referral slug from cookie (set by /api/join/[slug])
    const communityRef = request.cookies.get('community_ref')?.value || null

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Use Supabase REST API directly (edge-compatible, no Prisma needed)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Fallback: just return success, user will be created on next Node.js call
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Upsert user via Supabase REST API
    const res = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id,
        email,
        displayName: name,
        avatar: image,
        username: email.split('@')[0] + '_' + Date.now(),
        ...(communityRef ? { communityRef } : {}),
      }),
    })

    if (!res.ok && res.status !== 409) { // 409 = duplicate, that's fine
      console.error('User sync failed:', await res.text())
      return NextResponse.json({ ok: true, skipped: true })
    }

    // If this looks like a NEW user registration (not a returning login) and
    // they came via a community link, increment that link's signup counter.
    // We determine "new" by checking if communityRef is set and the upsert
    // response indicates a created row (status 201).
    if (communityRef && res.status === 201) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/community_links?slug=eq.${encodeURIComponent(communityRef)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          // Supabase doesn't support increment via REST directly, so we use a raw SQL RPC
          // Fallback: we'll handle this at the Prisma level in the auth callback
          body: JSON.stringify({}), // no-op — handled below via Prisma
        })

        // Use Prisma to do a proper atomic increment
        const { prisma } = await import('@/lib/database/PrismaService')
        await prisma.communityLink.updateMany({
          where: { slug: communityRef, active: true },
          data: { signupCount: { increment: 1 } },
        }).catch(() => {/* non-critical */})
      } catch {
        // signup count tracking is non-critical — don't fail the request
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json({ ok: true, skipped: true })
  }
}
