import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import WritersRoomConsole from '@/components/living-world/WritersRoomConsole'

interface Props {
  params: Promise<{ worldId: string }>
}

export default async function WritersRoomPage({ params }: Props) {
  const { worldId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/creator/living-world/' + worldId)
  }

  const world = await prisma.livingWorld.findUnique({
    where: { id: worldId },
    include: {
      _count: { select: { works: true, canonEntries: true, characters: true, councilMembers: true } },
    },
  })

  if (!world) {
    redirect('/creator')
  }

  // Check council membership
  const membership = await prisma.worldCouncilMember.findUnique({
    where: { worldId_userId: { worldId, userId: session.user.id } },
    select: { role: true },
  })

  const isAdmin = (session.user as { role?: string }).role === 'admin'
  if (!membership && !isAdmin) {
    redirect('/creator')
  }

  // Load initial canon entries
  const canonEntries = await prisma.canonEntry.findMany({
    where: { worldId, status: { in: ['canon', 'proposed'] } },
    select: { id: true, entryType: true, title: true, content: true, status: true, sourceWorkId: true },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })

  return (
    <WritersRoomConsole
      world={{
        id: world.id,
        slug: world.slug,
        title: world.title,
        description: world.description,
        theBeginning: world.theBeginning,
        theEnd: world.theEnd,
        coverImage: world.coverImage,
        status: world.status,
        founderId: world.founderId,
      }}
      canonEntries={canonEntries}
      councilRole={membership?.role ?? (isAdmin ? 'council' : null)}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { worldId } = await params
  const world = await prisma.livingWorld.findUnique({
    where: { id: worldId },
    select: { title: true },
  })
  return {
    title: world ? `Writers Room — ${world.title}` : 'Writers Room',
  }
}
