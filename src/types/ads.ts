/**
 * Advanced Ad System Types
 * 
 * Comprehensive ad placement and monetization system for Chapturs creators
 * Allows creators to customize ad placement, targeting, and revenue sharing
 */

// === AD PLACEMENT TYPES === //

export enum AdPlacementType {
  // Content-Integrated Ads
  INLINE_CONTENT = 'inline_content',           // Within chapter text
  SCENE_BREAK = 'scene_break',                 // Between scenes/sections
  CHAPTER_START = 'chapter_start',             // Beginning of chapter
  CHAPTER_END = 'chapter_end',                 // End of chapter
  PARAGRAPH_BREAK = 'paragraph_break',         // Between paragraphs
  
  // Layout-Based Ads
  SIDEBAR_LEFT = 'sidebar_left',               // Left sidebar
  SIDEBAR_RIGHT = 'sidebar_right',             // Right sidebar
  HEADER_BANNER = 'header_banner',             // Top banner
  FOOTER_BANNER = 'footer_banner',             // Bottom banner
  
  // Interactive Ads
  FLOATING_OVERLAY = 'floating_overlay',       // Floating over content
  MODAL_INTERSTITIAL = 'modal_interstitial',  // Full-screen between chapters
  READING_BREAK = 'reading_break',             // Suggested reading breaks
  
  // Format-Specific
  COMIC_PANEL = 'comic_panel',                 // Between comic panels
  ARTICLE_SECTION = 'article_section',         // Between article sections
  
  // Custom Placements
  CUSTOM_WIDGET = 'custom_widget',             // Creator-designed widgets
  SPONSORED_CONTENT = 'sponsored_content'      // Native advertising
}

export enum AdFormat {
  BANNER = 'banner',                           // Standard banner ads
  SQUARE = 'square',                           // Square format
  NATIVE = 'native',                           // Blended with content
  VIDEO = 'video',                             // Video advertisements
  INTERACTIVE = 'interactive',                 // Interactive widgets
  TEXT_ONLY = 'text_only',                     // Text-based ads
  SPONSORED_POST = 'sponsored_post',           // Native content
  AFFILIATE_LINK = 'affiliate_link',           // Affiliate marketing
  PRODUCT_PLACEMENT = 'product_placement'      // In-story integration
}

export enum AdTargeting {
  GENRE_BASED = 'genre_based',                 // Based on story genre
  DEMOGRAPHIC = 'demographic',                 // Reader demographics  
  BEHAVIORAL = 'behavioral',                   // Reading behavior
  CONTEXTUAL = 'contextual',                   // Content context
  GEOGRAPHIC = 'geographic',                   // Location-based
  INTEREST_BASED = 'interest_based',           // User interests
  LOOKALIKE = 'lookalike',                     // Similar audiences
  RETARGETING = 'retargeting'                  // Previous visitors
}

// === AD CONFIGURATION === //

export interface AdPlacement {
  id: string
  workId: string
  sectionId?: string                           // Specific chapter/section
  placementType: AdPlacementType
  format: AdFormat
  position: AdPosition
  
  // Targeting & Filtering
  targeting: AdTargetingConfig
  contentFilters: AdContentFilter[]
  
  // Display Settings
  displaySettings: AdDisplaySettings
  
  // Revenue & Analytics
  revenueShare: number                         // 0-1 (creator's share)
  performanceMetrics: AdPerformanceMetrics
  
  // Status & Scheduling
  isActive: boolean
  startDate?: Date
  endDate?: Date
  
  // Creator Preferences
  creatorNotes?: string
  requiresApproval: boolean
  
  createdAt: Date
  updatedAt: Date
}

export interface AdPosition {
  // For inline content ads
  paragraph?: number                           // After which paragraph
  wordOffset?: number                          // Character offset in text
  
  // For layout ads
  top?: number                                 // Distance from top (px)
  left?: number                                // Distance from left (px)
  right?: number                               // Distance from right (px)
  bottom?: number                              // Distance from bottom (px)
  
  // For relative positioning
  relativeTo?: 'content' | 'viewport' | 'section'
  anchor?: 'start' | 'middle' | 'end'
  
