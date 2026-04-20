import { prisma } from '@/lib/database/PrismaService'
import { Prisma } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export const WORLD_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  theBeginning: true,
  theEnd: true,
  coverImage: true,
  status: true,
  founderId: true,
  createdAt: true,
  updatedAt: true,
  founder: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
    },
  },
  _count: {
    select: {
      works: true,
      canonEntries: true,
      characters: true,
      councilMembers: true,
    },
  },
} satisfies Prisma.LivingWorldSelect

export type WorldSummary = Prisma.LivingWorldGetPayload<{ select: typeof WORLD_SELECT }>

// ── Create / Update ───────────────────────────────────────────────────────────

export async function createWorld(data: {
  slug: string
  title: string
  description?: string
  theBeginning?: string
  theEnd?: string
  coverImage?: string
  founderId: string
}): Promise<WorldSummary> {
  return prisma.livingWorld.create({ data, select: WORLD_SELECT })
}

export async function updateWorld(
  worldId: string,
  data: Partial<{
    title: string
    description: string
    theBeginning: string
    theEnd: string
    coverImage: string
    status: string
  }>,
): Promise<WorldSummary> {
  return prisma.livingWorld.update({
    where: { id: worldId },
    data,
    select: WORLD_SELECT,
  })
}

// ── Work Attachment ───────────────────────────────────────────────────────────

export async function attachWorkToWorld(workId: string, worldId: string): Promise<void> {
  await prisma.work.update({
    where: { id: workId },
    data: { livingWorldId: worldId },
  })
}

export async function detachWorkFromWorld(workId: string): Promise<void> {
  await prisma.work.update({
    where: { id: workId },
    data: { livingWorldId: null },
  })
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getWorldById(worldId: string): Promise<WorldSummary | null> {
  return prisma.livingWorld.findUnique({ where: { id: worldId }, select: WORLD_SELECT })
}

export async function getWorldBySlug(slug: string): Promise<WorldSummary | null> {
  return prisma.livingWorld.findUnique({ where: { slug }, select: WORLD_SELECT })
}

export async function listWorldWorks(
  worldId: string,
  options: { skip?: number; take?: number } = {},
) {
  const { skip = 0, take = 20 } = options
  return prisma.work.findMany({
    where: { livingWorldId: worldId },
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      status: true,
      genres: true,
      author: { select: { id: true, userId: true, user: { select: { username: true, displayName: true, avatar: true } } } },
    },
    skip,
    take,
    orderBy: { createdAt: 'asc' },
  })
}

export async function listWorlds(options: {
  skip?: number
  take?: number
  status?: string
  founderId?: string
} = {}) {
  const { skip = 0, take = 20, status, founderId } = options
  const where: Prisma.LivingWorldWhereInput = {}
  if (status) where.status = status
  if (founderId) where.founderId = founderId

  const [worlds, total] = await Promise.all([
    prisma.livingWorld.findMany({ where, select: WORLD_SELECT, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.livingWorld.count({ where }),
  ])
  return { worlds, total }
}

// ── Council Membership ────────────────────────────────────────────────────────

export async function addCouncilMember(
  worldId: string,
  userId: string,
  role: 'founder' | 'council' | 'contributor' = 'contributor',
): Promise<void> {
  await prisma.worldCouncilMember.upsert({
    where: { worldId_userId: { worldId, userId } },
    create: { worldId, userId, role },
    update: { role },
  })
}

export async function removeCouncilMember(worldId: string, userId: string): Promise<void> {
  await prisma.worldCouncilMember.deleteMany({ where: { worldId, userId } })
}

export async function isCouncilMember(worldId: string, userId: string): Promise<boolean> {
  const member = await prisma.worldCouncilMember.findUnique({
    where: { worldId_userId: { worldId, userId } },
    select: { role: true },
  })
  return member !== null
}

export async function getCouncilRole(
  worldId: string,
  userId: string,
): Promise<string | null> {
  const member = await prisma.worldCouncilMember.findUnique({
    where: { worldId_userId: { worldId, userId } },
    select: { role: true },
  })
  return member?.role ?? null
}
