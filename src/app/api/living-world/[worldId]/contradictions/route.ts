import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { flagContradiction, resolveContradiction, listContradictions } from '@/lib/living-world/canon-repository'
import { isCouncilMember, getCouncilRole } from '@/lib/living-world/world-repository'

export const runtime = 'nodejs'

type Params = { params: Promise<{ worldId: string }> }

// GET /api/living-world/[worldId]/contradictions — list flags (public)
export async function GET(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const skip = parseInt(searchParams.get('skip') ?? '0')
  const take = Math.min(parseInt(searchParams.get('take') ?? '50'), 100)

  try {
    const { contradictions, total } = await listContradictions(worldId, { status, skip, take })
    return NextResponse.json({ contradictions, total })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contradictions' }, { status: 500 })
  }
}

// POST /api/living-world/[worldId]/contradictions — flag a contradiction (any council member or author)
export async function POST(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    description?: string
    canonEntryId?: string
    sourceWorkId?: string
    sourceSectionId?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }

  try {
    const flag = await flagContradiction({
      worldId,
      description: body.description,
      canonEntryId: body.canonEntryId,
      sourceWorkId: body.sourceWorkId,
      sourceSectionId: body.sourceSectionId,
    })
    return NextResponse.json({ flag }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to flag contradiction' }, { status: 500 })
  }
}

// PATCH /api/living-world/[worldId]/contradictions — resolve or dismiss a flag (council only)
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

  let body: { flagId?: string; resolution?: string; dismiss?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { flagId, resolution, dismiss = false } = body
  if (!flagId) return NextResponse.json({ error: 'flagId required' }, { status: 400 })
  if (!resolution) return NextResponse.json({ error: 'resolution required' }, { status: 400 })

  try {
    const flag = await resolveContradiction(flagId, session.user.id, resolution, dismiss)
    return NextResponse.json({ flag })
  } catch {
    return NextResponse.json({ error: 'Failed to resolve contradiction' }, { status: 500 })
  }
}
