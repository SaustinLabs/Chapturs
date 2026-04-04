// ============================================================================
// LLM SERVICE FOR QUALITY ASSESSMENT
// ============================================================================

import OpenAI from 'openai'
import type {
  AssessmentPromptContext,
  LLMAssessmentResponse,
  QualityScores,
  AssessmentConfig,
} from './types'

// Lazy initialization of OpenRouter client (OpenAI-compatible)
// This prevents initialization during build time when env vars aren't available
let openRouter: OpenAI | null = null

function getOpenRouterClient(): OpenAI {
  if (!openRouter) {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('[LLM] OPENROUTER_API_KEY is not set in environment variables')
      throw new Error('OPENROUTER_API_KEY not configured. Quality assessment cannot proceed.')
    }
    openRouter = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://chapturs.com',
        'X-Title': 'Chapturs',
      },
    })
  }
  return openRouter
}

// Rate-limit detection and error classification
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number = 60 * 60 * 24, // Default to 24 hours
    public isTemporary: boolean = true
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

function handleLLMError(error: any): never {
  const status = error?.status || error?.response?.status
  
  console.error('[LLM] OpenRouter API error:', {
    status,
    message: error?.message,
    code: error?.code,
  })

  // Handle rate limit errors (429)
  if (status === 429) {
    const retryAfter = error?.response?.headers?.['retry-after']
    const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60 * 60 // 1 hour default
    console.warn('[LLM] Rate limited by OpenRouter. Retry after:', retrySeconds, 'seconds')
    throw new RateLimitError(
      'OpenRouter API rate limit exceeded. Assessment will be retried later.',
      retrySeconds,
      true
    )
  }

  // Handle authentication errors (401, 403)
  if (status === 401 || status === 403) {
    console.error('[LLM] Authentication failed. Check OPENROUTER_API_KEY.')
    throw new Error('Authentication failed. Invalid OPENROUTER_API_KEY.')
  }

  // Handle other errors
  throw new Error(`OpenRouter API error (${status || 'unknown'}): ${error?.message || 'Unknown error'}`)
}

// Default configuration
export const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
  maxContentLength: 50000,  // ~10k words
  minContentLength: 1000,   // ~200 words minimum
  
  model: 'meta-llama/llama-3.3-70b-instruct',  // Using OpenRouter Llama 3.3 70B for superior quality
  temperature: 0.3,  // Lower temperature for consistent grading
  maxTokens: 800,    // Reduced - just scores and tags
  
  weights: {
    writingQuality: 0.25,
    storytelling: 0.20,
    characterization: 0.15,
    worldBuilding: 0.15,
    engagement: 0.15,
    originality: 0.10,
  },
  
  boostThresholds: {
    exceptional: 85,
    strong: 70,
    developing: 50,
    needs_work: 0,
  },
  
  boostMultipliers: {
    exceptional: 1.5,   // 50% boost
    strong: 1.2,        // 20% boost
    developing: 1.0,    // No boost
    needs_work: 0.8,    // 20% suppression
  },
  
  boostDurationDays: 30,
}

/**
 * Generate assessment prompt for LLM
 */
function generateAssessmentPrompt(context: AssessmentPromptContext): string {
  const { title, genres, tags, formatType, maturityRating, wordCount, content } = context

  return `You are an AI quality assessor for a creative writing platform. Your job is to evaluate stories and help great content get discovered by readers.

CONTENT:
Title: ${title}
Format: ${formatType}
Declared Genres: ${genres.join(', ')}
Declared Tags: ${tags.join(', ')}
Rating: ${maturityRating}
Word Count: ${wordCount}

${content}

TASK: Evaluate this work with SCORES ONLY (0-100) and DISCOVERY TAGS.

SCORES (0-100):
1. WRITING_QUALITY: Grammar, prose, clarity
2. STORYTELLING: Plot, pacing, structure
3. CHARACTERIZATION: Character depth & development
4. WORLD_BUILDING: Setting, atmosphere, immersion
5. ENGAGEMENT: Hook, emotional impact, readability
6. ORIGINALITY: Unique voice, fresh ideas

DISCOVERY TAGS:
Your most important job is helping readers find stories they'll love. Analyze the content and suggest DISCOVERY TAGS - these are additional genres, themes, comparisons, tropes, or descriptors that will help the right readers find this story.

Examples:
- "harry-potter-like" if it has similar magical school vibes
- "slow-burn-romance" if romance builds gradually
- "found-family" if that's a theme
- "lgbtq+" if relevant
- "dark-fantasy", "cozy-mystery", "enemies-to-lovers", etc.
- Mood tags: "atmospheric", "action-packed", "emotional", "humorous"
- Audience: "young-adult", "new-adult", "adult"

Be creative and specific. Add 5-15 tags that accurately represent the content and will help it reach the right audience.

AUTHOR FEEDBACK:
If overall score >= 70: Provide ONE encouraging sentence about what's working well
If overall score < 70: Provide ONE constructive tip (gentle, specific, actionable)

READER BLURB:
Write 1-2 sentences a potential reader would see on the story page to decide if they want to read this. Write like a book reviewer — compelling, specific, not generic. Example: "A slow-burn rivals-to-lovers romance set in a morally grey magical academy. Fans of enemies-to-lovers and political intrigue will find it hard to put down."

GUIDELINES:
- "Exceptional" (85+): Rare, standout work
- "Strong" (70-84): Good publication potential
- "Developing" (50-69): Shows promise, needs polish
- "Needs work" (<50): Significant improvement needed
- Focus on storytelling over perfect grammar
- Consider genre conventions
- Look for potential in new writers

Respond ONLY with valid JSON:
{
  "scores": {
    "writingQuality": number,
    "storytelling": number,
    "characterization": number,
    "worldBuilding": number,
    "engagement": number,
    "originality": number
  },
  "discoveryTags": [array of 5-15 string tags],
  "qualityTier": "exceptional" | "strong" | "developing" | "needs_work",
  "feedbackMessage": "one sentence for author",
  "readerBlurb": "1-2 sentence reader-facing description",
  "confidence": number (0-1)
}`
}

