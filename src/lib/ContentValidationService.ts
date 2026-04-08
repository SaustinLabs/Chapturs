import { prisma } from '@/lib/database/PrismaService'

export interface ValidationResult {
  passed: boolean
  score?: number
  details?: any
  flags?: string[]
}

export interface ContentValidationOptions {
  checkPlagiarism?: boolean
  checkDuplicates?: boolean
  checkSafety?: boolean
  checkQuality?: boolean
  isFirstChapter?: boolean
  skipDatabaseStorage?: boolean // For testing purposes
}

export class ContentValidationService {
  // In-memory cache for safety rules to avoid DB hit on every validation
  private static safetyRulesCache: { data: Record<string, RegExp[]>; expiresAt: number } | null = null
  private static SAFETY_RULES_TTL_MS = 60 * 1000 // 60 seconds

  // Invalidate the in-memory safety rules cache (call from admin API after updates)
  static async invalidateSafetyRulesCache() {
    this.safetyRulesCache = null
    return true
  }

  /**
   * Validate content before publishing
   * For first chapters: comprehensive checks
   * For subsequent chapters: basic checks only
   */
  static async validateContent(
    workId: string,
    sectionId: string | null,
    content: string,
    options: ContentValidationOptions = {}
  ): Promise<ValidationResult> {
    const {
      checkPlagiarism = true,
      checkDuplicates = true,
      checkSafety = true,
      checkQuality = true,
      isFirstChapter = false,
      skipDatabaseStorage = false
    } = options

    const results: ValidationResult[] = []

    // Get work details for image checking
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { maturityRating: true, coverImage: true }
    })

    // Always run safety checks for content
    if (checkSafety) {
      const safetyResult = await this.checkContentSafety(content, workId, work)
      results.push(safetyResult)
    }

    // Check thumbnail/image safety if cover image exists
    if (work?.coverImage && checkSafety) {
      const imageResult = await this.checkImageSafety(work.coverImage, workId)
      results.push(imageResult)
    }

    // Comprehensive checks for first chapter
    if (isFirstChapter) {
      if (checkPlagiarism) {
        const plagiarismResult = await this.checkPlagiarism(content, workId)
        results.push(plagiarismResult)
      }

      if (checkDuplicates) {
        const duplicateResult = await this.checkDuplicates(content, workId)
        results.push(duplicateResult)
      }

      if (checkQuality) {
        const qualityResult = await this.checkContentQuality(content)
        results.push(qualityResult)
      }
    } else {
      // Basic checks for subsequent chapters
      if (checkQuality) {
        const qualityResult = await this.checkContentQuality(content)
        results.push(qualityResult)
      }
    }

    // Combine results
    const overallResult = this.combineValidationResults(results)

    // Store validation result in database (unless in test mode)
    if (!skipDatabaseStorage) {
      await this.storeValidationResult(workId, sectionId, overallResult, options)
    }

    return overallResult
  }

  /**
   * Check for inappropriate content (nudity, violence, etc.)
   */
  private static async checkContentSafety(content: string, workId: string, work?: any): Promise<ValidationResult> {
    // Parse content if it's JSON
    let textContent = content
    try {
      const parsed = JSON.parse(content)
      textContent = parsed.text || content
    } catch {
      // Content is already plain text
    }
    // Try to load active safety rules from DB. If none found, fall back to built-in tiers.
    const flags: string[] = []
    const detectedTiers = new Set<string>()

    const dbTiers: Record<string, RegExp[]> = await this.getSafetyTiersFromRules()

    const tiersToUse = Object.keys(dbTiers).length > 0 ? dbTiers : {
      'PG': [ /\b(darn|heck|crap)\b/gi ],
      'PG-13': [ /\b(shit|damn|bastard)\b/gi ],
      'R': [ /\b(fuck|rape|torture|kill|murder)\b/gi ],
      'NC-17': [ /\b(cunt|nigger|fag|slur)\b/gi ]
    }

    for (const [tier, patterns] of Object.entries(tiersToUse)) {
      for (const pattern of patterns) {
        const matches = textContent.match(pattern)
        if (matches) {
          detectedTiers.add(tier)
          flags.push(...matches.slice(0, 5))
        }
      }
    }

    // Determine suggested maturity rating
    let suggestedRating = work?.maturityRating || 'G'
    // Map detection set (case-insensitive mapping) to rating constants
    if (detectedTiers.has('NC-17') || detectedTiers.has('nc17')) {
      suggestedRating = 'NC-17'
    } else if (detectedTiers.has('R') || detectedTiers.has('r')) {
      suggestedRating = 'R'
    } else if (detectedTiers.has('PG-13') || detectedTiers.has('pg13')) {
      suggestedRating = 'PG-13'
    } else if (detectedTiers.has('PG') || detectedTiers.has('pg')) {
      suggestedRating = 'PG'
    }

    // We DON'T fail purely for profanity; instead we suggest a rating and set flags
    // Other safety checks (images, graphic violence, etc.) may still cause failures elsewhere
    const score = detectedTiers.size === 0 ? 1.0 : Math.max(0.2, 1 - (detectedTiers.size * 0.2))

    return {
      passed: true, // content is allowed; we only recommend a rating
      score,
      details: { flags, suggestedRating, currentRating: work?.maturityRating },
      flags
    }
  }

  /**
   * Check for plagiarism against existing content
   */
  private static async checkPlagiarism(content: string, workId: string): Promise<ValidationResult> {
    // Get all published works for comparison
    const publishedWorks = await prisma.work.findMany({
      where: {
        status: { in: ['published', 'ongoing'] },
        id: { not: workId } // Exclude current work
      },
      select: {
        id: true,
        title: true,
        sections: {
          where: { status: 'published' },
          select: { content: true }
        }
      },
      take: 100 // Limit for performance
    })

    let maxSimilarity = 0
    const similarWorks: any[] = []

    for (const work of publishedWorks) {
      const workContent = (work.sections as any[]).map((s: any) => s.content).join(' ')
      const similarity = this.calculateTextSimilarity(content, workContent)

      if (similarity > 0.7) { // High similarity threshold
        similarWorks.push({
          workId: work.id,
          title: work.title,
          similarity
        })
      }

      maxSimilarity = Math.max(maxSimilarity, similarity)
    }

    return {
      passed: maxSimilarity < 0.8,
      score: 1 - maxSimilarity,
      details: { similarWorks, maxSimilarity },
      flags: similarWorks.length > 0 ? ['high_similarity'] : []
    }
  }

  /**
   * Load safety tiers from ValidationRule entries in DB.
   * Expect rules of type 'safety' with config JSON like: { "tier": "PG-13", "patterns": ["shit","damn"] }
   */
  private static async getSafetyTiersFromRules(): Promise<Record<string, RegExp[]>> {
    // Serve from cache when available and not expired
    const now = Date.now()
    if (this.safetyRulesCache && this.safetyRulesCache.expiresAt > now) {
      return this.safetyRulesCache.data
    }

    try {
      const rules = await prisma.validationRule.findMany({ where: { type: 'safety', isActive: true } })
      const tiers: Record<string, RegExp[]> = {}
      for (const r of rules) {
        try {
          const cfg = JSON.parse(r.config || '{}')
          const tierName = cfg.tier || r.name || 'PG'
          const patterns: string[] = cfg.patterns || []
          tiers[tierName] = tiers[tierName] || []
          for (const p of patterns) {
            try {
              tiers[tierName].push(new RegExp(p, 'gi'))
            } catch (e) {
              // ignore invalid regex
            }
          }
        } catch (e) {
          // ignore invalid rule config
        }
      }

      // Populate cache
      this.safetyRulesCache = { data: tiers, expiresAt: Date.now() + this.SAFETY_RULES_TTL_MS }
      return tiers
    } catch (error) {
      console.error('Failed to load safety rules:', error)
      return {}
    }
  }

  /**
   * Check for duplicate content (exact matches)
   */
  private static async checkDuplicates(content: string, workId: string): Promise<ValidationResult> {
    // Hash content for duplicate detection
    const contentHash = this.hashContent(content)

    // Check if this exact content exists
    const existingSections = await prisma.section.findMany({
      where: {
        workId: { not: workId },
        status: 'published'
      },
      select: { id: true, workId: true }
    })

    // TODO: In a real implementation, you'd store content hashes
    // and check against them for exact duplicates

    return {
      passed: true, // Placeholder - would check hash database
      score: 1.0,
      details: { contentHash },
      flags: []
    }
  }

  /**
   * Check content quality (length, readability, etc.)
   */
  private static async checkContentQuality(content: string): Promise<ValidationResult> {
    const wordCount = content.split(/\s+/).length
    const flags: string[] = []

    // Basic quality checks (lowered to 10 words for MVP testing)
    if (wordCount < 10) {
      flags.push('too_short')
    }

    if (content.length > 50000) { // 50KB limit
      flags.push('too_long')
    }

    // Check for excessive repetition
    const repeatedWords = this.findRepeatedWords(content)
    if (repeatedWords.length > 0) {
      flags.push('repetitive_content')
    }

    const score = Math.max(0, 1 - (flags.length * 0.2))

    return {
      passed: flags.length === 0,
      score,
      details: { wordCount, repeatedWords },
      flags
    }
  }

  /**
   * Store validation result in database
   */
  private static async storeValidationResult(
    workId: string,
    sectionId: string | null,
    result: ValidationResult,
    options: ContentValidationOptions
  ): Promise<void> {
    const validationTypes = []
    if (options.checkPlagiarism) validationTypes.push('plagiarism')
    if (options.checkDuplicates) validationTypes.push('duplicate')
    if (options.checkSafety) validationTypes.push('safety')
    if (options.checkQuality) validationTypes.push('quality')

    for (const type of validationTypes) {
      await prisma.contentValidation.create({
        data: {
          workId: sectionId ? undefined : workId,
          sectionId,
          validationType: type,
          status: result.passed ? 'passed' : 'failed',
          score: result.score,
          details: JSON.stringify(result.details || {})
        }
      })
    }

    // If validation failed and it's the first chapter, add to moderation queue
    if (!result.passed && options.isFirstChapter) {
      await prisma.contentModerationQueue.create({
        data: {
          workId: sectionId ? undefined : workId,
          sectionId,
          priority: result.score && result.score < 0.5 ? 'high' : 'normal',
          reason: `Validation failed: ${result.flags?.join(', ')}`,
          status: 'queued'
        }
      })
    }
  }

  /**
   * Combine multiple validation results
   */
  private static combineValidationResults(results: ValidationResult[]): ValidationResult {
    const allPassed = results.every(r => r.passed)
    const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length
    const allFlags = results.flatMap(r => r.flags || [])
    // Aggregate suggested maturity rating from individual results if present
    const ratingPriority: Record<string, number> = {
      'G': 0,
      'PG': 1,
      'PG-13': 2,
      'R': 3,
      'NC-17': 4
    }

    let highestRating = 'G'
    for (const r of results) {
      const suggested = r.details?.suggestedRating
      if (suggested && ratingPriority[suggested] !== undefined) {
        if (ratingPriority[suggested] > ratingPriority[highestRating]) {
          highestRating = suggested
        }
      }
    }

    return {
      passed: allPassed,
      score: avgScore,
      details: { individualResults: results, suggestedRating: highestRating },
      flags: allFlags
    }
  }

  /**
   * Simple text similarity calculation (cosine similarity on word frequencies)
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = this.getWordFrequency(text1)
    const words2 = this.getWordFrequency(text2)

    const allWords = new Set([...Object.keys(words1), ...Object.keys(words2)])
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (const word of allWords) {
      const freq1 = words1[word] || 0
      const freq2 = words2[word] || 0
      dotProduct += freq1 * freq2
      norm1 += freq1 * freq1
      norm2 += freq2 * freq2
    }

    if (norm1 === 0 || norm2 === 0) return 0

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Get word frequency map
   */
  private static getWordFrequency(text: string): Record<string, number> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)

    const frequency: Record<string, number> = {}
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1
    }

    return frequency
  }

  /**
   * Find excessively repeated words
   */
  private static findRepeatedWords(text: string): string[] {
    const frequency = this.getWordFrequency(text)
    const repeated: string[] = []

    for (const [word, count] of Object.entries(frequency)) {
      if (count > text.split(/\s+/).length * 0.15) { // More than 15% of total words
        repeated.push(word)
      }
    }

    return repeated.slice(0, 10) // Limit results
  }

  /**
   * Simple content hashing for duplicate detection
   */
  private static hashContent(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  /**
   * Check thumbnail/image safety using Google Cloud Vision SafeSearch.
   * Falls back to basic URL/extension validation if the API key is not configured.
   */
  static async checkImageSafety(imageUrl: string, workId: string): Promise<ValidationResult> {
    const flags: string[] = []

    // Validate URL is parseable first
    try {
      new URL(imageUrl)
    } catch {
      return { passed: false, score: 0.0, flags: ['invalid_image_url'], details: { imageUrl } }
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
    if (apiKey) {
      try {
        const visionRes = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{
                image: { source: { imageUri: imageUrl } },
                features: [{ type: 'SAFE_SEARCH_DETECTION' }],
              }],
            }),
            signal: AbortSignal.timeout(8000),
          }
        )

        if (visionRes.ok) {
          const data = await visionRes.json()
          const annotation = data.responses?.[0]?.safeSearchAnnotation
          if (annotation) {
            // Likelihood levels: UNKNOWN, VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
            const HIGH = new Set(['LIKELY', 'VERY_LIKELY'])
            if (HIGH.has(annotation.adult))    flags.push('nsfw_adult')
            if (HIGH.has(annotation.violence)) flags.push('nsfw_violence')
            if (HIGH.has(annotation.racy))     flags.push('nsfw_racy')
            if (HIGH.has(annotation.medical))  flags.push('nsfw_medical')

            return {
              passed: flags.length === 0,
              score: flags.length === 0 ? 1.0 : 0.0,
              flags,
              details: { imageUrl, analysis: 'cloud_vision_safe_search', annotation },
            }
          }
        }
      } catch {
        // Vision API unreachable — fall through to basic check rather than blocking upload
      }
    }

    // Basic fallback: extension check only
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
    const hasAllowedExtension = allowedExtensions.some(ext => imageUrl.toLowerCase().includes(ext))
    if (!hasAllowedExtension) flags.push('invalid_image_format')

    return {
      passed: flags.length === 0,
      score: flags.length === 0 ? 1.0 : 0.0,
      flags,
      details: { imageUrl, analysis: apiKey ? 'vision_api_fallback' : 'basic_url_validation' },
    }
  }
}