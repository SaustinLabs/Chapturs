import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createWorld, listWorlds } from '@/lib/living-world/world-repository'

export const runtime = 'nodejs'

// GET /api/living-world  — list worlds (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const skip = parseInt(searchParams.get('skip') ?? '0')
  const take = Math.min(parseInt(searchParams.get('take') ?? '20'), 50)
  const status = searchParams.get('status') ?? 'active'
  const founderId = searchParams.get('founderId') ?? undefined

  try {
    const { worlds, total } = await listWorlds({ skip, take, status, founderId })
    return NextResponse.json({ worlds, total })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch worlds' }, { status: 500 })
  }
}

// POST /api/living-world  — create a new world (auth required)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { slug?: string; title?: string; description?: string; theBeginning?: string; theEnd?: string; coverImage?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { slug, title, description, theBeginning, theEnd, coverImage } = body

  if (!slug || !title) {
    return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'slug must contain only lowercase letters, numbers, and hyphens' },
      { status: 400 },
    )
  }

  try {
    const world = await createWorld({
      slug,
      title,
      description,
      theBeginning,
      theEnd,
      coverImage,
      founderId: session.user.id,
    })
    return NextResponse.json({ world }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return NextResponse.json({ error: 'A world with that slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create world' }, { status: 500 })
  }
}
