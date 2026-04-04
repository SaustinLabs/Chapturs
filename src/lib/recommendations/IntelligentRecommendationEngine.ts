/**
 * Intelligent Recommendation System for Chapturs
 * 
 * Implements practical recommendation algorithms using collected signals
 * Provides multiple recommendation strategies similar to YouTube/TikTok
 */

import { Work, FeedItem, User } from '@/types'
import { prisma } from '@/lib/database/PrismaService'
import { SignalTracker, SignalType, UserSignal } from './SignalTracker'

// === RECOMMENDATION TYPES === //

export interface RecommendationScore {
  workId: string
  score: number
  reasons: string[]
  confidence: number
  source: 'content_based' | 'collaborative' | 'trending' | 'hybrid'
}

export interface RecommendationSettings {
  diversityWeight: number      // 0-1, higher = more diverse recommendations
  freshnessWeight: number      // 0-1, higher = prefer newer content  
  qualityThreshold: number     // 0-1, minimum quality score to recommend
  excludeGenres?: string[]     // Genres to exclude
  maxMaturityRating?: string   // Maximum maturity level
  preferredFormats?: string[]  // Preferred content formats
}

// === MAIN RECOMMENDATION ENGINE === //

export class IntelligentRecommendationEngine {
  
  /**
   * Generate personalized recommendations for user
   */
  static async generatePersonalizedFeed(
    userId: string,
    limit: number = 20,
    settings?: RecommendationSettings
  ): Promise<FeedItem[]> {
    const defaultSettings: RecommendationSettings = {
      diversityWeight: 0.3,
      freshnessWeight: 0.2,
      qualityThreshold: 0.3,
      ...settings
    }
    
    try {
      // Get user behavior analytics
      const userAnalytics = await SignalTracker.getUserBehaviorAnalytics(userId, 30)
      
      // Get candidate works (exclude already consumed)
      const candidates = await this.getCandidateWorks(userId, settings)
      
      if (candidates.length === 0) {
        return this.getFallbackRecommendations(limit)
      }
      
      // Generate recommendations using multiple strategies
      const recommendations = await Promise.all([
        this.contentBasedRecommendations(userId, candidates, userAnalytics),
        this.collaborativeFilteringRecommendations(userId, candidates),
        this.trendingRecommendations(candidates),
        this.similarityBasedRecommendations(userId, candidates)
      ])
      
      // Combine and rank recommendations
      const combinedRecommendations = this.combineRecommendationStrategies(
        recommendations,
        defaultSettings
      )
      
      // Apply diversity and quality filters
      const finalRecommendations = this.applyFinalFilters(
        combinedRecommendations,
        defaultSettings,
        limit
      )
      
      // Convert to FeedItems
      const feedItems = await this.convertToFeedItems(finalRecommendations)
      
      // Track recommendation exposure for learning
      await this.trackRecommendationExposure(userId, feedItems)
      
      return feedItems
      
    } catch (error) {
      console.error('Failed to generate personalized recommendations:', error)
      try {
        return await this.getFallbackRecommendations(limit)
      } catch (fallbackError) {
        console.error('getFallbackRecommendations also failed:', fallbackError)
        return []
      }
    }
  }
  
  // === CONTENT-BASED RECOMMENDATIONS === //
  
  /**
   * Recommend based on user's past interactions and preferences
   */
  private static async contentBasedRecommendations(
    userId: string,
    candidates: Work[],
    userAnalytics: any
  ): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = []
    
    // Get user's interaction history
    const userHistory = await this.getUserContentHistory(userId)
    
    for (const work of candidates) {
      let score = 0
      const reasons: string[] = []
      
      // Genre affinity matching
      const genreScore = this.calculateGenreAffinity(work.genres, userAnalytics.genreAffinities)
      if (genreScore > 0.3) {
        score += genreScore * 0.4
        reasons.push(`Matches your interest in ${work.genres.join(', ')}`)
      }
      
      // Format preference matching
      const formatScore = userAnalytics.formatPreferences.get(work.formatType) || 0.5
      score += formatScore * 0.2
      
      // Author familiarity
      const authorScore = await this.calculateAuthorAffinity(userId, work.authorId)
      if (authorScore > 0.1) {
        score += authorScore * 0.15
        reasons.push('From an author you\'ve enjoyed before')
      }
      
      // Content quality score
      const qualityScore = this.calculateContentQuality(work)
      score += qualityScore * 0.15
      
      // Freshness factor
      const freshnessScore = this.calculateFreshnessScore(work)
      score += freshnessScore * 0.1
      
      // Normalize score
      score = Math.min(score, 1.0)
      
      if (score > 0.1) { // Minimum threshold
        recommendations.push({
          workId: work.id,
          score,
          reasons,
          confidence: score,
          source: 'content_based'
        })
      }
    }
    
