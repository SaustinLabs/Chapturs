import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

// GET /api/works/[id]/collaborators/activity - List recent collaboration activity
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dbUserId = session.user.id
  // Fetch work with author and active collaborator (if any)
  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      author: { select: { userId: true } },
      collaborators: {
        where: { userId: dbUserId, status: 'active' },
        select: { id: true },
        take: 1,
      },
    },
  })
  if (!work) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  }
  const isOwner = work.author?.userId === dbUserId
  const isActiveCollaborator = work.collaborators.length > 0
  if (!isOwner && !isActiveCollaborator) {
    return NextResponse.json({ error: 'Forbidden: not a collaborator' }, { status: 403 })
  }
  // Fetch recent activity (limit 50)
  const activity = await prisma.collaborationActivity.findMany({
    where: { workId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { id: true, displayName: true, username: true, avatar: true } },
    },
  })
  // Format details as parsed JSON
  const result = activity.map(a => ({
    id: a.id,
    workId: a.workId,
    user: a.user,
    action: a.action,
    details: (() => { try { return JSON.parse(a.details) } catch { return {} } })(),
    createdAt: a.createdAt,
  }))
  return NextResponse.json({ success: true, activity: result })
}