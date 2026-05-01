/**
 * Advanced Recommendation Engine for Chapturs
 * 
 * Implements a multi-signal recommendation system similar to YouTube/TikTok algorithms
 * Features:
 * - Multiple signal collection (views, time, interactions, behavior patterns)
 * - Collaborative filtering + Content-based filtering
 * - Real-time learning and adaptation
 * - A/B testing framework for algorithm optimization
 */

import { User, Work, FeedItem } from '@/types'
import { prisma } from '@/lib/database/PrismaService'

// === SIGNAL TYPES === //

export interface UserSignal {
  userId: string
  workId: string
  signalType: SignalType
  value: number
  metadata?: Record<string, any>
  timestamp: Date
}

export enum SignalType {
  // Engagement Signals
  VIEW = 'view',
  LIKE = 'like', 
  BOOKMARK = 'bookmark',
  SUBSCRIBE = 'subscribe',
  SHARE = 'share',
  
  // Behavioral Signals  
  TIME_SPENT = 'time_spent',
  SCROLL_DEPTH = 'scroll_depth',
  READING_SPEED = 'reading_speed',
  COMPLETION_RATE = 'completion_rate',
  RETURN_VISIT = 'return_visit',
  
  // Content Signals
  GENRE_AFFINITY = 'genre_affinity',
  FORMAT_PREFERENCE = 'format_preference',
  LENGTH_PREFERENCE = 'length_preference',
  MATURITY_COMFORT = 'maturity_comfort',
  
  // Social Signals
  AUTHOR_FOLLOW = 'author_follow',
  SIMILAR_USER_PATTERN = 'similar_user_pattern',
  
  // Search & Discovery
  SEARCH_QUERY = 'search_query',
  FILTER_USAGE = 'filter_usage',
  BROWSE_PATTERN = 'browse_pattern'
}

// === USER BEHAVIOR PROFILING === //

export interface UserProfile {
  userId: string
  
  // Content Preferences (weighted by engagement)
  genreAffinities: Map<string, number>      // Genre -> affinity score (0-1)
  formatPreferences: Map<string, number>    // Format -> preference score (0-1)
  lengthPreferences: {
    shortForm: number    // < 5k words
    mediumForm: number   // 5k-20k words  
    longForm: number     // > 20k words
  }
  
  // Behavioral Patterns
  readingPatterns: {
    averageSessionLength: number     // minutes
    peakReadingHours: number[]      // hours of day (0-23)
    completionRate: number          // 0-1
    returnRate: number              // 0-1
    scrollSpeed: number             // words per minute
  }
  
  // Social Behavior
  socialEngagement: {
    likesGiven: number
    sharesGiven: number
    subscriptionsCount: number
    discoveryOpenness: number       // willingness to try new content (0-1)
  }
  
  // Quality Indicators
  contentQualityPreference: number  // preference for highly-rated content (0-1)
  freshnessPreference: number       // preference for new vs established content (0-1)
  
  lastUpdated: Date
}

// === RECOMMENDATION ALGORITHMS === //

export class RecommendationEngine {
  
  // === SIGNAL COLLECTION === //
  
  /**
   * Record a user interaction signal
   */
  static async recordSignal(signal: UserSignal): Promise<void> {
    try {
      // Store in time-series database (could be Redis for real-time, Postgres for persistence)
      await this.storeSignal(signal)
      
      // Update user profile in real-time
      await this.updateUserProfile(signal.userId, signal)
      
      // Trigger real-time recommendation refresh if high-value signal
      if (this.isHighValueSignal(signal.signalType)) {
        await this.refreshUserRecommendations(signal.userId)
      }
    } catch (error) {
      console.error('Failed to record signal:', error)
    }
  }
  
  /**
   * Batch record multiple signals (for performance)
   */
  static async recordSignals(signals: UserSignal[]): Promise<void> {
    const batches = this.chunkArray(signals, 100) // Process in batches of 100
    
    for (const batch of batches) {
      await Promise.all(batch.map(signal => this.recordSignal(signal)))
    }
  }
  
  // === USER PROFILING === //
  
