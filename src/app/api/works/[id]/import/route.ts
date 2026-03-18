export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'

/**
 * POST /api/works/[id]/import
 * Bulk import chapters from a single text file/input
 * Splits by "Chapter" or "Section" markers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const { id: workId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError('Authentication required', 401, ApiErrorType.AUTHENTICATION_ERROR)
    }

    const body = await request.json()
    const { text, splitPattern } = body

    if (!text) {
      throw new ApiError('No text provided for import', 400, ApiErrorType.VALIDATION_ERROR)
    }

    // Default split pattern: Looking for "Chapter [N]" or similar
    const regex = splitPattern ? new RegExp(splitPattern, 'mi') : /^(?:Chapter|Section|Part)\s+(\d+|[IVXLC]+)/mi
    
    // Split the text. We keep the delimiters to know the chapter titles/numbers.
    const parts = text.split(regex)
    // parts[0] is intro text before first chapter
    // chunks will be title, content, title, content...
    
    const sectionsToCreate: any[] = []
    let currentChapterNum = 1

    // Fetch highest existing chapter number to continue
    const lastSection = await prisma.section.findFirst({
      where: { workId },
      orderBy: { chapterNumber: 'desc' }
    })
    if (lastSection) currentChapterNum = (lastSection.chapterNumber || 0) + 1

    // Simple heuristic parser
    // If regex matches groups, they appear in the split array
    // This is a basic version: we'll treat the whole text as one if no split found
    if (parts.length <= 1) {
       sectionsToCreate.push({
         title: 'Imported Chapter',
         content: JSON.stringify([{ type: 'prose', data: { text: text.trim() } }]),
         chapterNumber: currentChapterNum,
         workId,
         status: 'draft'
       })
    } else {
      // Index 0 is prepended text, then chapterNum, then text, then chapterNum...
      for (let i = 1; i < parts.length; i += 2) {
        const title = `Chapter ${parts[i]}`
        const content = parts[i + 1]?.trim() || ''
        
        if (content) {
          sectionsToCreate.push({
            title,
            content: JSON.stringify([{ type: 'prose', data: { text: content } }]),
            chapterNumber: currentChapterNum++,
            workId,
            status: 'draft'
          })
        }
      }
    }

    // Create many
    const created = await Promise.all(
      sectionsToCreate.map(data => prisma.section.create({ data }))
    )

    return createSuccessResponse({ count: created.length }, `Successfully imported ${created.length} chapters`, requestId)
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}
