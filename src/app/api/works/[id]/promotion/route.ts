export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

type Params = { params: Promise<{ id: string }> }

// GET — read the current promotion settings for a work
export async function GET(
  _req: NextRequest,
  { params }: Params
) {
  const { id } = await params
  const work = await prisma.work.findUnique({
    where: { id },
    select: { promotedWorkId: true, promotedBlurb: true },
  })
  if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(work)
}

// PUT — set promotion settings (owner only)
export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const work = await prisma.work.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the work owner can set promotions
  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!author || author.id !== work.authorId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { promotedWorkId, promotedBlurb } = await request.json()

  // Validate the promoted work exists
  if (promotedWorkId) {
    const target = await prisma.work.findUnique({
      where: { id: promotedWorkId },
      select: { id: true },
    })
    if (!target) return NextResponse.json({ error: 'Promoted work not found' }, { status: 400 })
  }

  await prisma.work.update({
    where: { id },
    data: {
      promotedWorkId: promotedWorkId || null,
      promotedBlurb: promotedBlurb || null,
    },
  })

  return NextResponse.json({ success: true })
}
