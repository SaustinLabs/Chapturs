export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { ContentValidationService } from '@/lib/ContentValidationService'

// POST /api/test/moderation - Test content validation
export async function POST(request: NextRequest) {
  try {
    const { content, imageUrl, isFirstChapter = false } = await request.json()

    if (!content && !imageUrl) {
      return NextResponse.json({ error: 'Content or image URL is required' }, { status: 400 })
    }

    const results = []

    // Test content validation if provided
    if (content) {
      const contentResult = await ContentValidationService.validateContent(
        'test-work-id',
        null,
        content,
        {
          checkPlagiarism: isFirstChapter,
          checkDuplicates: isFirstChapter,
          checkSafety: true,
          checkQuality: true,
          isFirstChapter,
          skipDatabaseStorage: true // Don't save test results to database
        }
      )
      results.push({ type: 'content', result: contentResult })
    }

    // Test image safety if provided
    if (imageUrl) {
      const imageResult = await ContentValidationService['checkImageSafety'](imageUrl, 'test-work-id')
      results.push({ type: 'image', result: imageResult })
    }

    // Combine results
    const overallPassed = results.every(r => r.result.passed)
    const overallScore = results.reduce((sum, r) => sum + (r.result.score || 0), 0) / results.length
    const allFlags = results.flatMap(r => r.result.flags || [])

    return NextResponse.json({
      success: true,
      validation: {
        passed: overallPassed,
        score: overallScore,
        flags: allFlags,
        details: { individualResults: results }
      }
    })

  } catch (error) {
    console.error('Content validation test error:', error)
    return NextResponse.json(
      { error: 'Validation test failed' },
      { status: 500 }
    )
  }
}