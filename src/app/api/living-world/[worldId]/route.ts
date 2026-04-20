import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import {
  getWorldById,
  updateWorld,
  attachWorkToWorld,
  detachWorkFromWorld,
  isCouncilMember,
  getCouncilRole,
  addCouncilMember,
} from '@/lib/living-world/world-repository'

export const runtime = 'nodejs'

type Params = { params: Promise<{ worldId: string }> }

// GET /api/living-world/[worldId]  — fetch world detail (public)
export async function GET(_req: NextRequest, { params }: Params) {
  const { worldId } = await params

  try {
    const world = await getWorldById(worldId)
    if (!world) return NextResponse.json({ error: 'World not found' }, { status: 404 })
    return NextResponse.json({ world })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch world' }, { status: 500 })
  }
}

// PATCH /api/living-world/[worldId]  — update world (founder or council only)
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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = ['title', 'description', 'theBeginning', 'theEnd', 'coverImage', 'status']
  const update: Record<string, string> = {}
  for (const key of allowed) {
    if (typeof body[key] === 'string') update[key] = body[key] as string
  }

  // Only founder/admin can archive
  if (update.status === 'archived' && role !== 'founder' && !isAdmin) {
    return NextResponse.json({ error: 'Only the founder can archive a world' }, { status: 403 })
  }

  try {
    const world = await updateWorld(worldId, update)
    return NextResponse.json({ world })
  } catch {
    return NextResponse.json({ error: 'Failed to update world' }, { status: 500 })
  }
}

// POST /api/living-world/[worldId]  — attach/detach a work, or add council member
export async function POST(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { action?: string; workId?: string; userId?: string; memberRole?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action, workId, userId, memberRole } = body

  if (action === 'attach_work' || action === 'detach_work') {
    if (!workId) return NextResponse.json({ error: 'workId required' }, { status: 400 })

    // Only council members or the work's author can attach/detach
    const isMember = await isCouncilMember(worldId, session.user.id)
    const isAdmin = (session.user as { role?: string }).role === 'admin'
    if (!isMember && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'attach_work') {
      await attachWorkToWorld(workId, worldId)
    } else {
      await detachWorkFromWorld(workId)
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'add_member') {
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const role = await getCouncilRole(worldId, session.user.id)
    const isAdmin = (session.user as { role?: string }).role === 'admin'
    if (role !== 'founder' && !isAdmin) {
      return NextResponse.json({ error: 'Only the founder can add council members' }, { status: 403 })
    }
    const validRoles = ['council', 'contributor']
    const assignRole = validRoles.includes(memberRole ?? '') ? (memberRole as 'council' | 'contributor') : 'contributor'
    await addCouncilMember(worldId, userId, assignRole)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
