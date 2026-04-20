export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'
import { canModerateSuggestion } from '@/lib/suggestions/suggestion-permissions'

const VALID_STATUSES = new Set(['pending', 'approved', 'rejected'])

/**
 * GET /api/creator/suggestions/queue?workId=...&status=pending&page=1&pageSize=30
 * Returns creator moderation suggestions grouped by section.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const status = searchParams.get('status') || 'pending'
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 30)))

    if (!workId) {
      return NextResponse.json({ error: 'workId is required' }, { status: 400 })
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Allowed values: pending, approved, rejected' },
        { status: 400 }
      )
    }

    const moderationPermission = await canModerateSuggestion(session.user.id, workId)
    if (!moderationPermission.allowed) {
      return NextResponse.json(
        { error: moderationPermission.reason || 'Forbidden' },
        { status: 403 }
      )
    }

    const where = { workId, status }

    const [total, suggestions] = await Promise.all([
      prisma.editSuggestion.count({ where }),
      prisma.editSuggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          section: {
            select: {
              id: true,
              title: true,
              chapterNumber: true,
            },
          },
        },
      }),
    ])

    const groupedBySection: Array<{
      sectionId: string
      sectionTitle: string
      chapterNumber: number | null
      count: number
      suggestions: typeof suggestions
    }> = []

    const groupMap = new Map<string, number>()
    for (const suggestion of suggestions) {
      const key = suggestion.sectionId
      const existingIndex = groupMap.get(key)

      if (existingIndex === undefined) {
        groupMap.set(key, groupedBySection.length)
        groupedBySection.push({
          sectionId: suggestion.sectionId,
          sectionTitle: suggestion.section?.title || 'Untitled Chapter',
          chapterNumber: suggestion.section?.chapterNumber ?? null,
          count: 1,
          suggestions: [suggestion],
        })
      } else {
        const current = groupedBySection[existingIndex]
        current.count += 1
        current.suggestions.push(suggestion)
      }
    }

    return NextResponse.json({
      status,
      suggestions,
      groupedBySection,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch (error) {
    console.error('Error loading creator suggestion queue:', error)
    return NextResponse.json(
      { error: 'Failed to load suggestion queue' },
      { status: 500 }
    )
  }
}