  /**
   * Build comprehensive user profile from historical signals
   */
  static async buildUserProfile(userId: string): Promise<UserProfile> {
    // Get user's historical data
    const [readingHistory, bookmarks, likes, subscriptions, signals] = await Promise.all([
      this.getUserReadingHistory(userId),
      this.getUserBookmarks(userId),
      this.getUserLikes(userId), 
      this.getUserSubscriptions(userId),
      this.getUserSignals(userId, 90) // Last 90 days
    ])
    
    // Calculate genre affinities based on engagement
    const genreAffinities = this.calculateGenreAffinities(readingHistory, likes, signals)
    
    // Calculate format preferences
    const formatPreferences = this.calculateFormatPreferences(readingHistory, signals)
    
    // Analyze behavioral patterns
    const readingPatterns = this.analyzeReadingPatterns(readingHistory, signals)
    
    // Social engagement analysis
    const socialEngagement = this.analyzeSocialEngagement(likes, bookmarks, subscriptions, signals)
    
    return {
      userId,
      genreAffinities,
      formatPreferences,
      lengthPreferences: this.calculateLengthPreferences(readingHistory),
      readingPatterns,
      socialEngagement,
      contentQualityPreference: this.calculateQualityPreference(likes, readingHistory),
      freshnessPreference: this.calculateFreshnessPreference(readingHistory),
      lastUpdated: new Date()
    }
  }
  
  // === RECOMMENDATION GENERATION === //
  
  /**
   * Generate personalized recommendations using hybrid approach
   */
  static async generateRecommendations(
    userId: string, 
    limit: number = 20,
    diversityFactor: number = 0.3 // 0 = all similar, 1 = maximum diversity
  ): Promise<FeedItem[]> {
    
    // Get user profile
    const userProfile = await this.getUserProfile(userId)
    
    // Get candidate works (exclude already consumed)
    const candidates = await this.getCandidateWorks(userId)
    
    // Apply multiple recommendation algorithms
    const [
      contentBasedScores,
      collaborativeScores,
      trendingScores,
      diversityScores,
      qualityScores
    ] = await Promise.all([
      this.contentBasedRecommendations(userProfile, candidates),
      this.collaborativeFilteringRecommendations(userId, candidates),
      this.trendingContentRecommendations(candidates),
      this.diversityRecommendations(userProfile, candidates),
      this.qualityBasedRecommendations(candidates)
    ])
    
    // Combine scores with weighted ensemble
    const combinedScores = this.combineRecommendationScores({
      contentBased: { scores: contentBasedScores, weight: 0.35 },
      collaborative: { scores: collaborativeScores, weight: 0.25 },
      trending: { scores: trendingScores, weight: 0.15 },
      diversity: { scores: diversityScores, weight: diversityFactor },
      quality: { scores: qualityScores, weight: 0.25 - diversityFactor }
    })
    
    // Apply business rules and filters
    const filteredRecommendations = await this.applyBusinessRules(combinedScores, userProfile)
    
    // Rank and select top recommendations
    const topRecommendations = filteredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    // Convert to FeedItem format
    return this.convertToFeedItems(topRecommendations, 'algorithmic')
  }
  
  // === CONTENT-BASED FILTERING === //
  
