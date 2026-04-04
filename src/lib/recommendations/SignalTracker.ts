/**
 * User Signal Tracking System
 * 
 * Comprehensive tracking system for user behavior signals to power recommendations
 * Similar to YouTube/TikTok data collection but privacy-conscious
 */

import { prisma } from '@/lib/database/PrismaService'

// === SIGNAL TYPES === //

export enum SignalType {
  // Engagement Signals (immediate user actions)
  VIEW_START = 'view_start',           // User opens content
  VIEW_DURATION = 'view_duration',     // Time spent reading
  LIKE = 'like',                       // User likes content
  BOOKMARK = 'bookmark',               // User bookmarks content
  SUBSCRIBE = 'subscribe',             // User follows author
  SHARE = 'share',                     // User shares content
  
  // Reading Behavior
  SCROLL_DEPTH = 'scroll_depth',       // How far user scrolled (0-1)
  READING_SPEED = 'reading_speed',     // Words per minute
  COMPLETION_RATE = 'completion_rate', // Percentage of content consumed
  RETURN_VISIT = 'return_visit',       // User returns to same content
  SESSION_LENGTH = 'session_length',   // Total reading session time
  
  // Discovery Behavior  
  SEARCH_QUERY = 'search_query',       // What user searches for
  FILTER_USAGE = 'filter_usage',       // Filters user applies
  BROWSE_CATEGORY = 'browse_category', // Categories user explores
  CLICK_THROUGH = 'click_through',     // User clicks on recommendation
  
  // Content Preferences
  GENRE_INTERACTION = 'genre_interaction',     // Engagement with specific genres
  FORMAT_PREFERENCE = 'format_preference',     // Novel vs comic vs article preference
  LENGTH_PREFERENCE = 'length_preference',     // Short vs long content preference
  MATURITY_COMFORT = 'maturity_comfort',       // Comfort with mature content
  
  // Social Signals
  AUTHOR_PROFILE_VIEW = 'author_profile_view', // User views author profile
  SIMILAR_CONTENT_VIEW = 'similar_content',    // User explores similar content
  
  // Negative Signals
  SKIP = 'skip',                       // User skips recommended content
  DISLIKE = 'dislike',                 // User actively dislikes
  BLOCK_AUTHOR = 'block_author',       // User blocks author
  REPORT_CONTENT = 'report_content'    // User reports inappropriate content
}

export interface UserSignal {
  userId: string
  workId?: string
  authorId?: string
  signalType: SignalType
  value: number                    // Normalized value 0-1, or -1 for negative
  metadata?: {
    sessionId?: string
    referrer?: string             // How user discovered content
    deviceType?: 'mobile' | 'desktop' | 'tablet'
    timeOfDay?: number           // Hour of day (0-23)
    genreContext?: string[]      // Genres involved
    searchQuery?: string         // If from search
    recommendationSource?: string // If from recommendations
    [key: string]: any
  }
  timestamp: Date
}

// === SIGNAL TRACKING SERVICE === //

export class SignalTracker {
  
  /**
   * Track a single user signal
   */
  static async trackSignal(signal: UserSignal): Promise<void> {
    try {
      // Store raw signal for analytics
      await this.storeRawSignal(signal)
      
      // Update aggregated metrics in real-time
      await this.updateAggregatedMetrics(signal)
      
      // Update user profile if significant signal
      if (this.isSignificantSignal(signal)) {
        await this.updateUserProfile(signal)
      }
      
    } catch (error) {
      console.error('Failed to track signal:', error)
      // Don't throw - tracking failures shouldn't break user experience
    }
  }
  
  /**
   * Track multiple signals efficiently
   */
  static async trackSignals(signals: UserSignal[]): Promise<void> {
    const batches = this.chunkArray(signals, 50)
    
    for (const batch of batches) {
      await Promise.all(batch.map(signal => this.trackSignal(signal)))
    }
  }
  
  /**
   * Track reading session (comprehensive reading behavior)
   */
  static async trackReadingSession(session: {
    userId: string
    workId: string
    sectionId?: string
    startTime: Date
    endTime: Date
    scrollDepth: number      // 0-1
    wordsRead: number
    totalWords: number
    interactions: string[]   // ['like', 'bookmark', etc.]
    deviceType: 'mobile' | 'desktop' | 'tablet'
    referrer?: string
  }): Promise<void> {
    const duration = session.endTime.getTime() - session.startTime.getTime()
    const readingSpeed = session.wordsRead / (duration / (1000 * 60)) // words per minute
    const completionRate = session.wordsRead / session.totalWords
    
    const signals: UserSignal[] = [
      // Session duration
      {
        userId: session.userId,
        workId: session.workId,
        signalType: SignalType.VIEW_DURATION,
        value: Math.min(duration / (1000 * 60 * 30), 1), // Normalize to 30 min max
        metadata: {
          sectionId: session.sectionId,
          deviceType: session.deviceType,
          referrer: session.referrer,
          actualDurationMs: duration
        },
        timestamp: session.endTime
      },
      
      // Scroll depth
      {
        userId: session.userId,
        workId: session.workId,
        signalType: SignalType.SCROLL_DEPTH,
        value: session.scrollDepth,
        metadata: {
          sectionId: session.sectionId,
          deviceType: session.deviceType
        },
        timestamp: session.endTime
      },
      
      // Reading speed
      {
        userId: session.userId,
        workId: session.workId,
        signalType: SignalType.READING_SPEED,
        value: Math.min(readingSpeed / 400, 1), // Normalize to 400 wpm max
        metadata: {
          actualWpm: readingSpeed,
          wordsRead: session.wordsRead
        },
        timestamp: session.endTime
      },
      
      // Completion rate
      {
        userId: session.userId,
        workId: session.workId,
        signalType: SignalType.COMPLETION_RATE,
        value: completionRate,
        metadata: {
          wordsRead: session.wordsRead,
          totalWords: session.totalWords
        },
        timestamp: session.endTime
      }
    ]
    
    // Add interaction signals
    session.interactions.forEach(interaction => {
      if (interaction in SignalType) {
        signals.push({
          userId: session.userId,
          workId: session.workId,
          signalType: interaction as SignalType,
          value: 1,
          metadata: {
            sessionContext: true,
            deviceType: session.deviceType
          },
          timestamp: session.endTime
        })
      }
    })
    
    await this.trackSignals(signals)
  }
  
