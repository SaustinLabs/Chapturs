'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FeedItem } from '@/types'
import DataService from '@/lib/api/DataService'
import { useUser } from '@/hooks/useUser'
import { signIn } from 'next-auth/react'
import { useSignalTracker, RecommendationTracker } from '@/hooks/useRecommendationTracking'
import ReportButton from './ReportButton'
import StoryCard from './StoryCard'

interface FeedCardProps {
  item: FeedItem
  onClick?: () => void
  recommendationRank?: number
}

export default function FeedCard({ item, onClick, recommendationRank = 0 }: FeedCardProps) {
  const router = useRouter()
  const { userId, isAuthenticated, isLoading: isAuthLoading } = useUser()
  const [isBookmarked, setIsBookmarked] = useState(item.bookmark || false)
  const [isLiked, setIsLiked] = useState(item.liked || false)
  const [isSubscribed, setIsSubscribed] = useState(item.subscribed || false)
  const [isLoading, setIsLoading] = useState(false)
  const { trackEngagement } = useSignalTracker()

  // Per-card subscription check — only fires when feed didn't pre-annotate it
  useEffect(() => {
    if (!userId || item.subscribed !== undefined) return
    DataService.checkUserSubscription(userId, item.work.author.id)
      .then(setIsSubscribed)
      .catch(() => {})
  }, [userId, item.work.author.id])

  const promptSignIn = () => signIn('google', { callbackUrl: window.location.href })

  const handleCardClick = () => {
    if (onClick) { onClick(); return }
    router.push(`/story/${item.work.id}`)
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAuthLoading) return
    if (!isAuthenticated || !userId) { promptSignIn(); return }
    setIsLoading(true)
    try {
      const newState = await DataService.toggleBookmark(item.work.id, userId!)
      setIsBookmarked(newState)
      trackEngagement('bookmark', item.work.id, item.work.author.id)
    } catch { /* ignore */ }
    finally { setIsLoading(false) }
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAuthLoading) return
    if (!isAuthenticated || !userId) { promptSignIn(); return }
    setIsLoading(true)
    try {
      const newState = await DataService.toggleLike(item.work.id, userId!)
      setIsLiked(newState)
      trackEngagement('like', item.work.id, item.work.author.id)
    } catch { /* ignore */ }
    finally { setIsLoading(false) }
  }

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAuthLoading) return
    if (!isAuthenticated || !userId) { promptSignIn(); return }
    setIsLoading(true)
    try {
      const newState = await DataService.toggleSubscription(item.work.author.id, userId!)
      setIsSubscribed(newState)
      trackEngagement('subscribe', item.work.id, item.work.author.id)
    } catch { /* ignore */ }
    finally { setIsLoading(false) }
  }

  return (
    <RecommendationTracker
      workId={item.work.id}
      recommendationSource={item.feedType}
      recommendationRank={recommendationRank}
      onClick={() => onClick?.()}
    >
      <StoryCard
        item={item}
        isBookmarked={isBookmarked}
        isLiked={isLiked}
        isSubscribed={isSubscribed}
        isAuthLoading={isAuthLoading}
        isLoading={isLoading}
        onCardClick={handleCardClick}
        onBookmark={handleBookmark}
        onLike={handleLike}
        onSubscribe={handleSubscribe}
      >
        <ReportButton targetType="work" targetId={item.work.id} />
      </StoryCard>
    </RecommendationTracker>
  )
}
