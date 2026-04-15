export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../auth'
import DatabaseService, { prisma } from '../../../../../../lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'
import { assessWorkSynchronously } from '@/lib/quality-assessment/assessment-sync'
import { maybeTriggerCumulativeReview } from '@/lib/quality-assessment/cumulative-review'
import { notifyNewChapter } from '@/lib/email'
import { createNotification } from '@/lib/notifications'
import { awardPoints, checkAndAwardFoundingCreator, POINTS_EVENT_TYPE } from '@/lib/achievements/points'

function parseCollaboratorPermissions(raw: string | null | undefined) {
  if (!raw) return { canEdit: false, canPublish: false }
  try {
    const parsed = JSON.parse(raw)
    return {
      canEdit: !!parsed.canEdit,
      canPublish: !!parsed.canPublish,
    }
  } catch {
    return { canEdit: false, canPublish: false }
  }
}

interface RouteParams {
  params: Promise<{
    id: string
    sectionId: string
  }>
}

// GET /api/works/[id]/sections/[sectionId] - Fetch a single section with full content
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params
  try {
    const { id: workId, sectionId } = params

    const section = await prisma.section.findFirst({
      where: { id: sectionId, workId }
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Only published sections are publicly accessible; authors can read drafts
    if (section.status !== 'published') {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const author = await prisma.author.findFirst({
        where: { userId: session.user.id },
        select: { id: true }
      })
      const work = await prisma.work.findUnique({
        where: { id: workId },
        select: { authorId: true }
      })
      if (!author || !work || author.id !== work.authorId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    let content: any
    try {
      content = typeof section.content === 'string' ? JSON.parse(section.content) : section.content
    } catch {
      content = section.content
    }

    const payload = {
      id: section.id,
      workId: section.workId,
      title: section.title,
      chapterNumber: section.chapterNumber ?? 1,
      orderIndex: section.orderIndex ?? 0,
      content,
      wordCount: section.wordCount || 0,
      estimatedReadTime: Math.ceil((section.wordCount || 0) / 200),
      publishedAt: section.publishedAt?.toISOString(),
      isPublished: section.status === 'published',
      status: section.status,
    }

    const response = NextResponse.json({ success: true, section: payload })
    // Published chapters are immutable public content — cache heavily at the edge
    if (section.status === 'published') {
      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
    }
    return response

  } catch (error) {
    console.error('Section fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 })
  }
}

// PATCH /api/works/[id]/sections/[sectionId] - Update existing section
export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workId = params.id
    const sectionId = params.sectionId
    const body = await request.json()
    const { title, content, wordCount, status } = body

    // Resolve the canonical DB user ID — handles re-auth JWT ID mismatch
    let dbUserId = session.user.id
    if (session.user.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
      if (dbUser) dbUserId = dbUser.id
    }

    // Verify the work belongs to the user
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: true,
        collaborators: {
          where: {
            userId: dbUserId,
            status: 'active',
          },
          select: {
            permissions: true,
          },
          take: 1,
        },
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const isAuthor = work.author.userId === dbUserId
    const collaborator = work.collaborators[0]
    const collaboratorPermissions = parseCollaboratorPermissions(collaborator?.permissions)

    if (!isAuthor && !collaboratorPermissions.canEdit) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (status === 'published' && !isAuthor && !collaboratorPermissions.canPublish) {
      return NextResponse.json({ error: 'Forbidden: publish permission required' }, { status: 403 })
    }

    // Verify the section belongs to this work
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        workId: workId
      }
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Update the section
    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(wordCount !== undefined && { wordCount }),
        ...(status !== undefined && { status }),
        updatedAt: new Date()
      }
    })

    // If section is being published, run quality assessment (first chapter only) + milestone review
    let assessment = null
    let rateLimited = false
    if (status === 'published') {
      // Count already-published sections for this work (excludes the one we just published)
      const publishedCount = await prisma.section.count({
        where: { workId, status: 'published' },
      })

      const isFirstChapter = publishedCount === 1 // the section we just updated is now counted

      if (isFirstChapter) {
        console.log('[SECTIONS] First chapter published, running LLM assessment for:', { workId, sectionId })
        try {
          assessment = await assessWorkSynchronously(workId, sectionId)
          rateLimited = assessment.rateLimited || false
        } catch (assessmentError) {
          console.error('[SECTIONS] Assessment error:', assessmentError)
        }
      }

      // Fire-and-forget cumulative review at milestones
      maybeTriggerCumulativeReview(workId, publishedCount).catch(() => {})
    }

    // Fire-and-forget chapter notification to all subscribers
    if (status === 'published') {
      ;(async () => {
        try {
          const fullWork = await prisma.work.findUnique({
            where: { id: workId },
            include: {
              author: {
                include: {
                  user: { select: { displayName: true } },
                  subscriptions: {
                    where: { notificationsEnabled: true },
                    include: { user: { select: { id: true, email: true, displayName: true } } },
                  },
                },
              },
            },
          })
          if (!fullWork) return
          const authorName = fullWork.author.user.displayName ?? 'An author'
          for (const sub of fullWork.author.subscriptions) {
            // In-app notification (doesn't require email)
            await createNotification({
              userId: sub.userId,
              type: 'new_chapter',
              title: `New chapter: ${updatedSection.title}`,
              message: `${authorName} published a new chapter of "${fullWork.title}"`,
              url: `/story/${fullWork.id}/chapter/${updatedSection.id}`,
            })
            // Email notification
            if (!sub.user.email) continue
            await notifyNewChapter({
              subscriberEmail: sub.user.email,
              subscriberName: sub.user.displayName ?? 'Reader',
              authorDisplayName: authorName,
              workTitle: fullWork.title,
              workId: fullWork.id,
              chapterTitle: updatedSection.title,
              chapterId: updatedSection.id,
            })
          }
        } catch (err) {
          console.error('[notify] New chapter notification failed:', err)
        }
      })()

      awardPoints(dbUserId, POINTS_EVENT_TYPE.CHAPTER_PUBLISHED, 10, sectionId).catch(() => {})
      checkAndAwardFoundingCreator(dbUserId, sectionId).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      section: updatedSection,
      ...(assessment && { assessment }),
      ...(rateLimited && { rateLimited: true })
    })

  } catch (error) {
    console.error('Section update error:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

// DELETE /api/works/[id]/sections/[sectionId] - Delete section
export async function DELETE(request: NextRequest, props: RouteParams) {
  const params = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workId = params.id
    const sectionId = params.sectionId

    // Resolve canonical DB user ID (handles re-auth JWT mismatch)
    const dbUserId = await resolveDbUserId(session)

    // Verify the work belongs to the user
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: { author: true }
    })

    if (!work || work.author.userId !== dbUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify the section belongs to this work
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        workId: workId
      }
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Delete the section
    await prisma.section.delete({
      where: { id: sectionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully'
    })

  } catch (error) {
    console.error('Section deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}
