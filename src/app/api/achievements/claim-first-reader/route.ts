export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { claimFirstReader } from '@/lib/achievements/points'

/**
 * POST /api/achievements/claim-first-reader
 * Body: { chapterId: string, dwellMs: number, scrollPercent: number }
 *
 * Claims the "first_reader" achievement if:
 * 1. A first reader window exists for this chapter
 * 2. The window hasn't expired (5 minutes since publish)
 * 3. The reader qualifies (>=60s dwell, >=50% scroll)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { chapterId, dwellMs, scrollPercent } = body

    if (!chapterId || typeof dwellMs !== 'number' || typeof scrollPercent !== 'number') {
      return NextResponse.json(
        { error: 'chapterId, dwellMs, and scrollPercent are required' },
        { status: 400 }
      )
    }

    const result = await claimFirstReader(session.user.id, chapterId, dwellMs, scrollPercent)

    if (!result.success) {
      return NextResponse.json(
        { success: false, reason: result.reason },
        { status: 200 } // Not an error — the reader just didn't qualify
      )
    }

    return NextResponse.json({ success: true, achievement: 'first_reader' })
  } catch (error) {
    console.error('[FirstReader] Claim error:', error)
    return NextResponse.json({ error: 'Failed to claim first reader' }, { status: 500 })
  }
}
