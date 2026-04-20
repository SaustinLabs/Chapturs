import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import AdminLivingWorldClient from './AdminLivingWorldClient'

export const runtime = 'nodejs'

export default async function AdminLivingWorldPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    redirect('/auth/signin')
  }

  const worlds = await prisma.livingWorld.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      createdAt: true,
      founder: { select: { username: true, displayName: true } },
      _count: {
        select: {
          works: true,
          canonEntries: true,
          contradictions: true,
          councilMembers: true,
        },
      },
    },
  })

  const openContradictions = await prisma.loreContradictionFlag.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      description: true,
      severity: true,
      status: true,
      createdAt: true,
      world: { select: { id: true, title: true, slug: true } },
      flaggedWork: { select: { id: true, title: true } },
      flaggedSection: { select: { id: true, title: true } },
    },
  })

  return (
    <AdminLivingWorldClient
      worlds={worlds.map((w: typeof worlds[number]) => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
      }))}
      openContradictions={openContradictions.map((c: typeof openContradictions[number]) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  )
}
