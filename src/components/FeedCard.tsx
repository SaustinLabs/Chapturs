'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FeedItem } from '@/types'
import { BookmarkIcon, HeartIcon, EyeIcon, UserIcon, StarIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { getFormatIcon, getFeedTypeIcon } from '@/lib/mockData'
import DataService from '@/lib/api/DataService'
import { useUser } from '@/hooks/useUser'
import { signIn } from 'next-auth/react'
import { useSignalTracker, RecommendationTracker } from '@/hooks/useRecommendationTracking'

interface FeedCardProps {
  item: FeedItem
  onClick?: () => void
  recommendationRank?: number // Position in feed for tracking
}

export default function FeedCard({ item, onClick, recommendationRank = 0 }: FeedCardProps) {
  const router = useRouter()
  const { userId, isAuthenticated, isLoading: isAuthLoading } = useUser()
  const [isBookmarkedState, setIsBookmarkedState] = useState(false)
  const [isSubscribedState, setIsSubscribedState] = useState(false)
  const [isLiked, setIsLiked] = useState(item.liked || false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Recommendation tracking
  const { trackEngagement } = useSignalTracker()

  // Load bookmark and subscription status from database
  useEffect(() => {
    if (!userId) return

    const loadUserInteractions = async () => {
      try {
        const [bookmarkStatus, subscriptionStatus, likeStatus] = await Promise.all([
          DataService.checkUserBookmark(userId, item.work.id),
          DataService.checkUserSubscription(userId, item.work.author.id),
          DataService.checkUserLike(userId, item.work.id)
        ])
        setIsBookmarkedState(bookmarkStatus)
        setIsSubscribedState(subscriptionStatus)
        setIsLiked(likeStatus)
      } catch (error) {
        console.error('Failed to load user interactions:', error)
      }
    }

    loadUserInteractions()
  }, [userId, item.work.id, item.work.author.id])

  const promptSignIn = (action: string) => {
    const confirmSignIn = confirm(`Sign in to ${action} this story and unlock personalized features!`)
    if (confirmSignIn) {
      signIn('google', { callbackUrl: window.location.href })
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getStatusBadge = () => {
    const feedIcon = getFeedTypeIcon(item.feedType)
    const formatIcon = getFormatIcon(item.work.formatType)
    
    switch (item.feedType) {
      case 'subscribed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {feedIcon} {formatIcon} Subscribed
          </span>
        )
      case 'new':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {feedIcon} {formatIcon} New
          </span>
        )
      case 'discovery':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {feedIcon} {formatIcon} Discovery
          </span>
        )
      case 'algorithmic':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            {feedIcon} {formatIcon} Recommended
          </span>
        )
    }
  }

  const getReadingStatusBadge = () => {
    switch (item.readingStatus) {
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            📖 Continue Reading
          </span>
        )
      case 'caught-up':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            ✅ Up to Date
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✅ Completed
          </span>
        )
      default:
        return null
    }
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick()
      return
    }

    // Smart navigation based on reading status and content format
    const workId = item.work.id
    
    if (item.readingStatus === 'in-progress' && item.lastReadSection) {
      // Navigate to the work viewer for now, section reading coming soon
      router.push(`/work/${workId}`)
    } else if (item.readingStatus === 'unread') {
      // Navigate to work overview to start reading
      router.push(`/work/${workId}`)
    } else {
      // Navigate to work overview
      router.push(`/work/${workId}`)
    }
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Bookmark button clicked! isAuthenticated:', isAuthenticated, 'userId:', userId, 'isAuthLoading:', isAuthLoading)
    
    // Wait for auth to finish loading
    if (isAuthLoading) {
      console.log('Authentication still loading, please wait...')
      return
    }
    
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated or no userId, prompting sign in')
      promptSignIn('bookmark')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('Making bookmark API call with workId:', item.work.id, 'userId:', userId)
      const newBookmarkState = await DataService.toggleBookmark(item.work.id, userId!)
      console.log('Bookmark API result:', newBookmarkState)
      setIsBookmarkedState(newBookmarkState)
      
      // Track bookmark action for recommendations
      trackEngagement('bookmark', item.work.id, item.work.author.id)
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Subscribe button clicked! isAuthenticated:', isAuthenticated, 'userId:', userId, 'isAuthLoading:', isAuthLoading)
    
    // Wait for auth to finish loading
    if (isAuthLoading) {
      console.log('Authentication still loading, please wait...')
      return
    }
    
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated or no userId, prompting sign in')
      promptSignIn('subscribe to')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('Making subscription API call with authorId:', item.work.author.id, 'userId:', userId)
      const newSubscriptionState = await DataService.toggleSubscription(item.work.author.id, userId!)
      console.log('Subscription API result:', newSubscriptionState)
      setIsSubscribedState(newSubscriptionState)
      
      // Track subscription action for recommendations
      trackEngagement('subscribe', item.work.id, item.work.author.id)
    } catch (error) {
      console.error('Failed to toggle subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Like button clicked! isAuthenticated:', isAuthenticated, 'userId:', userId, 'isAuthLoading:', isAuthLoading)
    
    // Wait for auth to finish loading
    if (isAuthLoading) {
      console.log('Authentication still loading, please wait...')
      return
    }
    
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated or no userId, prompting sign in')
      promptSignIn('like')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('Making like API call with workId:', item.work.id, 'userId:', userId)
      const newLikeState = await DataService.toggleLike(item.work.id, userId!)
      console.log('Like API result:', newLikeState)
      setIsLiked(newLikeState)
      
      // Track like action for recommendations
      trackEngagement('like', item.work.id, item.work.author.id)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <RecommendationTracker
      workId={item.work.id}
      recommendationSource={item.feedType}
      recommendationRank={recommendationRank}
      onClick={() => {
        // Track click for recommendations when user clicks card
        onClick?.()
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 h-full flex flex-col min-h-[32rem] sm:min-h-[30rem] md:min-h-[28rem]"
        onClick={handleCardClick}
      >
      {/* Thumbnail Image */}
      <div className="aspect-video bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 relative overflow-hidden flex-shrink-0">
        {/* Story Cover/Thumbnail Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="text-white text-center p-2 md:p-4">
            <h3 className="text-sm md:text-lg font-bold mb-1 line-clamp-2">
              {item.work.title}
            </h3>
            <p className="text-xs md:text-sm opacity-90">
              by {item.work.author.displayName || item.work.author.username}
            </p>
          </div>
        </div>
        
        {/* Genre indicator in top left */}
        <div className="absolute top-1 md:top-2 left-1 md:left-2">
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white font-medium">
            {item.work.genres[0]}
          </span>
        </div>
        
        {/* Status badges in bottom left */}
        <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 flex flex-col gap-0.5 md:gap-1">
          {item.feedType === 'subscribed' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-blue-500/80 text-white backdrop-blur-sm">
              <UserIcon className="w-2.5 md:w-3 h-2.5 md:h-3 mr-0.5 md:mr-1" />
              <span className="hidden sm:inline">Subscribed</span>
              <span className="sm:hidden">📌</span>
            </span>
          )}
          {item.feedType === 'new' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-green-500/80 text-white backdrop-blur-sm">
              <span className="hidden sm:inline">✨ New</span>
              <span className="sm:hidden">🆕</span>
            </span>
          )}
          {item.feedType === 'discovery' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-purple-500/80 text-white backdrop-blur-sm">
              <span className="hidden sm:inline">🎯 Discovery</span>
              <span className="sm:hidden">�</span>
            </span>
          )}
          {item.feedType === 'algorithmic' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-orange-500/80 text-white backdrop-blur-sm">
              <span className="hidden sm:inline">🔮 Recommended</span>
              <span className="sm:hidden">🔮</span>
            </span>
          )}
          {item.readingStatus === 'in-progress' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-yellow-500/80 text-white backdrop-blur-sm">
              <span className="hidden sm:inline">📖 Continue</span>
              <span className="sm:hidden">📖</span>
            </span>
          )}
          {item.readingStatus === 'caught-up' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-emerald-500/80 text-white backdrop-blur-sm">
              <span className="hidden sm:inline">✅ Current</span>
              <span className="sm:hidden">✅</span>
            </span>
          )}
        </div>
        
        {/* Action buttons overlay */}
        <div className="absolute top-1 md:top-2 right-1 md:right-2 flex space-x-0.5 md:space-x-1">
          {isAuthLoading && (
            <div className="p-1 md:p-1.5 rounded-full bg-black/30 backdrop-blur-sm">
              <div className="w-3 md:w-4 h-3 md:h-4 text-white/50 animate-pulse">⏳</div>
            </div>
          )}
          <button
            onClick={handleBookmark}
            disabled={isLoading || isAuthLoading}
            className="p-1 md:p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-all backdrop-blur-sm transform hover:scale-110 disabled:opacity-50"
            title={isBookmarkedState ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarkedState ? (
              <BookmarkSolidIcon className="w-3 md:w-4 h-3 md:h-4 text-yellow-400" />
            ) : (
              <BookmarkIcon className="w-3 md:w-4 h-3 md:h-4 text-white/80 hover:text-yellow-400" />
            )}
          </button>
          
          <button
            onClick={handleLike}
            disabled={isLoading || isAuthLoading}
            className="p-1 md:p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-all backdrop-blur-sm transform hover:scale-110 disabled:opacity-50"
            title={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiked ? (
              <HeartSolidIcon className="w-3 md:w-4 h-3 md:h-4 text-red-400" />
            ) : (
              <HeartIcon className="w-3 md:w-4 h-3 md:h-4 text-white/80 hover:text-red-400" />
            )}
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Content info based on format type */}
        {item.work.formatType === 'novel' && item.lastReadSection && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded text-center flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
              Section: {item.lastReadSection}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {getFormatIcon(item.work.formatType)} Novel
            </p>
          </div>
        )}

        {/* Description */}
        <div className="mb-4 flex-shrink-0">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-4 min-h-[5rem] sm:min-h-[4rem]">
            {item.work.description || 'No description available for this work yet. Click to explore and discover what awaits you in this content.'}
          </p>
        </div>

        {/* Discovery reason */}
        {item.reason && (
          <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-2 border-purple-300 dark:border-purple-600 flex-shrink-0">
            <p className="text-xs text-purple-700 dark:text-purple-300 line-clamp-2">
              💡 {item.reason}
            </p>
          </div>
        )}

        {/* Genres */}
        <div className="mb-3 flex-shrink-0">
          <div className="flex flex-wrap gap-1">
            {item.work.genres.slice(0, 3).map((genre: string) => (
              <span
                key={genre}
                className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
              >
                {genre}
              </span>
            ))}
            {item.work.genres.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{item.work.genres.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Reading progress */}
        {item.readingStatus === 'in-progress' && item.lastReadSection && (
          <div className="mb-3 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>Reading: {item.lastReadSection}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: '45%' }}
              />
            </div>
          </div>
        )}

        {/* Statistics - Push to bottom */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600 mt-auto">
          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              {formatNumber(item.work.statistics.views)}
            </span>
            <span className="flex items-center">
              <StarIcon className="w-4 h-4 mr-1" />
              {(item.work.statistics.averageRating ?? 0).toFixed(1)}
            </span>
            <span className="flex items-center">
              {getFormatIcon(item.work.formatType)}
              <span className="ml-1 capitalize">{item.work.formatType}</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.work.status === 'ongoing' ? 'Ongoing' : 'Complete'}
            </span>
            {!isSubscribedState && (
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50"
              >
                Subscribe
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </RecommendationTracker>
  )
}