  /**
   * Recommend based on content similarity to user preferences
   */
  private static async contentBasedRecommendations(
    userProfile: UserProfile, 
    candidates: Work[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>()
    
    for (const work of candidates) {
      let score = 0
      
      // Genre matching (weighted by user affinity)
      for (const genre of work.genres) {
        const affinity = userProfile.genreAffinities.get(genre) || 0
        score += affinity * 0.4
      }
      
      // Format matching
      const formatScore = userProfile.formatPreferences.get(work.formatType) || 0.5
      score += formatScore * 0.2
      
      // Length preference matching
      const lengthScore = this.calculateLengthScore(work, userProfile.lengthPreferences)
      score += lengthScore * 0.15
      
      // Quality preference matching
      const qualityScore = this.calculateWorkQuality(work)
      score += qualityScore * userProfile.contentQualityPreference * 0.15
      
      // Freshness preference
      const freshnessScore = this.calculateWorkFreshness(work)
      score += freshnessScore * userProfile.freshnessPreference * 0.1
      
      scores.set(work.id, Math.min(score, 1.0)) // Cap at 1.0
    }
    
    return scores
  }
  
  // === COLLABORATIVE FILTERING === //
  
  /**
   * Recommend based on similar users' preferences
   */
  private static async collaborativeFilteringRecommendations(
    userId: string,
    candidates: Work[]
  ): Promise<Map<string, number>> {
    // Find users with similar reading patterns
    const similarUsers = await this.findSimilarUsers(userId, 50)
    
    const scores = new Map<string, number>()
    
    for (const work of candidates) {
      let score = 0
      let weight = 0
      
      for (const { userId: similarUserId, similarity } of similarUsers) {
        // Get similar user's interaction with this work
        const interaction = await this.getUserWorkInteraction(similarUserId, work.id)
        
        if (interaction) {
          // Weight by user similarity and interaction strength
          const interactionScore = this.calculateInteractionScore(interaction)
          score += similarity * interactionScore
          weight += similarity
        }
      }
      
      // Normalize by total weight
      scores.set(work.id, weight > 0 ? score / weight : 0)
    }
    
    return scores
  }
  
  // === REAL-TIME LEARNING === //
  
  /**
   * Update recommendations based on real-time user feedback
   */
  static async updateRecommendationsFromFeedback(
    userId: string,
    workId: string,
    feedback: 'positive' | 'negative' | 'neutral',
    context: 'view' | 'like' | 'bookmark' | 'skip' | 'block'
  ): Promise<void> {
    // Record feedback signal
    await this.recordSignal({
      userId,
      workId,
      signalType: SignalType.COMPLETION_RATE,
      value: feedback === 'positive' ? 1 : feedback === 'negative' ? -1 : 0,
      metadata: { context, feedbackType: feedback },
      timestamp: new Date()
    })
    
    // Immediate profile update for high-impact signals
    if (context === 'like' || context === 'block') {
      await this.updateUserProfile(userId, {
        userId,
        workId,
        signalType: context === 'like' ? SignalType.LIKE : SignalType.BROWSE_PATTERN,
        value: context === 'like' ? 1 : -1,
        timestamp: new Date()
      })
    }
    
    // Trigger recommendation refresh
    await this.refreshUserRecommendations(userId)
  }
  
  // === A/B TESTING FRAMEWORK === //
  
  /**
   * A/B test different recommendation algorithms
   */
  static async getRecommendationsWithABTest(
    userId: string,
    limit: number = 20
  ): Promise<{ items: FeedItem[], experiment: string }> {
    const userExperiment = await this.getUserExperimentGroup(userId)
    
    let recommendations: FeedItem[]
    
    switch (userExperiment) {
      case 'control':
        recommendations = await this.generateRecommendations(userId, limit, 0.3)
        break
      case 'high_diversity':
        recommendations = await this.generateRecommendations(userId, limit, 0.6)
        break
      case 'content_focused':
        recommendations = await this.generateContentFocusedRecommendations(userId, limit)
        break
      case 'social_focused':
        recommendations = await this.generateSocialFocusedRecommendations(userId, limit)
        break
      default:
        recommendations = await this.generateRecommendations(userId, limit, 0.3)
    }
    
    // Log experiment exposure for analysis
    await this.logExperimentExposure(userId, userExperiment, recommendations.map(r => r.work.id))
    
    return {
      items: recommendations,
      experiment: userExperiment
    }
  }
  
  // === UTILITY METHODS === //
  
  private static isHighValueSignal(signalType: SignalType): boolean {
    return [
      SignalType.LIKE,
      SignalType.BOOKMARK,
      SignalType.SUBSCRIBE,
      SignalType.COMPLETION_RATE
    ].includes(signalType)
  }
  
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  // --- Minimal stubs to satisfy callers and allow incremental typing ---
  private static async getUserReadingHistory(userId: string): Promise<any[]> {
    return prisma.readingHistory.findMany({
      where: { userId },
      include: { work: true },
      orderBy: { readAt: 'desc' },
      take: 50,
    }) as any
  }

  private static async getUserBookmarks(userId: string): Promise<any[]> {
    return prisma.bookmark.findMany({
      where: { userId },
      include: { work: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }) as any
  }

  private static async getUserLikes(userId: string): Promise<any[]> {
    return prisma.like.findMany({
      where: { userId },
      include: { work: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }) as any
  }

  private static async getUserSubscriptions(userId: string): Promise<any[]> {
    return prisma.subscription.findMany({
      where: { userId },
      include: { authorProfile: true },
    }) as any
  }

  private static async getUserSignals(userId: string, days: number): Promise<UserSignal[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return prisma.userSignal.findMany({
      where: { userId, timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
    }) as any
  }

  private static calculateFormatPreferences(readingHistory: any[], signals: UserSignal[]): Map<string, number> {
    const map = new Map<string, number>()
    
    // Count format interactions from reading history
    for (const entry of readingHistory) {
      if (entry.work?.formatType) {
        map.set(entry.work.formatType, (map.get(entry.work.formatType) || 0) + 1)
      }
    }
    
    // Weight by signal values
    for (const sig of signals) {
      if (sig.metadata?.formatType && sig.value > 0) {
        map.set(sig.metadata.formatType, (map.get(sig.metadata.formatType) || 0) + sig.value * 2)
      }
    }
    
    // Normalize to 0-1 range
    const maxVal = Math.max(...map.values(), 1)
    for (const [fmt, val] of map.entries()) {
      map.set(fmt, Math.min(val / maxVal, 1))
    }
    
    return map
  }

  private static analyzeReadingPatterns(readingHistory: any[], signals: UserSignal[]) {
    const totalSessions = readingHistory.length || 1
    
    // Calculate average session length from duration-based signals
    let totalDuration = 0
    let durationCount = 0
    for (const sig of signals) {
      if ((sig.signalType as string) === 'view_duration' && sig.value > 0) {
        const actualMs = sig.metadata?.actualDurationMs || sig.value * 1800000 // default 30 min
        totalDuration += actualMs / (1000 * 60) // convert to minutes
        durationCount++
      }
    }
    
    // Calculate peak reading hours from timestamps
    const hourCounts = new Map<number, number>()
    for (const sig of signals) {
      if (sig.timestamp) {
        const hour = sig.timestamp.getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      }
    }
    
    const peakHours: number[] = []
    for (const [hour, count] of [...hourCounts.entries()]) {
      if (count >= Math.max(...[...hourCounts.values()], 1) * 0.5) {
        peakHours.push(hour)
      }
    }
    
    // Calculate completion rate from signals
    const completionSignals = signals.filter(s => (s.signalType as string) === 'completion_rate')
    const avgCompletion = completionSignals.length > 0
      ? completionSignals.reduce((sum, s) => sum + s.value, 0) / completionSignals.length
      : 0.5
    
    return {
      averageSessionLength: durationCount > 0 ? totalDuration / durationCount : 10,
      peakReadingHours: peakHours.length > 0 ? peakHours.slice(0, 3) : [20],
      completionRate: avgCompletion,
      returnRate: readingHistory.length > 5 ? Math.min(readingHistory.length / 20, 1) : 0.2,
      scrollSpeed: 200 // default words per minute
    }
  }

  private static analyzeSocialEngagement(likes: any[], bookmarks: any[], subscriptions: any[], signals: UserSignal[]) {
    const discoverySignals = signals.filter(s => {
      const st = s.signalType as string
      return st === 'click_through' || st === 'browse_category'
    })
    return {
      likesGiven: likes.length,
      sharesGiven: 0, // would need share tracking implementation
      subscriptionsCount: subscriptions.length,
      discoveryOpenness: Math.min(discoverySignals.length / 10, 1) // more clicks = more open to new content
    }
  }

  private static calculateLengthPreferences(readingHistory: any[]) {
    let short = 0, medium = 0, long = 0
    
    for (const entry of readingHistory) {
      const wordCount = entry.work?.wordCount || 10000 // default to medium
      if (wordCount < 5000) short++
      else if (wordCount < 20000) medium++
      else long++
    }
    
    const total = Math.max(short + medium + long, 1)
    return {
      shortForm: short / total,
      mediumForm: medium / total,
      longForm: long / total
    }
  }

  private static calculateQualityPreference(likes: any[], readingHistory: any[]) {
    // Users who like content with high engagement tend to prefer quality
    if (readingHistory.length === 0) return 0.5
    
    let qualityScore = 0
    for (const entry of readingHistory) {
      const work = entry.work as any
      if (work && work._count) {
        const score = Math.min((work._count.likes || 0 + (work._count.bookmarks || 0) * 2) / 100, 1)
        qualityScore += score
      }
    }
    
    return Math.min(qualityScore / readingHistory.length, 1)
  }

  private static calculateFreshnessPreference(readingHistory: any[]) {
    if (readingHistory.length === 0) return 0.5
    
    let recentCount = 0
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    for (const entry of readingHistory) {
      if ((entry.work as any)?.createdAt > thirtyDaysAgo) {
        recentCount++
      }
    }
    
    return Math.min(recentCount / readingHistory.length, 1)
  }

  private static async trendingContentRecommendations(candidates: Work[]): Promise<Map<string, number>> {
    const m = new Map<string, number>()
    for (const c of candidates) {
      // Use actual engagement metrics if available
      const score = Math.min(
        ((c as any)._count?.likes || 0) * 0.3 + 
        ((c as any)._count?.bookmarks || 0) * 0.5,
        1
      ) / 20
      m.set(c.id, Math.max(score, 0.1))
    }
    return m
  }

  private static async diversityRecommendations(userProfile: UserProfile, candidates: Work[]): Promise<Map<string, number>> {
    const m = new Map<string, number>()
    
    // Give bonus to works from genres the user hasn't explored much
    for (const c of candidates) {
      let score = 0.05
      
      // Check if any genre is unfamiliar
      const familiarGenres = [...userProfile.genreAffinities.keys()]
      const unfamiliarCount = c.genres.filter(g => !familiarGenres.includes(g)).length
      
      if (unfamiliarCount > 0) {
        score += (unfamiliarCount / Math.max(c.genres.length, 1)) * 0.2 // Diversity bonus
      }
      
      m.set(c.id, score)
    }
    
    return m
  }

  private static async qualityBasedRecommendations(candidates: Work[]): Promise<Map<string, number>> {
    const m = new Map<string, number>()
    for (const c of candidates) {
      // Quality based on engagement ratio
      const likes = (c as any)._count?.likes || 0
      const bookmarks = (c as any)._count?.bookmarks || 0
      const score = Math.min((likes + bookmarks * 2) / 50, 1)
      m.set(c.id, score)
    }
    return m
  }

  private static async applyBusinessRules(scores: Map<string, number>, userProfile: UserProfile) {
    // Convert map to array of {id, score}
    const arr = Array.from(scores.entries()).map(([id, score]) => ({ id, score }))
    
    // Filter out works the user has already interacted with (would need history check)
    return arr.filter(r => r.score > 0.05) // Minimum relevance threshold
  }

  private static convertToFeedItems(recommendations: any[], source: string): FeedItem[] {
    const items: FeedItem[] = []
    
    for (const rec of recommendations) {
      try {
        items.push({
          id: `rec-${rec.id}`,
          work: {
            id: rec.id,
            title: '',
            description: '',
            formatType: 'novel' as any,
            coverImage: null,
            status: 'published',
            maturityRating: 'PG' as any,
            genres: [],
            tags: [],
            author: { id: '', username: '', displayName: '', avatar: '', verified: false },
            statistics: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            authorId: ''
          } as Work,
          score: rec.score || 0,
          feedType: source as any,
          readingStatus: 'unread' as const,
          addedToFeedAt: new Date()
        })
      } catch {
        // skip works with invalid data
      }
    }
    
    return items.sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  private static calculateLengthScore(work: Work, prefs: any) {
    const wordCount = (work as any).wordCount || 10000
    
    if (wordCount < 5000) return Math.max(prefs.shortForm, 0.3)
    if (wordCount < 20000) return Math.max(prefs.mediumForm, 0.3)
    return Math.max(prefs.longForm, 0.3)
  }

  private static calculateWorkQuality(work: Work): number {
    const likes = (work as any)._count?.likes || work.statistics?.likes || 0
    const bookmarks = (work as any)._count?.bookmarks || work.statistics?.bookmarks || 0
    return Math.min((likes + bookmarks * 2) / 50, 1)
  }

  private static calculateWorkFreshness(work: Work): number {
    const daysSinceCreated = (Date.now() - work.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, 1 - (daysSinceCreated / 30)) // Decay over 30 days
  }

  private static async findSimilarUsers(userId: string, limit: number): Promise<{ userId: string; similarity: number }[]> {
    // Find works the current user has interacted with (likes + bookmarks).
    const [myLikes, myBookmarks] = await Promise.all([
      prisma.like.findMany({ where: { userId }, select: { workId: true } }),
      prisma.bookmark.findMany({ where: { userId }, select: { workId: true } })
    ])

    const myWorkIds = [...new Set([
      ...myLikes.map(l => l.workId),
      ...myBookmarks.map(b => b.workId)
    ])]

    if (myWorkIds.length === 0) return []

    // Find other users who touched the same works — one query.
    const [otherLikes, otherBookmarks] = await Promise.all([
      prisma.like.findMany({
        where: { workId: { in: myWorkIds }, userId: { not: userId } },
        select: { userId: true, workId: true }
      }),
      prisma.bookmark.findMany({
        where: { workId: { in: myWorkIds }, userId: { not: userId } },
        select: { userId: true, workId: true }
      })
    ])

    // Count overlap per other user
    const overlap = new Map<string, Set<string>>()
    for (const r of [...otherLikes, ...otherBookmarks]) {
      if (!overlap.has(r.userId)) overlap.set(r.userId, new Set())
      overlap.get(r.userId)!.add(r.workId)
    }

    // Jaccard similarity: |intersection| / |myWorkIds|
    const results: { userId: string; similarity: number }[] = []
    for (const [uid, sharedWorks] of overlap) {
      results.push({ userId: uid, similarity: sharedWorks.size / myWorkIds.length })
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  private static async getUserWorkInteraction(userId: string, workId: string): Promise<any> {
    const [like, bookmark] = await Promise.all([
      prisma.like.findFirst({ where: { userId, workId }, select: { id: true } }),
      prisma.bookmark.findFirst({ where: { userId, workId }, select: { id: true } })
    ])
    
    if (like) return { type: 'like', strength: 0.4 }
    if (bookmark) return { type: 'bookmark', strength: 0.3 }
    return null
  }

  private static calculateInteractionScore(interaction: any): number {
    return interaction.strength || 0
  }

  private static async getCandidateWorks(userId: string): Promise<Work[]> {
    // Get works user hasn't interacted with
    const history = await prisma.readingHistory.findMany({
      where: { userId },
      select: { workId: true }
    })
    
    const excludedIds = history.map((h: any) => h.workId)
    
    return prisma.work.findMany({
      where: {
        id: { notIn: excludedIds.length > 0 ? excludedIds : [''] },
        status: { in: ['published', 'ongoing', 'completed'] }
      },
      include: {
        author: { include: { user: true } },
        _count: { select: { likes: true, bookmarks: true, sections: true } }
      },
      take: 200
    }) as any
  }

  private static async getUserProfile(userId: string): Promise<UserProfile> {
    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    
    if (!profile) {
      // Return default profile for new users (cold start)
      return {
        userId,
        genreAffinities: new Map(),
        formatPreferences: new Map(),
        lengthPreferences: { shortForm: 0.3, mediumForm: 0.4, longForm: 0.3 },
        readingPatterns: { averageSessionLength: 15, peakReadingHours: [20], completionRate: 0.6, returnRate: 0.3, scrollSpeed: 200 },
        socialEngagement: { likesGiven: 0, sharesGiven: 0, subscriptionsCount: 0, discoveryOpenness: 0.5 },
        contentQualityPreference: 0.5,
        freshnessPreference: 0.5,
        lastUpdated: new Date()
      } as UserProfile
    }
    
    // Parse stored profile
    const genreAffinities = new Map<string, number>()
    const formatPreferences = new Map<string, number>()
    
    try {
      const ga = JSON.parse(profile.genreAffinities || '{}') as Record<string, number>
      for (const [k, v] of Object.entries(ga)) genreAffinities.set(k, v)
    } catch { /* ignore */ }
    
    try {
      const fp = JSON.parse(profile.formatPreferences || '{}') as Record<string, number>
      for (const [k, v] of Object.entries(fp)) formatPreferences.set(k, v)
    } catch { /* ignore */ }
    
    return {
      userId,
      genreAffinities,
      formatPreferences,
      lengthPreferences: { shortForm: 0.3, mediumForm: 0.4, longForm: 0.3 },
      readingPatterns: { averageSessionLength: 15, peakReadingHours: [20], completionRate: 0.6, returnRate: 0.3, scrollSpeed: 200 },
      socialEngagement: { likesGiven: 0, sharesGiven: 0, subscriptionsCount: 0, discoveryOpenness: profile.diversityPreference ?? 0.5 },
      contentQualityPreference: profile.qualityPreference ?? 0.5,
      freshnessPreference: (profile as any).freshnessPreference ?? 0.5,
      lastUpdated: new Date()
    } as UserProfile
  }

  private static async refreshUserRecommendations(userId: string): Promise<void> {
    // Invalidate cached recommendations for this user
    await prisma.recommendationCache.deleteMany({ where: { userId } }).catch(() => {})
  }

  private static async getUserExperimentGroup(userId: string): Promise<string> {
    return 'control' // Default to control group; A/B test assignment would go here
  }

  private static async logExperimentExposure(_userId: string, _experiment: string, _workIds: string[]): Promise<void> {
    // Log experiment exposure for analysis (would write to a metrics table)
  }

  private static async generateContentFocusedRecommendations(userId: string, limit: number): Promise<FeedItem[]> {
    return this.generateRecommendations(userId, limit, 0.15)
  }

  private static async generateSocialFocusedRecommendations(userId: string, limit: number): Promise<FeedItem[]> {
    return this.generateRecommendations(userId, limit, 0.45)
  }

  // === PLACEHOLDER IMPLEMENTATIONS === //
  // These would be implemented with actual database queries and ML models
  
  private static async storeSignal(signal: UserSignal): Promise<void> {
    // Implementation: Store in time-series DB or analytics table
  }
  
  private static async updateUserProfile(userId: string, signal: UserSignal): Promise<void> {
    // Implementation: Real-time profile updates
  }

  private static combineRecommendationScores(
    scoreSets: Record<string, { scores: Map<string, number>, weight: number }>
  ): Map<string, number> {
    const combined = new Map<string, number>()
    const allWorkIds = new Set<string>()
    
    Object.values(scoreSets).forEach(({ scores }) => {
      scores.forEach((_, workId) => allWorkIds.add(workId))
    })
    
    for (const workId of [...allWorkIds]) {
      let totalScore = 0
      let totalWeight = 0
      
      Object.values(scoreSets).forEach(({ scores, weight }) => {
        const score = scores.get(workId) || 0
        totalScore += score * weight
        totalWeight += weight
      })
      
      combined.set(workId, totalWeight > 0 ? totalScore / totalWeight : 0)
    }
    
    return combined
  }

  private static calculateGenreAffinities(
    readingHistory: any[],
    likes: any[],
    signals: UserSignal[]
  ): Map<string, number> {
    const map = new Map<string, number>()
    for (const entry of readingHistory) {
      if (entry.work?.genres) {
        for (const genre of entry.work.genres) {
          map.set(genre, (map.get(genre) || 0) + 1)
        }
      }
    }
    return map
  }
}

export default RecommendationEngine