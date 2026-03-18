import { NextResponse } from 'next/server'

export const runtime = 'edge'

// User sync endpoint - called client-side after OAuth login
// Creates/updates user in database via Supabase REST API (edge-compatible)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, image, id } = body

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
      }),
    })

    if (!res.ok && res.status !== 409) { // 409 = duplicate, that's fine
      console.error('User sync failed:', await res.text())
      return NextResponse.json({ ok: true, skipped: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json({ ok: true, skipped: true })
  }
}