    return recommendations.sort((a, b) => b.score - a.score)
  }
  
  // === COLLABORATIVE FILTERING === //

  /**
   * Recommend based on similar users' preferences.
   *
   * The idea: "readers whose taste overlaps with yours also liked X, so you probably will too."
   *
   * Safe implementation guarantee: we issue exactly 2 DB queries regardless of how
   * many similar users or candidate works there are:
   *   1. Fetch similar users (their overlap with the current user's likes/bookmarks).
   *   2. Fetch ALL interactions those users have had with ALL candidate works in one query.
   * Everything else is in-memory computation.
   */
  private static async collaborativeFilteringRecommendations(
    userId: string,
    candidates: Work[]
  ): Promise<RecommendationScore[]> {
    if (candidates.length === 0) return []

    // --- Step 1: Find similar users (2 queries, returns at most `limit` rows) ---
    const similarUsers = await this.findSimilarUsers(userId, 20)
    if (similarUsers.length === 0) return []

    const similarUserIds = similarUsers.map(u => u.userId)
    const candidateWorkIds = candidates.map(w => w.id)

    // Build a similarity lookup: similarUserId -> similarity score
    const similarityMap = new Map(similarUsers.map(u => [u.userId, u.similarity]))

    // --- Step 2: ONE batched query for all (user, work) interactions ---
    // We fetch likes, bookmarks, and reading history in parallel but each
    // as a single query covering all similar users × all candidate works.
    const [likes, bookmarks, histories] = await Promise.all([
      prisma.like.findMany({
        where: { userId: { in: similarUserIds }, workId: { in: candidateWorkIds } },
        select: { userId: true, workId: true }
      }),
      prisma.bookmark.findMany({
        where: { userId: { in: similarUserIds }, workId: { in: candidateWorkIds } },
        select: { userId: true, workId: true }
      }),
      prisma.readingHistory.findMany({
        where: { userId: { in: similarUserIds }, workId: { in: candidateWorkIds } },
        select: { userId: true, workId: true, progress: true }
      })
    ])

    // --- Step 3: Build an in-memory interaction map: workId -> Map<userId, rating> ---
    // rating = weighted sum of signals (like=0.4, bookmark=0.3, read>50%=0.3)
    const interactionMap = new Map<string, Map<string, number>>()

    const ensureWork = (wId: string) => {
      if (!interactionMap.has(wId)) interactionMap.set(wId, new Map())
      return interactionMap.get(wId)!
    }
    const addSignal = (workId: string, uId: string, signal: number) => {
      const m = ensureWork(workId)
      m.set(uId, (m.get(uId) ?? 0) + signal)
    }

    for (const l of likes)     addSignal(l.workId, l.userId, 0.4)
    for (const b of bookmarks) addSignal(b.workId, b.userId, 0.3)
    for (const h of histories) {
      if (h.progress > 0.5) addSignal(h.workId, h.userId, 0.3)
    }

    // --- Step 4: Score each candidate in memory ---
    const recommendations: RecommendationScore[] = []

    for (const work of candidates) {
      const userInteractions = interactionMap.get(work.id)
      if (!userInteractions || userInteractions.size === 0) continue

      let weightedScore = 0
      let totalSimilarity = 0

      for (const [simUserId, rating] of userInteractions) {
        const similarity = similarityMap.get(simUserId) ?? 0
        if (rating > 0.5) {
          weightedScore += similarity * rating
          totalSimilarity += similarity
        }
      }

      if (totalSimilarity > 0) {
        const score = Math.min(weightedScore / totalSimilarity, 1.0)
        recommendations.push({
          workId: work.id,
          score,
          reasons: [`Readers with similar taste enjoyed this`],
          confidence: Math.min(totalSimilarity, 1.0),
          source: 'collaborative'
        })
      }
    }

    return recommendations.sort((a, b) => b.score - a.score)
  }
  
  // === TRENDING RECOMMENDATIONS === //
  
  /**
   * Recommend currently trending/popular content
   */
  private static async trendingRecommendations(candidates: Work[]): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = []
    
    for (const work of candidates) {
      // Calculate trending score based on recent engagement
      const trendingScore = await this.calculateTrendingScore(work)
      
      if (trendingScore > 0.3) {
        recommendations.push({
          workId: work.id,
          score: trendingScore,
          reasons: ['Trending now', `${Math.round(trendingScore * 100)}% engagement boost`],
          confidence: 0.7,
          source: 'trending'
        })
      }
    }
    
    return recommendations.sort((a, b) => b.score - a.score)
  }
  
  // === SIMILARITY-BASED RECOMMENDATIONS === //
  
  /**
   * Recommend content similar to user's liked content
   */
  private static async similarityBasedRecommendations(
    userId: string,
    candidates: Work[]
  ): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = []
    
    // Get user's highly-rated content
    const likedWorks = await this.getUserLikedWorks(userId)
    
    if (likedWorks.length === 0) {
      return recommendations
    }
    
    for (const work of candidates) {
      let maxSimilarity = 0
      let bestMatch = ''
      
      // Find most similar liked work
      for (const likedWork of likedWorks) {
        const similarity = this.calculateContentSimilarity(work, likedWork)
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity
          bestMatch = likedWork.title
        }
      }
      
      if (maxSimilarity > 0.4) {
        recommendations.push({
          workId: work.id,
          score: maxSimilarity,
          reasons: [`Similar to "${bestMatch}" which you liked`],
          confidence: maxSimilarity,
          source: 'content_based'
        })
      }
    }
    
    return recommendations.sort((a, b) => b.score - a.score)
  }
  
  // === RECOMMENDATION COMBINATION === //
  
  /**
   * Intelligently combine multiple recommendation strategies
   */
  private static combineRecommendationStrategies(
    strategies: RecommendationScore[][],
    settings: RecommendationSettings
  ): RecommendationScore[] {
    const [contentBased, collaborative, trending, similarity] = strategies
    
    // Weight each strategy based on effectiveness and user preferences
    const weights = {
      content_based: 0.4,
      collaborative: 0.25,
      trending: settings.freshnessWeight,
      similarity: 0.35 - settings.freshnessWeight
    }
    
    const combinedScores = new Map<string, {
      totalScore: number,
      totalWeight: number,
      reasons: string[],
      sources: string[]
    }>()
    
    // Combine scores from all strategies
    const allRecommendations = [
      ...contentBased.map(r => ({...r, weight: weights.content_based})),
      ...collaborative.map(r => ({...r, weight: weights.collaborative})), 
      ...trending.map(r => ({...r, weight: weights.trending})),
      ...similarity.map(r => ({...r, weight: weights.similarity}))
    ]
    
    for (const rec of allRecommendations) {
      const existing = combinedScores.get(rec.workId) || {
        totalScore: 0,
        totalWeight: 0,
        reasons: [],
        sources: []
      }
      
      existing.totalScore += rec.score * rec.weight
      existing.totalWeight += rec.weight
      existing.reasons.push(...rec.reasons)
      existing.sources.push(rec.source)
      
      combinedScores.set(rec.workId, existing)
    }
    
    // Convert to final recommendations
    const finalRecommendations: RecommendationScore[] = []
    
    for (const [workId, data] of combinedScores) {
      const finalScore = data.totalWeight > 0 ? data.totalScore / data.totalWeight : 0
      
      finalRecommendations.push({
        workId,
        score: finalScore,
        reasons: [...new Set(data.reasons)], // Remove duplicates
        confidence: data.totalWeight,
        source: 'hybrid'
      })
    }
    
    return finalRecommendations.sort((a, b) => b.score - a.score)
  }
  
  // === UTILITY METHODS === //
  
  private static async getCandidateWorks(
    userId: string,
    settings?: RecommendationSettings
  ): Promise<Work[]> {
    // Get works user hasn't interacted with
    const userHistory = await prisma.readingHistory.findMany({
      where: { userId },
      select: { workId: true }
    })
    
  const excludedIds = userHistory.map((h: any) => h.workId)
    
    return prisma.work.findMany({
      where: {
        id: { notIn: excludedIds },
        status: { in: ['published', 'ongoing', 'completed'] },
        ...(settings?.excludeGenres && {
          genres: { not: { hasSome: settings.excludeGenres } }
        }),
        ...(settings?.maxMaturityRating && {
          maturityRating: { lte: settings.maxMaturityRating }
        }),
        ...(settings?.preferredFormats && {
          formatType: { in: settings.preferredFormats }
        })
      },
      include: {
        author: {
          include: { user: true }
        },
        _count: {
          select: {
            likes: true,
            bookmarks: true,
            sections: true
          }
        }
      },
      take: 200 // Limit candidate pool for performance
    })
  }
  
  private static async getFallbackRecommendations(limit: number): Promise<FeedItem[]> {
    // Return high-quality popular content as fallback
    const popularWorks = await prisma.work.findMany({
      where: {
        status: { in: ['published', 'ongoing', 'completed'] }
      },
      include: {
        author: { include: { user: true } },
        _count: { select: { likes: true, bookmarks: true, sections: true } }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })
    
    return this.worksToFeedItems(popularWorks, 'discovery')
  }
  
  private static async convertToFeedItems(
    recommendations: RecommendationScore[]
  ): Promise<FeedItem[]> {
    const workIds = recommendations.map(r => r.workId)
    
    const works = await prisma.work.findMany({
      where: { id: { in: workIds } },
      include: {
        author: { include: { user: true } },
        _count: { select: { likes: true, bookmarks: true, sections: true } }
      }
    })
    
  return works.map((work: any) => {
      const rec = recommendations.find(r => r.workId === work.id)!
      
      return {
        id: `rec-${work.id}`,
        work: this.transformWorkForFeed(work),
        feedType: 'algorithmic' as const,
        reason: rec.reasons.join(', ') || 'Recommended for you',
        score: rec.score,
        readingStatus: 'unread' as const,
        addedToFeedAt: new Date(),
        bookmark: false,
        liked: false
      }
  }).sort((a: any, b: any) => b.score - a.score)
  }
  
  private static worksToFeedItems(works: any[], feedType: string): FeedItem[] {
    const items: FeedItem[] = []
    for (const work of works) {
      try {
        items.push({
          id: `${feedType}-${work.id}`,
          work: this.transformWorkForFeed(work),
          feedType: feedType as any,
          reason: 'Popular content',
          // Deterministic popularity score — prevents feed shuffle on every reload
          score: Math.min(
            ((work._count?.likes ?? 0) + (work._count?.bookmarks ?? 0) * 2) / 200,
            1
          ),
          readingStatus: 'unread' as const,
          addedToFeedAt: new Date(),
          bookmark: false,
          liked: false
        })
      } catch {
        // skip works with invalid data (e.g. deleted author)
      }
    }
    return items
  }
  
  private static safeJsonParse(str: string | null | undefined, fallback: any): any {
    try { return str ? JSON.parse(str) : fallback } catch { return fallback }
  }

  private static transformWorkForFeed(work: any): Work {
    if (!work.author || !work.author.user) {
      throw new Error(`Work ${work.id} has no valid author — skipping`)
    }
    return {
      id: work.id,
      title: work.title,
      description: work.description,
      authorId: work.authorId,
      formatType: work.formatType,
      coverImage: work.coverImage,
      status: work.status,
      maturityRating: work.maturityRating,
      genres: this.safeJsonParse(work.genres, []),
      tags: this.safeJsonParse(work.tags, []),
      languages: [],
      thumbnails: [],
      sections: [],
      glossary: [],
      author: {
        id: work.author.id,
        username: work.author.user.username,
        displayName: work.author.user.displayName,
        avatar: work.author.user.avatar,
        verified: work.author.verified,
        bio: work.author.user.bio,
        socialLinks: [],
        statistics: {
          totalWorks: 0,
          totalViews: 0,
          totalSubscribers: 0,
          averageRating: 0,
          worksCompleted: 0,
          monthlyViews: 0,
          growthRate: 0
        }
      },
      statistics: {
        bookmarks: work._count.bookmarks,
        likes: work._count.likes,
        views: 0,
        uniqueReaders: 0,
        subscribers: 0,
        comments: 0,
        shares: 0,
        averageRating: 0,
        ratingCount: 0,
        averageReadTime: 0,
        completionRate: 0,
        dropoffPoints: []
      },
      createdAt: work.createdAt,
      updatedAt: work.updatedAt
    } as Work
  }
  
  // === PLACEHOLDER IMPLEMENTATIONS === //
  // These would be implemented with actual analytics queries
  
  private static async getUserContentHistory(userId: string): Promise<any[]> {
    return prisma.readingHistory.findMany({
      where: { userId },
      include: { work: true }
    })
  }
  
  private static calculateGenreAffinity(workGenres: string[], userAffinities: Map<string, number>): number {
    if (workGenres.length === 0) return 0
    
    let totalAffinity = 0
    for (const genre of workGenres) {
      totalAffinity += userAffinities.get(genre) || 0.1
    }
    return totalAffinity / workGenres.length
  }
  
  private static async calculateAuthorAffinity(userId: string, authorId: string): Promise<number> {
    const subscription = await prisma.subscription.findUnique({
      where: {
        userId_authorId: { userId, authorId }
      }
    })
    return subscription ? 0.8 : 0
  }
  
  private static calculateContentQuality(work: Work): number {
    // Simple quality heuristic based on engagement
    const likes = work.statistics?.likes || 0
    const bookmarks = work.statistics?.bookmarks || 0
    const views = work.statistics?.views || 1
    
    return Math.min((likes + bookmarks * 2) / views, 1.0)
  }
  
  private static calculateFreshnessScore(work: Work): number {
    const daysSinceCreated = (Date.now() - work.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, 1 - (daysSinceCreated / 30)) // Decay over 30 days
  }
  
  private static async findSimilarUsers(
    userId: string,
    limit: number
  ): Promise<{ userId: string; similarity: number }[]> {
    // Find works the current user has interacted with (likes + bookmarks).
    // Then find other users who also interacted with those same works.
    // Similarity = overlapping works / total works the current user engaged with
    // (Jaccard-inspired, computed in memory from a single batch query).

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

  private static async calculateTrendingScore(work: Work): Promise<number> {
    // Calculate based on recent engagement velocity
    // This would query recent likes, views, bookmarks
    return Math.random() * 0.8 + 0.1 // Placeholder
  }
  
  private static async getUserLikedWorks(userId: string): Promise<Work[]> {
    const likes = await prisma.like.findMany({
      where: { userId },
      include: { work: { include: { author: { include: { user: true } }, _count: { select: { likes: true, bookmarks: true, sections: true } } } } }
    })
    
    const results: Work[] = []
    for (const like of likes) {
      try {
        results.push(this.transformWorkForFeed(like.work) as Work)
      } catch {
        // skip likes with deleted/invalid work or author
      }
    }
    return results
  }
  
  private static calculateContentSimilarity(work1: Work, work2: Work): number {
    // Calculate similarity based on genres, tags, format, etc.
    const genreOverlap = work1.genres.filter(g => work2.genres.includes(g)).length
    const genreSimilarity = genreOverlap / Math.max(work1.genres.length, work2.genres.length, 1)
    
    const formatSimilarity = work1.formatType === work2.formatType ? 0.3 : 0
    
    return genreSimilarity * 0.7 + formatSimilarity
  }
  
  private static applyFinalFilters(
    recommendations: RecommendationScore[],
    settings: RecommendationSettings,
    limit: number
  ): RecommendationScore[] {
    return recommendations
      .filter(r => r.score >= settings.qualityThreshold)
      .slice(0, limit * 2) // Get more for diversity filtering
      .sort((a, b) => b.score - a.score)
      .slice(0, limit) // Final limit
  }
  
  private static async trackRecommendationExposure(userId: string, feedItems: FeedItem[]): Promise<void> {
    // Track which recommendations were shown to user for learning
    const signals: UserSignal[] = feedItems.map((item, index) => ({
      userId,
      workId: item.work.id,
      signalType: SignalType.CLICK_THROUGH,
      value: 0, // Just exposure, not interaction yet
      metadata: {
        recommendationRank: index + 1,
        recommendationSource: 'algorithmic',
        reasons: item.reason
      },
      timestamp: new Date()
    }))
    
    await SignalTracker.trackSignals(signals)
  }
}

export default IntelligentRecommendationEngine