export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import DatabaseService, { prisma } from '../../../../../lib/database/PrismaService'
import { ContentValidationService } from '../../../../../lib/ContentValidationService'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/works/[id]/sections - Create new section/chapter
export async function POST(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workId = params.id
    const body = await request.json()
    const {
      title,
      content,
      wordCount,
      status = 'draft'
    } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Only validate if status is 'published', skip for drafts
    if (status === 'published') {
      // Check if this is the first section for validation purposes
      const existingSections = await DatabaseService.getSectionsForWork(workId)
      const isFirstChapter = existingSections.length === 0

      // Validate content based on whether it's the first chapter
      if (isFirstChapter) {
        // Comprehensive validation for first chapter
        try {
          const validationResult = await ContentValidationService.validateContent(
            workId,
            null, // No section ID yet
            content,
            {
              checkPlagiarism: true,
              checkDuplicates: true,
              checkSafety: true,
              checkQuality: true,
              isFirstChapter: true
            }
          )

          if (!validationResult.passed) {
            return NextResponse.json(
              {
                error: 'Content validation failed. Please review and fix the issues.',
                validationErrors: validationResult.flags,
                details: validationResult.details
              },
              { status: 400 }
            )
          }
        } catch (error) {
          console.error('Content validation error:', error)
          return NextResponse.json(
            { error: 'Content validation failed. Please try again.' },
            { status: 500 }
          )
        }
      } else {
        // Basic validation for subsequent chapters
        try {
          const validationResult = await ContentValidationService.validateContent(
            workId,
            null,
            content,
            {
              checkPlagiarism: false,
              checkDuplicates: false,
              checkSafety: true,
              checkQuality: true,
              isFirstChapter: false
            }
          )

          if (!validationResult.passed) {
            return NextResponse.json(
              {
                error: 'Content validation failed. Please review and fix the issues.',
                validationErrors: validationResult.flags,
                details: validationResult.details
              },
              { status: 400 }
            )
          }
        } catch (error) {
          console.error('Content validation error:', error)
          return NextResponse.json(
            { error: 'Content validation failed. Please try again.' },
            { status: 500 }
          )
        }
      }
    }

    // Create section using DatabaseService
    const sectionData = {
      title,
      content,
      wordCount: wordCount || 0,
      status
    }

    const section = await DatabaseService.createSection({
      workId,
      title,
      content,
      wordCount: wordCount || 0,
      status
    })

    // If this is the first published chapter, update work status to published
    if (status === 'published') {
      const work = await prisma.work.findUnique({
        where: { id: workId },
        select: { status: true, _count: { select: { sections: true } } }
      })
      
      if (work && work.status === 'draft' && work._count.sections === 1) {
        await prisma.work.update({
          where: { id: workId },
          data: { status: 'published' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      section
    })

  } catch (error) {
    console.error('Section creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}

// GET /api/works/[id]/sections - Get work sections (public for published sections)
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const workId = params.id
    const session = await auth()

    // Use lightweight list (no content) for the sections index.
    // Individual section content is served by /api/works/[id]/sections/[sectionId].
    const allSections = await DatabaseService.getSectionsList(workId)

    let sections = allSections
    if (!session?.user?.id) {
      sections = allSections.filter((s: any) => s.isPublished || s.status === 'published')
    } else {
      const [work, author] = await Promise.all([
        prisma.work.findUnique({ where: { id: workId }, select: { authorId: true } }),
        prisma.author.findFirst({ where: { userId: session.user.id }, select: { id: true } })
      ])
      const isAuthor = author && work && author.id === work.authorId
      if (!isAuthor) {
        sections = allSections.filter((s: any) => s.isPublished || s.status === 'published')
      }
    }

    const response = NextResponse.json({ success: true, sections })
    // Published chapter lists are public — cache aggressively at the edge
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    return response

  } catch (error) {
    console.error('Sections fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}
