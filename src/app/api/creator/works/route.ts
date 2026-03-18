import { NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { supabaseQuery } from '@/lib/supabase-edge'

export const runtime = 'edge'

// GET /api/creator/works - Get all creator's works
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const author = await supabaseQuery('authors', {
      select: 'id',
      filter: { userId: `eq.${session.user.id}` },
      single: true
    })

    if (!author) {
      return NextResponse.json({ works: [] })
    }

    const works = await supabaseQuery('works', {
      filter: { authorId: `eq.${author.id}` },
      order: 'updatedAt.desc'
    })

    return NextResponse.json({ works: works || [] })
  } catch (error) {
    console.error('Creator works error:', error)
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 })
  }
}
