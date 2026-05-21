import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { queryLore, scanForContradictions, buildCanonSummary, LoreMasterContext } from '@/lib/living-world/lore-master-client'
import { isCouncilMember } from '@/lib/living-world/world-repository'
import { flagContradiction } from '@/lib/living-world/canon-repository'
import { logWorldInfo, logWorldError } from '@/lib/observability/world-logger'

export const runtime = 'nodejs'

type Params = { params: Promise<{ worldId: string }> }

// POST /api/living-world/[worldId]/lore-master
// Body: { mode: 'query', question: string }
//     | { mode: 'scan', text: string, workId?: string }
export async function POST(req: NextRequest, { params }: Params) {
  const { worldId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Require council membership to query lore master
  const isMember = await isCouncilMember(worldId, session.user.id)
  const isAdmin = (session.user as { role?: string }).role === 'admin'
  if (!isMember && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden: must be a world council member' }, { status: 403 })
  }

  let body: { mode?: string; question?: string; text?: string; workId?: string; autoFlag?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { mode } = body
  if (mode !== 'query' && mode !== 'scan') {
    return NextResponse.json({ error: 'mode must be "query" or "scan"' }, { status: 400 })
  }

  // Load world + canon
  const world = await prisma.livingWorld.findUnique({
    where: { id: worldId },
    select: {
      title: true,
      theBeginning: true,
      theEnd: true,
      canonEntries: {
        where: { status: { in: ['canon', 'proposed'] } },
        select: { entryType: true, title: true, content: true, status: true },
        take: 60,
      },
    },
  })

  if (!world) {
    return NextResponse.json({ error: 'World not found' }, { status: 404 })
  }

  const context: LoreMasterContext = {
    worldTitle: world.title,
    theBeginning: world.theBeginning,
    theEnd: world.theEnd,
    canonSummary: buildCanonSummary(world.canonEntries),
  }

  if (mode === 'query') {
    const { question } = body
    if (!question?.trim()) {
      return NextResponse.json({ error: 'question is required for query mode' }, { status: 400 })
    }

    logWorldInfo('lore_master_query', { worldId, userId: session.user.id, questionLength: question.length })

    try {
      const result = await queryLore(context, question)
      return NextResponse.json({ result })
    } catch (err) {
      logWorldError('lore_master_query_error', { worldId, err: String(err) })
      return NextResponse.json({ error: 'Lore Master query failed' }, { status: 500 })
    }
  }

  // mode === 'scan'
  const { text, workId, autoFlag = false } = body
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required for scan mode' }, { status: 400 })
  }

  logWorldInfo('lore_master_scan', { worldId, userId: session.user.id, textLength: text.length })

  try {
    const result = await scanForContradictions(context, text)

    // Optionally auto-flag detected contradictions to the DB
    if (autoFlag && result.hasContradictions && result.flags.length > 0) {
      for (const flag of result.flags) {
        await flagContradiction({
          worldId,
          description: `[${flag.severity.toUpperCase()}] ${flag.description}`,
          sourceWorkId: workId,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ result })
  } catch (err) {
    logWorldError('lore_master_scan_error', { worldId, err: String(err) })
    return NextResponse.json({ error: 'Lore Master scan failed' }, { status: 500 })
  }
}
