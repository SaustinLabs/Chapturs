// ============================================================================
// QUALITY ASSESSMENT SERVICE
// ============================================================================

import { PrismaClient } from '@prisma/client'
import type {
  AssessmentRequest,
  AssessmentPromptContext,
  QualityAssessmentResult,
  QueueItem,
  QueuePriority,
  AssessmentStats,
  LLMMetadata,
} from './types'
import {
  assessContentQuality,
  determineQualityTier,
  getBoostMultiplier,
  calculateBoostExpiry,
  generateBoostReason,
  estimateCost,
  DEFAULT_ASSESSMENT_CONFIG,
} from './llm-service'

const prisma = new PrismaClient()

export class BudgetExceededError extends Error {
  constructor(
    public scope: 'daily' | 'monthly',
    public limitUsd: number,
    public spentUsd: number
  ) {
    super(`Quality assessment ${scope} budget exceeded`)
    this.name = 'BudgetExceededError'
  }
}

function getBudgetCaps() {
  const dailyRaw = process.env.QUALITY_ASSESSMENT_DAILY_BUDGET_USD
  const monthlyRaw = process.env.QUALITY_ASSESSMENT_MONTHLY_BUDGET_USD
  const daily = dailyRaw ? Number(dailyRaw) : undefined
  const monthly = monthlyRaw ? Number(monthlyRaw) : undefined
  return {
    daily: Number.isFinite(daily) ? daily : undefined,
    monthly: Number.isFinite(monthly) ? monthly : undefined,
  }
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

async function getUsageCostSince(start: Date): Promise<number> {
  const result = await prisma.lLMUsageLog.aggregate({
    where: {
      service: 'quality_assessment',
      success: true,
      createdAt: { gte: start },
    },
    _sum: { estimatedCost: true },
  })
  return result._sum.estimatedCost || 0
}

async function enforceBudgetCaps() {
  const caps = getBudgetCaps()
  if (!caps.daily && !caps.monthly) return

  const now = new Date()

  if (caps.daily) {
    const spentToday = await getUsageCostSince(startOfUtcDay(now))
    if (spentToday >= caps.daily) {
      throw new BudgetExceededError('daily', caps.daily, spentToday)
    }
  }

  if (caps.monthly) {
    const spentMonth = await getUsageCostSince(startOfUtcMonth(now))
    if (spentMonth >= caps.monthly) {
      throw new BudgetExceededError('monthly', caps.monthly, spentMonth)
    }
  }
}

/**
 * Add work to quality assessment queue
 */
export async function queueForAssessment(
  request: AssessmentRequest
): Promise<QueueItem> {
  // Check if already queued or assessed
  const existing = await prisma.qualityAssessmentQueue.findFirst({
    where: {
      workId: request.workId,
      sectionId: request.sectionId,
      status: { in: ['queued', 'processing'] },
    },
  })

  if (existing) {
    return existing as unknown as QueueItem
  }

  // Check if already assessed recently
  const recentAssessment = await prisma.qualityAssessment.findUnique({
    where: {
      workId_sectionId: {
        workId: request.workId,
        sectionId: request.sectionId,
      },
    },
  })

  if (recentAssessment) {
    // If assessed within last 7 days, don't re-assess
    const daysSince = (Date.now() - new Date(recentAssessment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 7) {
      throw new Error('Work already assessed recently')
    }
  }

  // Add to queue
  const queueItem = await prisma.qualityAssessmentQueue.create({
    data: {
      workId: request.workId,
      sectionId: request.sectionId,
      priority: request.priority || 'normal',
      status: 'queued',
    },
  })

  return queueItem as unknown as QueueItem
}

/**
 * Process next item in queue (respects rate-limit retry times)
 */
export async function processNextInQueue(): Promise<QualityAssessmentResult | null> {
  // Enforce optional budget caps before doing any work
  await enforceBudgetCaps()

  // Get next queued item (prioritize by: high > normal > low, then oldest first, but skip if retryAfter is in future)
  const now = new Date()
  const queueItem = await prisma.qualityAssessmentQueue.findFirst({
    where: {
      status: 'queued',
      attempts: { lt: 3 }, // Max 3 attempts
      OR: [
        { retryAfter: null },
        { retryAfter: { lte: now } }, // Only items that are ready for retry
      ],
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  })

  if (!queueItem) {
    return null
  }

  // Mark as processing
  await prisma.qualityAssessmentQueue.update({
    where: { id: queueItem.id },
    data: {
      status: 'processing',
      attempts: { increment: 1 },
      lastAttempt: new Date(),
    },
  })

  try {
    // Fetch work and section content
    const section = await prisma.section.findUnique({
      where: { id: queueItem.sectionId },
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

    // Assess with LLM
    const llmResponse = await assessContentQuality(context, DEFAULT_ASSESSMENT_CONFIG)

    // Determine tier and boost
    const tier = determineQualityTier(llmResponse.scores.overallScore, DEFAULT_ASSESSMENT_CONFIG.boostThresholds)
    const boostMultiplier = getBoostMultiplier(tier, DEFAULT_ASSESSMENT_CONFIG.boostMultipliers)
    const boostExpiry = calculateBoostExpiry(DEFAULT_ASSESSMENT_CONFIG.boostDurationDays)
    const boostReason = generateBoostReason(tier, llmResponse.scores.overallScore)

    // Save assessment
    const assessment = await prisma.qualityAssessment.upsert({
      where: {
        workId_sectionId: {
          workId: queueItem.workId,
          sectionId: queueItem.sectionId,
        },
      },
      create: {
        workId: queueItem.workId,
        sectionId: queueItem.sectionId,
        overallScore: llmResponse.scores.overallScore,
        writingQuality: llmResponse.scores.writingQuality,
        storytelling: llmResponse.scores.storytelling,
        characterization: llmResponse.scores.characterization,
        worldBuilding: llmResponse.scores.worldBuilding,
        engagement: llmResponse.scores.engagement,
        originality: llmResponse.scores.originality,
        qualityTier: tier,
        discoveryTags: JSON.stringify(llmResponse.discoveryTags),
        feedbackMessage: llmResponse.feedbackMessage,
        boostMultiplier,
        boostExpiry,
        boostReason,
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
        qualityTier: tier,
        discoveryTags: JSON.stringify(llmResponse.discoveryTags),
        feedbackMessage: llmResponse.feedbackMessage,
        boostMultiplier,
        boostExpiry,
        boostReason,
        model: DEFAULT_ASSESSMENT_CONFIG.model,
        version: '1.0',
        processingTime: llmResponse.processingTime,
        tokenCount: llmResponse.tokenCount,
        updatedAt: new Date(),
      },
    })

    // Log LLM usage
    await prisma.lLMUsageLog.create({
      data: {
        service: 'quality_assessment',
        model: DEFAULT_ASSESSMENT_CONFIG.model,
        promptTokens: Math.round(llmResponse.tokenCount * 0.6),
        completionTokens: Math.round(llmResponse.tokenCount * 0.4),
        totalTokens: llmResponse.tokenCount,
        estimatedCost: estimateCost(llmResponse.tokenCount, DEFAULT_ASSESSMENT_CONFIG.model),
        duration: llmResponse.processingTime,
        success: true,
      },
    })

    // Mark queue item as completed
    await prisma.qualityAssessmentQueue.update({
      where: { id: queueItem.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    return assessment as unknown as QualityAssessmentResult
  } catch (error) {
    console.error('Assessment processing error:', error)

    // Log failure
    await prisma.lLMUsageLog.create({
      data: {
        service: 'quality_assessment',
        model: DEFAULT_ASSESSMENT_CONFIG.model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        duration: 0,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    // Mark queue item as failed
    await prisma.qualityAssessmentQueue.update({
      where: { id: queueItem.id },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    throw error
  }
}

/**
 * Extract text content from .chapt document
 */
function extractTextFromChaptDoc(chaptDoc: any): string {
  if (!chaptDoc.content || !Array.isArray(chaptDoc.content)) {
    return ''
  }

  const textParts: string[] = []

  for (const block of chaptDoc.content) {
    switch (block.type) {
      case 'prose':
      case 'heading':
      case 'narration':
        if (block.text) textParts.push(block.text)
        break
      case 'dialogue':
        if (block.lines) {
          for (const line of block.lines) {
            if (line.text) textParts.push(line.text)
          }
        }
        break
      case 'chat':
        if (block.messages) {
          for (const msg of block.messages) {
            if (msg.text) textParts.push(msg.text)
          }
        }
        break
      case 'phone':
        if (block.content) {
          for (const msg of block.content) {
            if (msg.text) textParts.push(msg.text)
          }
        }
        break
    }
  }

  return textParts.join('\\n\\n')
}

/**
 * Get assessment for a work
 */
export async function getAssessment(
  workId: string,
  sectionId: string
): Promise<QualityAssessmentResult | null> {
  const assessment = await prisma.qualityAssessment.findUnique({
    where: {
      workId_sectionId: { workId, sectionId },
    },
  })

  return assessment as unknown as QualityAssessmentResult | null
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [queued, processing, completed, failed] = await Promise.all([
    prisma.qualityAssessmentQueue.count({ where: { status: 'queued' } }),
    prisma.qualityAssessmentQueue.count({ where: { status: 'processing' } }),
    prisma.qualityAssessmentQueue.count({ where: { status: 'completed' } }),
    prisma.qualityAssessmentQueue.count({ where: { status: 'failed' } }),
  ])

  return { queued, processing, completed, failed, total: queued + processing + completed + failed }
}

/**
 * Get assessment statistics
 */
export async function getAssessmentStats(): Promise<AssessmentStats> {
  const assessments = await prisma.qualityAssessment.findMany({
    select: {
      overallScore: true,
      qualityTier: true,
      processingTime: true,
    },
  })

  const usageLogs = await prisma.lLMUsageLog.findMany({
    where: { service: 'quality_assessment' },
    select: {
      totalTokens: true,
      estimatedCost: true,
      success: true,
    },
  })

  const totalAssessed = assessments.length
  const avgOverallScore = assessments.reduce((sum, a) => sum + a.overallScore, 0) / totalAssessed || 0
  
  const tierDistribution = assessments.reduce((acc, a) => {
    acc[a.qualityTier as keyof typeof acc] = (acc[a.qualityTier as keyof typeof acc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const avgProcessingTime = assessments.reduce((sum, a) => sum + (a.processingTime || 0), 0) / totalAssessed || 0
  const totalTokensUsed = usageLogs.reduce((sum, log) => sum + log.totalTokens, 0)
  const totalCost = usageLogs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0)
  const successRate = usageLogs.filter(log => log.success).length / usageLogs.length || 0

  return {
    totalAssessed,
    avgOverallScore,
    tierDistribution: tierDistribution as any,
    avgProcessingTime,
    totalTokensUsed,
    totalCost,
    successRate,
  }
}

/**
 * Process multiple queue items (for batch processing)
 */
export async function processBatch(limit: number = 10): Promise<QualityAssessmentResult[]> {
  const results: QualityAssessmentResult[] = []

  for (let i = 0; i < limit; i++) {
    try {
      const result = await processNextInQueue()
      if (!result) break
      results.push(result)
    } catch (error) {
      console.error('Batch processing error:', error)
      // Continue with next item
    }
  }

  return results
}
