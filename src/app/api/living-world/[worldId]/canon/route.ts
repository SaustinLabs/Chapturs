import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCanonEntry, listCanonEntries, updateCanonEntry } from '@/lib/living-world/canon-repository'
import { isCouncilMember, getCouncilRole } from '@/lib/living-world/world-repository'

export const runtime = 'nodejs'

type Params = { params: Promise<{ worldId: string }> }

// GET /api/living-world/[worldId]/canon — list canon entries (public)
export async function GET(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const { searchParams } = new URL(req.url)
  const entryType = searchParams.get('type') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const skip = parseInt(searchParams.get('skip') ?? '0')
  const take = Math.min(parseInt(searchParams.get('take') ?? '50'), 100)

  try {
    const { entries, total } = await listCanonEntries(worldId, { entryType, status, skip, take })
    return NextResponse.json({ entries, total })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch canon entries' }, { status: 500 })
  }
}

// POST /api/living-world/[worldId]/canon — create a canon entry (council member)
export async function POST(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isMember = await isCouncilMember(worldId, session.user.id)
  const isAdmin = (session.user as { role?: string }).role === 'admin'
  if (!isMember && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden: must be a world council member' }, { status: 403 })
  }

  let body: {
    entryType?: string
    title?: string
    content?: string
    sourceWorkId?: string
    sourceSectionId?: string
    status?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { entryType, title, content, sourceWorkId, sourceSectionId } = body
  if (!entryType || !title || !content) {
    return NextResponse.json({ error: 'entryType, title, and content are required' }, { status: 400 })
  }

  const validTypes = ['fact', 'event', 'location', 'rule', 'character_fact']
  if (!validTypes.includes(entryType)) {
    return NextResponse.json({ error: `entryType must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  }

  try {
    const entry = await createCanonEntry({
      worldId,
      entryType,
      title,
      content,
      sourceWorkId,
      sourceSectionId,
      createdById: session.user.id,
    })
    return NextResponse.json({ entry }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create canon entry' }, { status: 500 })
  }
}

// PATCH /api/living-world/[worldId]/canon — update an entry (council only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getCouncilRole(worldId, session.user.id)
  const isAdmin = (session.user as { role?: string }).role === 'admin'
  if (!isAdmin && role !== 'founder' && role !== 'council') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { entryId?: string; title?: string; content?: string; entryType?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { entryId, ...update } = body
  if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 })

  try {
    const entry = await updateCanonEntry(entryId, update)
    return NextResponse.json({ entry })
  } catch {
    return NextResponse.json({ error: 'Failed to update canon entry' }, { status: 500 })
  }
}