/**
 * Call LLM to assess content quality
 * Throws RateLimitError if rate-limited (should be queued for retry)
 * Throws Error for other failures
 */
export async function assessContentQuality(
  context: AssessmentPromptContext,
  config: AssessmentConfig = DEFAULT_ASSESSMENT_CONFIG
): Promise<LLMAssessmentResponse> {
  const startTime = Date.now()

  try {
    console.log('[LLM] Starting assessment for:', context.title)
    
    // Truncate content if too long
    const truncatedContent = context.content.length > config.maxContentLength
      ? context.content.substring(0, config.maxContentLength) + '\n\n[Content truncated...]'
      : context.content

    const truncatedContext = { ...context, content: truncatedContent }

    // Get OpenRouter client (lazy initialization)
    const client = getOpenRouterClient()

    console.log('[LLM] Calling OpenRouter API with model:', config.model)

    // Call OpenRouter API (OpenAI-compatible)
    const response = await client.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [
        {
          role: 'system',
          content: 'You are an AI quality assessor that evaluates creative writing and suggests discovery tags. Respond only with JSON.',
        },
        {
          role: 'user',
          content: generateAssessmentPrompt(truncatedContext),
        },
      ],
      response_format: { type: 'json_object' },
    }).catch((error) => {
      handleLLMError(error) // This throws
    })

    const processingTime = Date.now() - startTime
    const usage = response.usage

    if (!usage) {
      throw new Error('No usage data returned from OpenRouter')
    }

    console.log('[LLM] Assessment complete in', processingTime, 'ms. Tokens:', usage.total_tokens)

    // Parse response
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenRouter response')
    }

    const parsed = JSON.parse(content)

    // Validate parsed structure
    if (!parsed.scores || typeof parsed.scores !== 'object') {
      throw new Error('Invalid scores structure in OpenRouter response')
    }

    // Calculate overall score
    const scores: QualityScores = parsed.scores
    const overallScore = calculateOverallScore(scores, config.weights)
    scores.overallScore = overallScore

    console.log('[LLM] Assessment result - Overall score:', overallScore, 'Tier:', parsed.qualityTier)

    // Return structured response
    return {
      scores: { ...scores, overallScore },
      discoveryTags: parsed.discoveryTags || [],
      qualityTier: parsed.qualityTier,
      feedbackMessage: parsed.feedbackMessage,
      readerBlurb: parsed.readerBlurb,
      confidence: parsed.confidence || 0.8,
      processingTime,
      tokenCount: usage.total_tokens,
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.warn('[LLM] Rate limit error - will retry later')
      throw error
    }
    console.error('[LLM] Assessment failed:', error)
    throw new Error(`Failed to assess content quality: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate weighted overall score
 */
function calculateOverallScore(
  scores: Omit<QualityScores, 'overallScore'>,
  weights: AssessmentConfig['weights']
): number {
  return Math.round(
    scores.writingQuality * weights.writingQuality +
    scores.storytelling * weights.storytelling +
    scores.characterization * weights.characterization +
    scores.worldBuilding * weights.worldBuilding +
    scores.engagement * weights.engagement +
    scores.originality * weights.originality
  )
}

/**
 * Determine quality tier from score
 */
export function determineQualityTier(
  score: number,
  thresholds: AssessmentConfig['boostThresholds']
): 'exceptional' | 'strong' | 'developing' | 'needs_work' {
  if (score >= thresholds.exceptional) return 'exceptional'
  if (score >= thresholds.strong) return 'strong'
  if (score >= thresholds.developing) return 'developing'
  return 'needs_work'
}

/**
 * Get boost multiplier for quality tier
 */
export function getBoostMultiplier(
  tier: 'exceptional' | 'strong' | 'developing' | 'needs_work',
  multipliers: AssessmentConfig['boostMultipliers']
): number {
  return multipliers[tier] || 1.0
}

/**
 * Calculate boost expiry date
 */
export function calculateBoostExpiry(durationDays: number): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + durationDays)
  return expiry
}

/**
 * Generate boost reason based on assessment
 */
export function generateBoostReason(
  tier: 'exceptional' | 'strong' | 'developing' | 'needs_work',
  overallScore: number
): string {
  switch (tier) {
    case 'exceptional':
      return `Exceptional quality (score: ${overallScore}). Standout work with high reader engagement potential.`
    case 'strong':
      return `Strong quality (score: ${overallScore}). Well-crafted work with clear publication potential.`
    case 'developing':
      return `Developing (score: ${overallScore}). Shows promise with room for growth.`
    case 'needs_work':
      return `Needs development (score: ${overallScore}). Significant improvement needed before recommendation.`
    default:
      return `Quality tier: ${tier}, score: ${overallScore}`
  }
}

/**
 * Estimate cost of assessment
 */
export function estimateCost(tokenCount: number, model: string): number {
  // OpenRouter Llama 3.3 70B pricing: ~$0.59/1M input tokens, $0.79/1M output tokens
  // Rough estimate: 70% input, 30% output
  const inputTokens = Math.round(tokenCount * 0.7)
  const outputTokens = Math.round(tokenCount * 0.3)
  
  const inputCost = (inputTokens / 1000000) * 0.59
  const outputCost = (outputTokens / 1000000) * 0.79
  
  return inputCost + outputCost
}

// ============================================================================
// CUMULATIVE REVIEW GENERATION
// ============================================================================

export interface CumulativeReviewContext {
  title: string
  genres: string[]
  firstChapterSample: string   // First 2000 chars of chapter 1 for context
  latestChapterSample?: string // First 1000 chars of the most recent chapter
  commentExcerpts?: string[]   // Up to 10 reader comment snippets (80 chars each)
  chapterCount: number
}

/**
 * Generate a cumulative reader-voice summary of a work.
 * Called at chapter milestones (5, 10, 20, 50). Token-lean: ~200 output tokens.
 */
export async function generateCumulativeReview(
  context: CumulativeReviewContext
): Promise<string> {
  const { title, genres, firstChapterSample, latestChapterSample, commentExcerpts, chapterCount } = context

  const hasComments = commentExcerpts && commentExcerpts.length > 0

  const commentsSection = hasComments
    ? `\nREADER COMMENTS (excerpts):\n${commentExcerpts!.slice(0, 10).map(c => `- "${c.slice(0, 80)}"`).join('\n')}`
    : ''

  const latestSection = latestChapterSample
    ? `\nRECENT CHAPTER EXCERPT:\n${latestChapterSample.slice(0, 1000)}\n`
    : ''

  const instruction = hasComments
    ? 'Use reader voice: e.g. "Readers have praised the world-building and sharp dialogue, though some note the pacing picks up after chapter 3."'
    : 'Use reviewer voice: e.g. "A dark fantasy with a morally grey protagonist and intricate political scheming. Fans of slow-burn power dynamics will find plenty to sink into."'

  const prompt = [
    'You are summarizing reader reception of a webnovel for its story page.',
    '',
    `Title: ${title}`,
    `Genres: ${genres.join(', ')}`,
    `Chapters published: ${chapterCount}`,
    '',
    'OPENING EXCERPT:',
    firstChapterSample.slice(0, 2000),
    latestSection,
    commentsSection,
    '',
    'Task: Write a 2-3 sentence summary that helps a new reader decide if this story is for them.',
    instruction,
    '',
    'Return ONLY the summary text, no labels or JSON.',
  ].join('\n')

  const client = getOpenRouterClient()
  const response = await client.chat.completions.create({
    model: 'meta-llama/llama-3.1-8b-instruct',  // Fast + cheap for short summaries
    temperature: 0.5,
    max_tokens: 200,
    messages: [
      { role: 'system', content: 'You write concise reader-voice summaries for story pages. Output only the summary text, no extra formatting.' },
      { role: 'user', content: prompt },
    ],
  })

  const text = response.choices[0]?.message?.content?.trim()
  if (!text) throw new Error('Empty response from OpenRouter for cumulative review')
  return text
}
