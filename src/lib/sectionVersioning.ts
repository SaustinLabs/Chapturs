import { prisma } from '@/lib/database/PrismaService'

interface RecordSectionVersionInput {
  workId: string
  sectionId: string
  content: string
  createdById: string
  source: 'manual_save' | 'suggestion_accept' | 'restore' | 'realtime_sync'
  summary?: string
  suggestionId?: string
}

export async function getNextSectionVersionNumber(sectionId: string): Promise<number> {
  const latest = await prisma.sectionVersion.findFirst({
    where: { sectionId },
    select: { versionNumber: true },
    orderBy: { versionNumber: 'desc' },
  })

  return (latest?.versionNumber ?? 0) + 1
}

export async function recordSectionVersion(input: RecordSectionVersionInput) {
  const versionNumber = await getNextSectionVersionNumber(input.sectionId)

  return prisma.sectionVersion.create({
    data: {
      workId: input.workId,
      sectionId: input.sectionId,
      versionNumber,
      content: input.content,
      source: input.source,
      summary: input.summary ?? null,
      createdById: input.createdById,
      suggestionId: input.suggestionId ?? null,
    },
  })
}
