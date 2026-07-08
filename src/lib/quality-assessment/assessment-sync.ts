// ============================================================================
// SYNCHRONOUS QUALITY ASSESSMENT WITH RATE-LIMIT HANDLING
// ============================================================================

import { prisma } from '@/lib/database/PrismaService'
import { assessContentQuality, RateLimitError } from './llm-service'
import type { AssessmentPromptContext } from './types'
import { DEFAULT_ASSESSMENT_CONFIG } from './llm-service'

/**
 * Extract text content from Chapt document format
 * Handles all block types: prose, dialogue, chat, phone, narration, heading
 */
function extractTextFromChaptDoc(chaptDoc: any): string {
  if (typeof chaptDoc === 'string') {
    try {
      chaptDoc = JSON.parse(chaptDoc)
    } catch {
      return chaptDoc
    }
  }

  // Handle both "blocks" and "content" array formats
  const blocks = chaptDoc?.blocks || chaptDoc?.content || []
  
  if (!Array.isArray(blocks)) {
    return ''
  }


  return blocks
    .map((block: any, idx: number) => {
      if (!block) return ''

      let text = ''

      switch (block.type) {
        // Direct text fields
        case 'prose':
        case 'narration':
        case 'heading':
          text = block.text || ''
          break

        // Dialogue: extract speaker + text
        case 'dialogue':
          if (Array.isArray(block.lines)) {
            text = block.lines
              .map((line: any) => {
                const speaker = line.speaker ? `${line.speaker}: ` : ''
                return speaker + (line.text || '')
              })
              .join('\n')
          }
          break

        // Chat messages
        case 'chat':
          if (Array.isArray(block.messages)) {
            text = block.messages
              .map((msg: any) => `${msg.user}: ${msg.text}`)
              .join('\n')
          }
          break

        // Phone messages (same structure as chat)
        case 'phone':
          if (Array.isArray(block.content)) {
            text = block.content
              .map((msg: any) => `${msg.user}: ${msg.text}`)
              .join('\n')
          }
          break

        // Image and divider don't have text content
        case 'image':
        case 'divider':
          text = ''
          break

        default:
          text = ''
      }

      if (text) {
      }
      return text
    })
    .filter((text: string) => text)
    .join('\n\n')
}

/**
 * Assess a work synchronously (called during publish)
 * Returns assessment result or null if rate-limited (will queue for retry)
 */
export async function assessWorkSynchronously(
  workId: string,
  sectionId: string
): Promise<{
  success: boolean
  assessment?: any
  rateLimited?: boolean
  message?: string
}> {
  try {

    // Fetch work and section
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            genres: true,
            tags: true,
            formatType: true,
            maturityRating: true,
          },
        },
      },
    })

    if (!section) {
      throw new Error('Section not found')
    }


    // Extract text from Chapt format
    const textContent = extractTextFromChaptDoc(section.content)

    if (textContent.length > 0) {
    }

    if (!textContent || textContent.trim().length < 100) {
      throw new Error('Content too short to assess')
    }

    // Build context for LLM
    const context: AssessmentPromptContext = {
      title: section.work.title,
      genres: section.work.genres ? JSON.parse(section.work.genres) : [],
      tags: section.work.tags ? JSON.parse(section.work.tags) : [],
      formatType: section.work.formatType,
      maturityRating: section.work.maturityRating,
      wordCount: section.wordCount || 0,
      content: textContent,
    }


    // Call OpenRouter API
    const llmResponse = await assessContentQuality(context, DEFAULT_ASSESSMENT_CONFIG)


    // Save assessment to DB
    const assessment = await prisma.qualityAssessment.upsert({
      where: {
        workId_sectionId: {
          workId,
          sectionId,
        },
      },
      create: {
        workId,
        sectionId,
        overallScore: llmResponse.scores.overallScore,
        writingQuality: llmResponse.scores.writingQuality,
        storytelling: llmResponse.scores.storytelling,
        characterization: llmResponse.scores.characterization,
        worldBuilding: llmResponse.scores.worldBuilding,
        engagement: llmResponse.scores.engagement,
        originality: llmResponse.scores.originality,
        qualityTier: llmResponse.qualityTier,
        discoveryTags: JSON.stringify(llmResponse.discoveryTags),
        feedbackMessage: llmResponse.feedbackMessage,
        ...(llmResponse.readerBlurb && { earlyReview: llmResponse.readerBlurb }),
        model: DEFAULT_ASSESSMENT_CONFIG.model,
        version: '1.0',
        processingTime: llmResponse.processingTime,
        tokenCount: llmResponse.tokenCount,
        status: 'active',
      },
      update: {
        overallScore: llmResponse.scores.overallScore,
        writingQuality: llmResponse.scores.writingQuality,
        storytelling: llmResponse.scores.storytelling,
        characterization: llmResponse.scores.characterization,
        worldBuilding: llmResponse.scores.worldBuilding,
        engagement: llmResponse.scores.engagement,
        originality: llmResponse.scores.originality,
        qualityTier: llmResponse.qualityTier,
        discoveryTags: JSON.stringify(llmResponse.discoveryTags),
        feedbackMessage: llmResponse.feedbackMessage,
        ...(llmResponse.readerBlurb && { earlyReview: llmResponse.readerBlurb }),
        processingTime: llmResponse.processingTime,
        tokenCount: llmResponse.tokenCount,
        updatedAt: new Date(),
      },
    })


    return {
      success: true,
      assessment,
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.warn('[ASSESS_SYNC] Rate limited - queueing for retry')

      // Queue for retry with exponential backoff
      try {
        // findFirst + create/update (workId_sectionId unique doesn't exist on schema)
        const existingQ = await prisma.qualityAssessmentQueue.findFirst({ where: { workId, sectionId } });
        if (existingQ) {
          await prisma.qualityAssessmentQueue.update({
            where: { id: existingQ.id },
            data: { priority: 'high', status: 'queued', retryAfter: new Date(Date.now() + error.retryAfter * 1000), attempts: { increment: 1 } }
          });
        } else {
          await prisma.qualityAssessmentQueue.create({
            data: { workId, sectionId, priority: 'high', status: 'queued', retryAfter: new Date(Date.now() + error.retryAfter * 1000) }
          });
        }


        return {
          success: false,
          rateLimited: true,
          message: `Rate limited by OpenRouter API. Assessment will be retried in ${Math.round(error.retryAfter / 60)} minutes.`,
        }
      } catch (queueError) {
        console.error('[ASSESS_SYNC] Failed to queue for retry:', queueError)
        throw queueError
      }
    }

    // Other errors
    console.error('[ASSESS_SYNC] Assessment failed:', error)
    throw error
  }
}
