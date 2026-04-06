// ============================================================================
// QUALITY ASSESSMENT SYSTEM - TYPE DEFINITIONS
// ============================================================================

export type QualityTier = 'exceptional' | 'strong' | 'developing' | 'needs_work'

export type QueueStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type QueuePriority = 'low' | 'normal' | 'high'

export interface QualityScores {
  overallScore: number      // 0-100 weighted composite
  writingQuality: number    // Technical writing (grammar, style, clarity)
  storytelling: number      // Narrative structure & pacing
  characterization: number  // Character development & depth
  worldBuilding: number     // Setting, atmosphere, immersion
  engagement: number        // Reader engagement potential
  originality: number       // Uniqueness & creativity
}

export interface QualityAnalysis {
  discoveryTags: string[]       // AI-suggested tags for discoverability
  feedbackMessage: string       // One sentence of feedback for author
  qualityTier: QualityTier     // Overall quality classification
}

export interface AlgorithmBoost {
  boostMultiplier: number      // 1.0 = no boost, >1.0 = boost, <1.0 = suppress
  boostExpiry?: Date           // When boost expires
  boostReason: string          // Explanation for boost level
}

export interface LLMMetadata {
  model: string                // LLM model used
  version: string              // Assessment algorithm version
  processingTime?: number      // Milliseconds
  tokenCount?: number          // Tokens used
  estimatedCost?: number       // USD cost
}

export interface QualityAssessmentResult extends QualityScores, QualityAnalysis, AlgorithmBoost, LLMMetadata {
  id: string
  workId: string
  sectionId: string
  status: 'active' | 'under_review' | 'overridden'
  reviewedBy?: string
  reviewNotes?: string
  createdAt: Date
  updatedAt: Date
}

export interface AssessmentConfig {
  // Content limits
  maxContentLength: number     // Max characters to analyze
  minContentLength: number     // Min characters required
  
  // LLM configuration
  model: string                // Which model to use
  temperature: number          // Creativity vs consistency (0-1)
  maxTokens: number           // Max response tokens
  
  // Scoring weights (should sum to 1.0)
  weights: {
    writingQuality: number
    storytelling: number
    characterization: number
    worldBuilding: number
    engagement: number
    originality: number
  }
  
  // Boost thresholds
  boostThresholds: {
    exceptional: number        // Score needed for highest boost
    strong: number             // Score needed for moderate boost
    developing: number         // Score for neutral
    needs_work: number         // Below this = slight suppress
  }
  
  // Boost multipliers by tier
  boostMultipliers: {
    exceptional: number
    strong: number
    developing: number
    needs_work: number
  }
  
  // Boost duration
  boostDurationDays: number
}

export interface AssessmentRequest {
  workId: string
  sectionId: string
  content: string
  metadata: {
    title: string
    genres: string[]
    tags: string[]
    formatType: string
    maturityRating: string
  }
  priority?: QueuePriority
}

export interface AssessmentPromptContext {
  title: string
  genres: string[]
  tags: string[]
  formatType: string
  maturityRating: string
  wordCount: number
  content: string
}

export interface LLMAssessmentResponse {
  scores: QualityScores
  discoveryTags: string[]
  semanticProfile?: WorkSemanticProfileData  // structured profile for content-based matching
  qualityTier: QualityTier
  feedbackMessage: string
  readerBlurb?: string         // Reader-facing 1-2 sentence description (stored as earlyReview)
  confidence: number           // 0-1 confidence in assessment
  processingTime: number
  tokenCount: number
}

// Structured semantic descriptors extracted by the LLM alongside quality assessment.
// Used for content-based similarity matching via Jaccard distance.
export interface WorkSemanticProfileData {
  tone: string[]        // e.g. ["dark", "hopeful", "bittersweet"]
  themes: string[]      // e.g. ["redemption", "found-family", "political-intrigue"]
  tropes: string[]      // e.g. ["enemies-to-lovers", "chosen-one", "mentor-death"]
  pacing: string        // "slow-burn" | "action-packed" | "measured" | "episodic"
  perspective: string   // "first-person" | "third-limited" | "third-omniscient" | "second-person"
  audience: string      // "young-adult" | "new-adult" | "adult" | "all-ages"
}

export interface QueueItem {
  id: string
  workId: string
  sectionId: string
  priority: QueuePriority
  status: QueueStatus
  attempts: number
  lastAttempt?: Date
  completedAt?: Date
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface AssessmentFeedback {
  assessmentId: string
  workId: string
  feedbackType: 'too_harsh' | 'too_lenient' | 'accurate' | 'missed_issues'
  details?: string
  submittedBy: string
}

export interface AssessmentStats {
  totalAssessed: number
  avgOverallScore: number
  tierDistribution: Record<QualityTier, number>
  avgProcessingTime: number
  totalTokensUsed: number
  totalCost: number
  successRate: number
}
