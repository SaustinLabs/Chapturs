import { NextResponse } from 'next/server'
import { auth } from '@/auth-edge'

export const runtime = 'nodejs'

// GET /api/auth/current-user - edge-compatible, uses Supabase REST API
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Return session data as fallback (no DB lookup)
      return NextResponse.json({
        user: {
          id: session.user.id,
          email: session.user.email,
          username: null,
          displayName: session.user.name,
          avatar: session.user.image,
          verified: false,
          createdAt: null,
        }
      })
    }

    // Query Supabase REST API directly (edge-compatible)
    const res = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${session.user.id}&select=id,email,username,displayName,avatar,verified,createdAt`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!res.ok) {
      throw new Error(`Supabase query failed: ${res.status}`)
    }

    const users = await res.json()

    if (!users || users.length === 0) {
      // User not in DB yet - return session data
      return NextResponse.json({
        user: {
          id: session.user.id,
          email: session.user.email,
          username: null,
          displayName: session.user.name,
          avatar: session.user.image,
          verified: false,
          createdAt: null,
        }
      })
    }

    return NextResponse.json({ user: users[0] })

  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}
