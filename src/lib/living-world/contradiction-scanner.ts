import { prisma } from '@/lib/database/PrismaService'
import { scanForContradictions, buildCanonSummary, LoreMasterContext } from './lore-master-client'
import { flagContradiction } from './canon-repository'
import { logWorldInfo, logWorldWarn, logWorldError } from '@/lib/observability/world-logger'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScanResult {
  worldId: string
  scannedWorkId: string
  flagsCreated: number
  skipped: boolean
  reason?: string
}

// ── Scan a single work for canon contradictions ───────────────────────────────

export async function scanWorkForContradictions(workId: string): Promise<ScanResult> {
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: {
      id: true,
      title: true,
      livingWorldId: true,
      sections: {
        where: { status: 'published' },
        select: { id: true, content: true },
        orderBy: { chapterNumber: 'asc' },
        take: 5, // Scan first 5 published sections to keep token cost manageable
      },
    },
  })

  if (!work?.livingWorldId) {
    return { worldId: '', scannedWorkId: workId, flagsCreated: 0, skipped: true, reason: 'Work not in a Living World' }
  }

  const worldId = work.livingWorldId

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
    return { worldId, scannedWorkId: workId, flagsCreated: 0, skipped: true, reason: 'World not found' }
  }

  if (world.canonEntries.length === 0) {
    return { worldId, scannedWorkId: workId, flagsCreated: 0, skipped: true, reason: 'No canon entries to scan against' }
  }

  // Concatenate published section content
  const textToScan = work.sections
    .map((s: { id: string; content: unknown }) => (s.content as string[]).join('\n'))
    .join('\n\n')
    .slice(0, 8000)

  if (!textToScan.trim()) {
    return { worldId, scannedWorkId: workId, flagsCreated: 0, skipped: true, reason: 'No content to scan' }
  }

  const context: LoreMasterContext = {
    worldTitle: world.title,
    theBeginning: world.theBeginning,
    theEnd: world.theEnd,
    canonSummary: buildCanonSummary(world.canonEntries),
  }

  logWorldInfo('contradiction_scan_start', { worldId, workId, textLength: textToScan.length })

  let scanResult
  try {
    scanResult = await scanForContradictions(context, textToScan)
  } catch (err) {
    logWorldError('contradiction_scan_llm_error', { worldId, workId, err: String(err) })
    return { worldId, scannedWorkId: workId, flagsCreated: 0, skipped: true, reason: 'LLM scan failed' }
  }

  if (!scanResult.hasContradictions || scanResult.flags.length === 0) {
    logWorldInfo('contradiction_scan_clean', { worldId, workId })
    return { worldId, scannedWorkId: workId, flagsCreated: 0, skipped: false }
  }

  // Persist each flagged contradiction
  let created = 0
  for (const flag of scanResult.flags) {
    try {
      await flagContradiction({
        worldId,
        description: `[${flag.severity.toUpperCase()}] ${flag.description}`,
        sourceWorkId: workId,
      })
      created++
    } catch (err) {
      logWorldWarn('contradiction_flag_persist_error', { worldId, flag, err: String(err) })
    }
  }

  logWorldInfo('contradiction_scan_complete', { worldId, workId, flagsCreated: created })
  return { worldId, scannedWorkId: workId, flagsCreated: created, skipped: false }
}

// ── Batch scan all works in a world ──────────────────────────────────────────

export async function scanWorldForContradictions(worldId: string): Promise<ScanResult[]> {
  const works = await prisma.work.findMany({
    where: { livingWorldId: worldId, status: { in: ['ongoing', 'completed'] } },
    select: { id: true },
  })

  const results: ScanResult[] = []
  for (const work of works) {
    const result = await scanWorkForContradictions(work.id)
    results.push(result)
  }
  return results
}
