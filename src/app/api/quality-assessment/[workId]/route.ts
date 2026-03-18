export const runtime = 'edge'

// ============================================================================
// QUALITY ASSESSMENT RESULT API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAssessment } from '@/lib/quality-assessment/assessment-service'

/**
 * GET /api/quality-assessment/[workId]?sectionId=xyz
 * Get quality assessment for a work's first chapter
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')

    if (!sectionId) {
      return NextResponse.json(
        { error: 'sectionId is required' },
        { status: 400 }
      )
    }

    const assessment = await getAssessment(params.workId, sectionId)

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const result = {
      ...assessment,
      discoveryTags: JSON.parse(assessment.discoveryTags),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assessment fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    )
  }
}
