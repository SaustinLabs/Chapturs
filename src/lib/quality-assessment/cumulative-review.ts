// ============================================================================
// CUMULATIVE REVIEW SERVICE
// Generates milestone-triggered reader-voice story summaries.
// Runs at chapter counts: 5, 10, 20, 50. Token-lean (~200 output tokens).
// ============================================================================

import { prisma } from '@/lib/database/PrismaService'
import { generateCumulativeReview } from './llm-service'

const MILESTONES = [5, 10, 20, 50]

/**
 * Check if the given published chapter count is a milestone, and if so,
 * generate and persist a new cumulativeReview on the work's QualityAssessment.
 * Fire-and-forget safe: errors are caught and logged, never thrown.
 */
export async function maybeTriggerCumulativeReview(
  workId: string,
  publishedCount: number
): Promise<void> {
  if (!MILESTONES.includes(publishedCount)) return

  try {
    // Find the quality assessment for this work (keyed on first section)
    const assessment = await prisma.qualityAssessment.findFirst({
      where: { workId },
      orderBy: { createdAt: 'asc' },
    })

    if (!assessment) {
      console.warn('[CUMULATIVE] No QualityAssessment found for work, skipping:', workId)
      return
    }

    // Bulk-upload guard: skip if a review was generated in the last 30 minutes.
    // This collapses rapid multi-chapter publishes into a single LLM call — the
    // cooldown naturally expires and the next milestone (or a manual trigger) will
    // regenerate once the bulk upload has settled.
    if (assessment.cumulativeReviewUpdatedAt) {
      const minutesSinceLast =
        (Date.now() - assessment.cumulativeReviewUpdatedAt.getTime()) / 60_000
      if (minutesSinceLast < 30) {
        console.log(
          `[CUMULATIVE] Skipping milestone ${publishedCount} for work ${workId}` +
          ` — review generated ${minutesSinceLast.toFixed(0)}m ago (30m cooldown)`
        )
        return
      }
    }

    console.log(`[CUMULATIVE] Milestone ${publishedCount} chapters — generating review for work ${workId}`)

    // Fetch work metadata + first published section content
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { title: true, genres: true },
    })
    if (!work) return

    const firstSection = await prisma.section.findFirst({
      where: { workId, status: 'published' },
      orderBy: { createdAt: 'asc' },
      select: { content: true },
    })

    const latestSection = await prisma.section.findFirst({
      where: { workId, status: 'published' },
      orderBy: { createdAt: 'desc' },
      select: { content: true },
    })

    // Extract plain text from Chapt doc format (reuse logic inline — keep lean)
    function extractSample(raw: any, maxChars: number): string {
      let doc: any = raw
      if (typeof doc === 'string') {
        try { doc = JSON.parse(doc) } catch { return (raw as string).slice(0, maxChars) }
      }
      const blocks: any[] = doc?.blocks || doc?.content || []
      if (!Array.isArray(blocks)) return ''
      return blocks
        .map((b: any) => b.text || (Array.isArray(b.lines) ? b.lines.map((l: any) => l.text || '').join(' ') : '') || '')
        .filter(Boolean)
        .join('\n')
        .slice(0, maxChars)
    }

    const firstChapterSample = firstSection ? extractSample(firstSection.content, 2000) : ''
    const latestChapterSample = latestSection && latestSection !== firstSection
      ? extractSample(latestSection.content, 1000)
      : undefined

    // Fetch up to 10 recent comments on this work's sections
    const comments = await prisma.comment.findMany({
      where: {
        section: { workId },
        parentId: null, // top-level only
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { content: true },
    })
    const commentExcerpts = comments.map((c: { content: string }) => c.content)

    const genres: string[] = work.genres ? JSON.parse(work.genres) : []

    const reviewText = await generateCumulativeReview({
      title: work.title,
      genres,
      firstChapterSample,
      latestChapterSample,
      commentExcerpts: commentExcerpts.length > 0 ? commentExcerpts : undefined,
      chapterCount: publishedCount,
    })

    await prisma.qualityAssessment.update({
      where: { id: assessment.id },
      data: {
        cumulativeReview: reviewText,
        cumulativeReviewUpdatedAt: new Date(),
        cumulativeReviewChapterCount: publishedCount,
      },
    })

    console.log(`[CUMULATIVE] Review saved for work ${workId} at ${publishedCount} chapters`)
  } catch (error) {
    // Never throw — this is enhancement only, should not block chapter publish
    console.error('[CUMULATIVE] Failed to generate cumulative review:', error)
  }
}
