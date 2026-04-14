export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/database/PrismaService'
import { resolveDbUserId } from '@/lib/resolveDbUserId'
import { awardPoints, POINTS_EVENT_TYPE } from '@/lib/achievements/points'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/works/[id]/glossary - Create/update glossary entry with chapter versioning
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
      term,
      definition,
      category,
      currentChapter, // Chapter number where this definition is being created
      aliases = [],
      chapters = []
    } = body

    if (!term || !definition) {
      return NextResponse.json(
        { error: 'Term and definition are required' },
        { status: 400 }
      )
    }

    // Verify user owns this work
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { 
        authorId: true,
        author: {
          select: { userId: true }
        }
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const dbUserId = await resolveDbUserId(session)
    if (work.author.userId !== dbUserId) {
      return NextResponse.json({ error: 'Unauthorized - You do not own this work' }, { status: 403 })
    }

    // Find or create the base glossary entry
    let glossaryEntry = await prisma.glossaryEntry.findFirst({
      where: {
        workId,
        term: {
          equals: term,
          mode: 'insensitive'
        }
      }
    })
    const isNewEntry = !glossaryEntry

    if (!glossaryEntry) {
      // Create new glossary entry with initial definition
      // Use raw SQL to avoid Prisma client version conflicts with new fields
      const result = await prisma.$queryRaw`
        INSERT INTO glossary_entries (id, "workId", term, definition, "chapterIntroduced", type, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${workId}, ${term}, ${definition}, ${currentChapter || 1}, 'term', NOW(), NOW())
        RETURNING *
      ` as any[]
      
      glossaryEntry = result[0]
    }

    // Create a new definition version for this chapter
    // Use raw SQL to avoid Prisma client version conflicts
    await prisma.$executeRaw`
      INSERT INTO glossary_definition_versions (id, "glossaryEntryId", definition, "fromChapter", notes, "createdAt")
      VALUES (gen_random_uuid()::text, ${glossaryEntry!.id}, ${definition}, ${currentChapter || 1}, ${'Updated in chapter ' + (currentChapter || 1)}, NOW())
    `

    if (isNewEntry && glossaryEntry) {
      awardPoints(dbUserId, POINTS_EVENT_TYPE.GLOSSARY_ENTRY, 5, (glossaryEntry as any).id).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      entry: glossaryEntry
    })

  } catch (error: any) {
    console.error('Glossary entry creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create glossary entry',
        details: error?.message || 'Unknown error',
        code: error?.code
      },
      { status: 500 }
    )
  }
}

// GET /api/works/[id]/glossary?chapter=X - Get work glossary entries with chapter-aware definitions
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const workId = params.id
    const { searchParams } = new URL(request.url)
    const currentChapter = parseInt(searchParams.get('chapter') || '999999')

    // First, get all glossary entries for this work
    const glossaryEntries = await prisma.$queryRaw`
      SELECT 
        ge.id,
        ge.term,
        ge.definition,
        COALESCE(ge."chapterIntroduced", 1) as "chapterIntroduced",
        COALESCE(ge.type, 'term') as type,
        ge."createdAt"
      FROM glossary_entries ge
      WHERE ge."workId" = ${workId}
      ORDER BY ge."createdAt" ASC
    ` as any[]

    // For each entry, get the most recent applicable definition version
    const entriesWithCorrectDefinitions = await Promise.all(
      (glossaryEntries as any[]).map(async (entry: any) => {
        const versionResult = await prisma.$queryRaw`
          SELECT definition
          FROM glossary_definition_versions
          WHERE "glossaryEntryId" = ${entry.id}
            AND "fromChapter" <= ${currentChapter}
          ORDER BY "fromChapter" DESC
          LIMIT 1
        ` as any[]

        return {
          id: entry.id,
          term: entry.term,
          definition: versionResult.length > 0 ? versionResult[0].definition : entry.definition,
          chapterIntroduced: entry.chapterIntroduced,
          type: entry.type,
          createdAt: entry.createdAt
        }
      })
    )

    return NextResponse.json({
      success: true,
      entries: entriesWithCorrectDefinitions
    })

  } catch (error: any) {
    console.error('Glossary fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch glossary',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