  // For responsive positioning
  mobilePosition?: Partial<AdPosition>
  tabletPosition?: Partial<AdPosition>
}

export interface AdTargetingConfig {
  targetingTypes: AdTargeting[]
  
  // Demographic targeting
  ageRange?: [number, number]
  genders?: ('male' | 'female' | 'other' | 'unspecified')[]
  locations?: string[]                         // Geographic targeting
  languages?: string[]
  
  // Behavioral targeting
  readingFrequency?: 'casual' | 'regular' | 'power'
  genrePreferences?: string[]
  deviceTypes?: ('mobile' | 'tablet' | 'desktop')[]
  
  // Contextual targeting
  contentKeywords?: string[]
  contentTags?: string[]
  contentMoods?: string[]
  
  // Advanced targeting
  customAudiences?: string[]                   // Creator-defined audiences
  excludedAudiences?: string[]
  minimumEngagement?: number                   // Minimum user engagement score
}

export interface AdContentFilter {
  type: 'content_category' | 'advertiser' | 'keyword' | 'domain'
  rule: 'allow' | 'block'
  value: string
  reason?: string
}

export interface AdDisplaySettings {
  // Visual settings
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
  
  // Animation settings
  fadeIn?: boolean
  slideIn?: 'left' | 'right' | 'top' | 'bottom'
  animationDuration?: number
  
  // Responsive settings
  hideOnMobile?: boolean
  hideOnTablet?: boolean
  hideOnDesktop?: boolean
  
  // Frequency settings
  maxImpressionsPerSession?: number
  minimumTimeBetweenAds?: number               // Seconds
  showOnlyToNewVisitors?: boolean
  
  // User experience settings
  closeable?: boolean
  autoHide?: boolean
  autoHideDelay?: number
  respectDoNotTrack?: boolean
}

export interface AdPerformanceMetrics {
  // Basic metrics
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  
  // Calculated metrics
  ctr: number                                  // Click-through rate
  cpm: number                                  // Cost per mille
  cpc: number                                  // Cost per click
  conversionRate: number
  
  // User experience metrics
  viewabilityRate: number                      // How often ad was actually seen
  completionRate: number                       // For video ads
  engagementTime: number                       // Average engagement time
  
  // Creator-specific metrics
  readerSatisfaction?: number                  // Reader feedback on ad placement
  contentRelevance?: number                    // How relevant ads are to content
  revenuePerReader?: number
  
  // Time-based metrics
  dailyMetrics: { [date: string]: Partial<AdPerformanceMetrics> }
  weeklyMetrics: { [week: string]: Partial<AdPerformanceMetrics> }
  monthlyMetrics: { [month: string]: Partial<AdPerformanceMetrics> }
}

// === AD CAMPAIGN MANAGEMENT === //

export interface AdCampaign {
  id: string
  creatorId: string
  name: string
  description?: string
  
  // Campaign settings
  budget: AdBudget
  schedule: AdSchedule
  targeting: AdTargetingConfig
  
  // Associated placements
  placements: string[]                         // AdPlacement IDs
  
  // Performance tracking
  metrics: AdPerformanceMetrics
  goals: AdCampaignGoals
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'completed'
  
  createdAt: Date
  updatedAt: Date
}

export interface AdBudget {
  type: 'daily' | 'weekly' | 'monthly' | 'total'
  amount: number
  currency: string
  
  // Spending controls
  maxCostPerClick?: number
  maxCostPerImpression?: number
  automaticBidding?: boolean
  
  // Budget alerts
  alertThreshold?: number                      // % of budget spent to trigger alert
  pauseAtBudgetLimit?: boolean
}

export interface AdSchedule {
  startDate: Date
  endDate?: Date
  
  // Time-based scheduling
  dayParting?: {
    [day: string]: { start: string, end: string }[]
  }
  
  // Event-based scheduling
  seasonalAdjustments?: {
    period: string
    budgetMultiplier: number
  }[]
}

export interface AdCampaignGoals {
  primary: 'impressions' | 'clicks' | 'conversions' | 'revenue'
  target: number
  
  // Secondary goals
  maxCostPerConversion?: number
  minimumROAS?: number                         // Return on ad spend
  targetCTR?: number
}

