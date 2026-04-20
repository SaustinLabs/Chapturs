import { prisma } from '@/lib/database/PrismaService'
import { Prisma } from '@prisma/client'

// ── Selects ───────────────────────────────────────────────────────────────────

export const CANON_ENTRY_SELECT = {
  id: true,
  worldId: true,
  entryType: true,
  title: true,
  content: true,
  sourceWorkId: true,
  sourceSectionId: true,
  status: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, username: true, displayName: true, avatar: true } },
  sourceWork: { select: { id: true, title: true } },
  _count: { select: { contradictions: true } },
} satisfies Prisma.CanonEntrySelect

export type CanonEntrySummary = Prisma.CanonEntryGetPayload<{ select: typeof CANON_ENTRY_SELECT }>

export const CONTRADICTION_SELECT = {
  id: true,
  worldId: true,
  canonEntryId: true,
  description: true,
  sourceWorkId: true,
  sourceSectionId: true,
  status: true,
  resolution: true,
  resolvedById: true,
  resolvedAt: true,
  createdAt: true,
  canonEntry: { select: { id: true, title: true } },
  sourceWork: { select: { id: true, title: true } },
  resolvedBy: { select: { id: true, username: true, displayName: true } },
} satisfies Prisma.LoreContradictionFlagSelect

export type ContradictionSummary = Prisma.LoreContradictionFlagGetPayload<{
  select: typeof CONTRADICTION_SELECT
}>

// ── Canon Entries ─────────────────────────────────────────────────────────────

export async function createCanonEntry(data: {
  worldId: string
  entryType: string
  title: string
  content: string
  sourceWorkId?: string
  sourceSectionId?: string
  createdById: string
  status?: string
}): Promise<CanonEntrySummary> {
  return prisma.canonEntry.create({ data: { ...data, status: data.status ?? 'proposed' }, select: CANON_ENTRY_SELECT })
}

export async function updateCanonEntry(
  entryId: string,
  data: Partial<{
    title: string
    content: string
    entryType: string
    status: string
    sourceWorkId: string
    sourceSectionId: string
  }>,
): Promise<CanonEntrySummary> {
  return prisma.canonEntry.update({ where: { id: entryId }, data, select: CANON_ENTRY_SELECT })
}

export async function getCanonEntry(entryId: string): Promise<CanonEntrySummary | null> {
  return prisma.canonEntry.findUnique({ where: { id: entryId }, select: CANON_ENTRY_SELECT })
}

export async function listCanonEntries(
  worldId: string,
  options: { entryType?: string; status?: string; skip?: number; take?: number } = {},
) {
  const { entryType, status, skip = 0, take = 50 } = options
  const where: Prisma.CanonEntryWhereInput = { worldId }
  if (entryType) where.entryType = entryType
  if (status) where.status = status

  const [entries, total] = await Promise.all([
    prisma.canonEntry.findMany({
      where,
      select: CANON_ENTRY_SELECT,
      skip,
      take,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.canonEntry.count({ where }),
  ])
  return { entries, total }
}

// ── Contradiction Flags ───────────────────────────────────────────────────────

export async function flagContradiction(data: {
  worldId: string
  description: string
  canonEntryId?: string
  sourceWorkId?: string
  sourceSectionId?: string
}): Promise<ContradictionSummary> {
  return prisma.loreContradictionFlag.create({
    data: { ...data, status: 'open' },
    select: CONTRADICTION_SELECT,
  })
}

export async function resolveContradiction(
  flagId: string,
  resolvedById: string,
  resolution: string,
  dismiss = false,
): Promise<ContradictionSummary> {
  return prisma.loreContradictionFlag.update({
    where: { id: flagId },
    data: {
      status: dismiss ? 'dismissed' : 'resolved',
      resolvedById,
      resolvedAt: new Date(),
      resolution,
    },
    select: CONTRADICTION_SELECT,
  })
}

export async function listContradictions(
  worldId: string,
  options: { status?: string; skip?: number; take?: number } = {},
) {
  const { status, skip = 0, take = 50 } = options
  const where: Prisma.LoreContradictionFlagWhereInput = { worldId }
  if (status) where.status = status

  const [contradictions, total] = await Promise.all([
    prisma.loreContradictionFlag.findMany({
      where,
      select: CONTRADICTION_SELECT,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.loreContradictionFlag.count({ where }),
  ])
  return { contradictions, total }
}

// ── Canon Characters ──────────────────────────────────────────────────────────

export async function createCanonCharacter(data: {
  worldId: string
  name: string
  aliases?: string
  description?: string
  traits?: string
  firstAppearanceWorkId?: string
  firstAppearanceSectionId?: string
  createdById: string
}) {
  return prisma.canonCharacter.create({ data })
}

export async function listCanonCharacters(worldId: string, options: { skip?: number; take?: number } = {}) {
  const { skip = 0, take = 100 } = options
  return prisma.canonCharacter.findMany({
    where: { worldId },
    skip,
    take,
    orderBy: { name: 'asc' },
  })
}

// ── Council Votes ─────────────────────────────────────────────────────────────

export async function castVote(data: {
  worldId: string
  voterId: string
  targetType: string
  targetId: string
  vote: 'approve' | 'reject' | 'veto'
  comment?: string
}) {
  return prisma.worldCouncilVote.upsert({
    where: {
      worldId_voterId_targetType_targetId: {
        worldId: data.worldId,
        voterId: data.voterId,
        targetType: data.targetType,
        targetId: data.targetId,
      },
    },
    create: data,
    update: { vote: data.vote, comment: data.comment },
  })
}

export async function getVoteSummary(
  worldId: string,
  targetType: string,
  targetId: string,
): Promise<{ approve: number; reject: number; veto: number }> {
  const votes = await prisma.worldCouncilVote.findMany({
    where: { worldId, targetType, targetId },
    select: { vote: true },
  })

  return votes.reduce(
    (acc: { approve: number; reject: number; veto: number }, { vote }: { vote: string }) => {
      if (vote === 'approve') acc.approve++
      else if (vote === 'reject') acc.reject++
      else if (vote === 'veto') acc.veto++
      return acc
    },
    { approve: 0, reject: 0, veto: 0 },
  )
}
