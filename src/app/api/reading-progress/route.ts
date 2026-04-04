export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** GET /api/reading-progress?workId=xxx — return last-read section for a work */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ sectionId: null })

  const workId = request.nextUrl.searchParams.get('workId')
  if (!workId) return NextResponse.json({ error: 'workId required' }, { status: 400 })

  const record = await prisma.readingHistory.findUnique({
    where: { userId_workId: { userId: session.user.id, workId } },
    select: { sectionId: true, progress: true, lastReadAt: true },
  })

  return NextResponse.json({ sectionId: record?.sectionId ?? null, progress: record?.progress ?? 0 })
}

/** POST /api/reading-progress — upsert last-read section */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 })

  let body: { workId?: string; sectionId?: string; progress?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { workId, sectionId, progress = 0 } = body
  if (!workId || !sectionId) {
    return NextResponse.json({ error: 'workId and sectionId required' }, { status: 400 })
  }

  await prisma.readingHistory.upsert({
    where: { userId_workId: { userId: session.user.id, workId } },
    update: { sectionId, progress, lastReadAt: new Date() },
    create: { userId: session.user.id, workId, sectionId, progress, lastReadAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
