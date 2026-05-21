import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { castVote, getVoteSummary } from '@/lib/living-world/canon-repository'
import { isCouncilMember } from '@/lib/living-world/world-repository'

export const runtime = 'nodejs'

type Params = { params: Promise<{ worldId: string }> }

// GET /api/living-world/[worldId]/votes?targetType=canon_entry&targetId=xxx
export async function GET(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const { searchParams } = new URL(req.url)
  const targetType = searchParams.get('targetType')
  const targetId = searchParams.get('targetId')

  if (!targetType || !targetId) {
    return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 })
  }

  try {
    const summary = await getVoteSummary(worldId, targetType, targetId)
    return NextResponse.json({ summary })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
  }
}

// POST /api/living-world/[worldId]/votes — cast or change a vote (council members only)
export async function POST(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isMember = await isCouncilMember(worldId, session.user.id)
  const isAdmin = (session.user as { role?: string }).role === 'admin'
  if (!isMember && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden: must be a world council member to vote' }, { status: 403 })
  }

  let body: {
    targetType?: string
    targetId?: string
    vote?: string
    comment?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { targetType, targetId, vote, comment } = body

  if (!targetType || !targetId || !vote) {
    return NextResponse.json({ error: 'targetType, targetId, and vote are required' }, { status: 400 })
  }

  const validVotes = ['approve', 'reject', 'veto']
  if (!validVotes.includes(vote)) {
    return NextResponse.json({ error: `vote must be one of: ${validVotes.join(', ')}` }, { status: 400 })
  }

  const validTargets = ['canon_entry', 'contradiction', 'membership']
  if (!validTargets.includes(targetType)) {
    return NextResponse.json({ error: `targetType must be one of: ${validTargets.join(', ')}` }, { status: 400 })
  }

  try {
    const result = await castVote({
      worldId,
      voterId: session.user.id,
      targetType,
      targetId,
      vote: vote as 'approve' | 'reject' | 'veto',
      comment,
    })
    return NextResponse.json({ vote: result }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 })
  }
}
