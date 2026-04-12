export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { ContentValidationService } from '@/lib/ContentValidationService'

// POST /api/works/[id]/validate — dry-run validation check before publish
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId } = await params

    // Verify ownership
    const author = await prisma.author.findUnique({
      where: { userId: session.user.id }
    })
    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
    }

    const work = await prisma.work.findFirst({
      where: { id: workId, authorId: author.id },
      include: {
        sections: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Basic checks
    const checks: Array<{ id: string; label: string; status: 'pass' | 'warn' | 'fail'; message: string }> = []

    // 1. Has content
    if (!work.sections || work.sections.length === 0) {
      checks.push({ id: 'content', label: 'Content', status: 'fail', message: 'Work must have at least one chapter.' })
    } else {
      checks.push({ id: 'content', label: 'Content', status: 'pass', message: `${work.sections.length} chapter(s) ready.` })
    }

    // 2. Minimum word count
    const totalWordCount = work.sections.reduce((sum, s) => sum + (s.wordCount || 0), 0)
    if (totalWordCount < 100) {
      checks.push({ id: 'wordcount', label: 'Minimum Length', status: 'fail', message: `Only ${totalWordCount} words. Need at least 100.` })
    } else if (totalWordCount < 500) {
      checks.push({ id: 'wordcount', label: 'Minimum Length', status: 'warn', message: `${totalWordCount} words. Consider adding more content.` })
    } else {
      checks.push({ id: 'wordcount', label: 'Minimum Length', status: 'pass', message: `${totalWordCount} words.` })
    }

    // 3. Has title
    if (!work.title || work.title.trim().length === 0) {
      checks.push({ id: 'title', label: 'Work Title', status: 'fail', message: 'Work needs a title.' })
    } else {
      checks.push({ id: 'title', label: 'Work Title', status: 'pass', message: `"${work.title}"` })
    }

    // 4. Run content validation on sections
    if (work.sections.length > 0) {
      try {
        const firstSection = work.sections[0]
        const validationResult = await ContentValidationService.validateContent(
          workId,
          firstSection.id,
          firstSection.content,
          {
            checkSafety: true,
            checkQuality: true,
            isFirstChapter: true
          }
        )

        const blockingFlags = (validationResult.flags || []).filter(
          f => !['too_short', 'repetitive_content'].includes(f)
        )

        if (blockingFlags.length > 0) {
          checks.push({
            id: 'validation',
            label: 'Content Safety',
            status: 'fail',
            message: `Issues found: ${blockingFlags.join(', ')}`
          })
        } else {
          checks.push({
            id: 'validation',
            label: 'Content Safety',
            status: 'pass',
            message: 'Content passed safety and quality checks.'
          })
        }

        // Maturity rating warning
        const suggestedRating = validationResult.details?.suggestedRating
        if (suggestedRating === 'R' || suggestedRating === 'NC-17') {
          checks.push({
            id: 'maturity',
            label: 'Maturity Rating',
            status: 'warn',
            message: `Content rated ${suggestedRating} — you'll need to confirm before publishing.`
          })
        }
      } catch (e) {
        checks.push({
          id: 'validation',
          label: 'Content Safety',
          status: 'warn',
          message: 'Validation service unavailable — will retry on publish.'
        })
      }
    }

    const canPublish = !checks.some(c => c.status === 'fail')

    return NextResponse.json({
      canPublish,
      checks,
      wordCount: totalWordCount,
      chapterCount: work.sections.length
    })

  } catch (error) {
    console.error('[VALIDATE] Error:', error)
    return NextResponse.json(
      { error: 'Validation check failed' },
      { status: 500 }
    )
  }
}