  /**
   * Track search behavior
   */
  static async trackSearchBehavior(search: {
    userId: string
    query: string
    filters: Record<string, any>
    results: string[]        // Work IDs returned
    clickedResults: string[] // Work IDs user clicked
    timestamp: Date
  }): Promise<void> {
    const signals: UserSignal[] = [
      // Search query signal
      {
        userId: search.userId,
        signalType: SignalType.SEARCH_QUERY,
        value: 1,
        metadata: {
          query: search.query,
          resultCount: search.results.length,
          clickThroughRate: search.clickedResults.length / search.results.length
        },
        timestamp: search.timestamp
      }
    ]
    
    // Track filter usage
    Object.entries(search.filters).forEach(([filterType, filterValue]) => {
      signals.push({
        userId: search.userId,
        signalType: SignalType.FILTER_USAGE,
        value: 1,
        metadata: {
          filterType,
          filterValue,
          searchQuery: search.query
        },
        timestamp: search.timestamp
      })
    })
    
    // Track click-throughs
    search.clickedResults.forEach((workId, index) => {
      signals.push({
        userId: search.userId,
        workId,
        signalType: SignalType.CLICK_THROUGH,
        value: 1 - (index / search.results.length), // Higher value for higher-ranked clicks
        metadata: {
          searchQuery: search.query,
          resultRank: search.results.indexOf(workId) + 1,
          clickRank: index + 1
        },
        timestamp: search.timestamp
      })
    })
    
    await this.trackSignals(signals)
  }
  
  /**
   * Track recommendation interaction
   */
  static async trackRecommendationInteraction(interaction: {
    userId: string
    workId: string
    recommendationSource: string  // 'algorithmic', 'trending', 'similar_users'
    action: 'view' | 'like' | 'bookmark' | 'skip' | 'click'
    recommendationRank: number
    timestamp: Date
  }): Promise<void> {
    const signalValue = interaction.action === 'skip' ? -0.5 : 
                       interaction.action === 'view' ? 0.5 : 1
    
    await this.trackSignal({
      userId: interaction.userId,
      workId: interaction.workId,
      signalType: SignalType.CLICK_THROUGH,
      value: signalValue,
      metadata: {
        recommendationSource: interaction.recommendationSource,
        recommendationRank: interaction.recommendationRank,
        action: interaction.action
      },
      timestamp: interaction.timestamp
    })
  }
  
  // === USER ANALYTICS === //
  
  /**
   * Get user behavior analytics for recommendation tuning
   */
  static async getUserBehaviorAnalytics(userId: string, days: number = 30): Promise<{
    genreAffinities: Map<string, number>
    formatPreferences: Map<string, number>
    readingPatterns: {
      averageSessionLength: number
      peakHours: number[]
      completionRate: number
      readingSpeed: number
    }
    engagementLevel: number
    discoveryOpenness: number
  }> {
    // Load stored taste-profile preferences (set via onboarding survey or accumulated behavior)
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        genreAffinities: true,
        formatPreferences: true,
        qualityPreference: true,
        diversityPreference: true,
      },
    })

    const genreAffinities = new Map<string, number>()
    const formatPreferences = new Map<string, number>()

    if (userProfile?.genreAffinities) {
      try {
        const parsed = JSON.parse(userProfile.genreAffinities) as Record<string, number>
        for (const [genre, score] of Object.entries(parsed)) {
          // Skip internal sentinel keys
          if (!genre.startsWith('_')) genreAffinities.set(genre, score)
        }
      } catch { /* ignore malformed JSON */ }
    }

    if (userProfile?.formatPreferences) {
      try {
        const parsed = JSON.parse(userProfile.formatPreferences) as Record<string, number>
        for (const [format, score] of Object.entries(parsed)) {
          formatPreferences.set(format, score)
        }
      } catch { /* ignore malformed JSON */ }
    }

    return {
      genreAffinities,
      formatPreferences,
      readingPatterns: {
        averageSessionLength: 0,
        peakHours: [],
        completionRate: 0,
        readingSpeed: 0,
      },
      engagementLevel: userProfile?.qualityPreference ?? 0,
      discoveryOpenness: userProfile?.diversityPreference ?? 0,
    }
  }

  private static async updateAggregatedMetrics(_signal: UserSignal): Promise<void> {
    // Update aggregated metrics for fast retrieval
    // Could use Redis for real-time updates
  }

  private static async storeRawSignal(signal: UserSignal): Promise<void> {
    // Store in analytics table or time-series database
    console.log('Storing signal:', signal.signalType, 'for user:', signal.userId)
  }

  private static async updateUserProfile(signal: UserSignal): Promise<void> {
    // Update user preference profile based on significant signals
  }
  
  private static isSignificantSignal(signal: UserSignal): boolean {
    return [
      SignalType.LIKE,
      SignalType.BOOKMARK,
      SignalType.SUBSCRIBE,
      SignalType.COMPLETION_RATE,
      SignalType.VIEW_DURATION,
      SignalType.DISLIKE,
      SignalType.BLOCK_AUTHOR
    ].includes(signal.signalType) && Math.abs(signal.value) > 0.1
  }
  
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

export default SignalTracker