// === CREATOR AD PREFERENCES === //

export interface CreatorAdPreferences {
  userId: string
  
  // Global ad settings
  adsEnabled: boolean
  defaultRevenueShare: number                  // Default creator share (0-1)
  
  // Content restrictions
  allowedCategories: string[]
  blockedCategories: string[]
  blockedAdvertisers: string[]
  blockedDomains: string[]
  
  // Placement preferences
  preferredPlacements: AdPlacementType[]
  disabledPlacements: AdPlacementType[]
  maxAdsPerChapter: number
  minimumWordsBetweenAds: number
  
  // Quality standards
  requireAdvertiserApproval: boolean
  minimumAdvertiserRating: number
  requireContentRelevance: boolean
  
  // Revenue settings
  paymentMethod: 'paypal' | 'stripe' | 'bank_transfer'
  paymentDetails: any                          // Encrypted payment information
  minimumPayout: number
  
  // Analytics preferences
  shareAnalyticsWithAdvertisers: boolean
  allowPersonalizedAds: boolean
  allowRetargeting: boolean
  
  createdAt: Date
  updatedAt: Date
}

// === AD ANALYTICS === //

export interface AdAnalyticsDashboard {
  creatorId: string
  timeRange: 'day' | 'week' | 'month' | 'year'
  
  // Overview metrics
  totalRevenue: number
  totalImpressions: number
  totalClicks: number
  averageCTR: number
  averageCPM: number
  
  // Performance by placement
  placementPerformance: {
    [placementType: string]: AdPerformanceMetrics
  }
  
  // Performance by work
  workPerformance: {
    workId: string
    title: string
    metrics: AdPerformanceMetrics
  }[]
  
  // Revenue breakdown
  revenueBySource: {
    [source: string]: number
  }
  
  // Trends and insights
  trends: {
    metric: string
    change: number                             // % change from previous period
    direction: 'up' | 'down' | 'stable'
  }[]
  
  // Recommendations
  recommendations: {
    type: 'placement' | 'targeting' | 'content'
    suggestion: string
    potentialImpact: string
    confidence: number                         // 0-1
  }[]
}

// === AD CONTENT AND CREATIVE === //

export interface AdCreative {
  id: string
  advertiserId: string
  
  // Creative details
  name: string
  format: AdFormat
  
  // Creative assets
  assets: AdAsset[]
  
  // Copy and messaging
  headline?: string
  description?: string
  callToAction?: string
  
  // Targeting compatibility
  compatiblePlacements: AdPlacementType[]
  contentCategories: string[]
  
  // Quality and compliance
  isApproved: boolean
  approvalNotes?: string
  qualityScore: number                         // 1-10
  
  // Performance data
  performanceMetrics: AdPerformanceMetrics
  
  createdAt: Date
  updatedAt: Date
}

export interface AdAsset {
  type: 'image' | 'video' | 'html' | 'css' | 'javascript'
  url: string
  size?: { width: number, height: number }
  fileSize?: number
  duration?: number                            // For videos
  altText?: string                            // For accessibility
}

// === EDITOR INTEGRATION === //

export interface EditorAdIntegration {
  // Ad placement markers in editor
  adMarkers: EditorAdMarker[]
  
  // Preview settings
  showAdPreview: boolean
  previewAdType: AdFormat
  
  // Editing tools
  adToolbarEnabled: boolean
  suggestedPlacements: SuggestedAdPlacement[]
}

export interface EditorAdMarker {
  id: string
  position: number                             // Character position in editor
  placementType: AdPlacementType
  format: AdFormat
  notes?: string
  
  // Visual representation
  color: string
  icon?: string
  visible: boolean
}

export interface SuggestedAdPlacement {
  position: number
  placementType: AdPlacementType
  reason: string
  confidence: number                           // 0-1
  estimatedRevenue: number
}

// === AD ELIGIBILITY & FILTERING === //

export type AdEligibility = 'full' | 'restricted' | 'none'
export type MaturityTag = 'all_ages' | 'mature' | 'explicit'

export interface AdSlotConfig {
  placement: string
  maturityRating: string
  eligibility: AdEligibility
  wordCount: number
}

// All types are already exported inline above