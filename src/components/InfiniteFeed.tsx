'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FeedItem } from '@/types'
import FeedCard from './FeedCard'
import FeedCardSkeleton from './ui/FeedCardSkeleton'
import DataService from '@/lib/api/DataService'
import { useUser } from '@/hooks/useUser'
import { SignalType } from '@/lib/recommendations/SignalTracker'

interface InfiniteFeedProps {
  hubMode: 'reader' | 'creator'
}

const BOOKS_EMOJI = String.fromCodePoint(0x1f4da)
const WARNING_EMOJI = String.fromCodePoint(0x26a0)
const STAR_EMOJI = String.fromCodePoint(0x2b50)
const SPARKLES_EMOJI = String.fromCodePoint(0x2728)
const FEED_END_EMOJI = String.fromCodePoint(0x1f389)

export default function InfiniteFeed({ hubMode }: InfiniteFeedProps) {
  const { userId, isAuthenticated, isLoading: authLoading } = useUser()
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<FeedItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const feedObserverRef = useRef<IntersectionObserver | null>(null)
  const impressionTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const firedImpressionsRef = useRef<Set<string>>(new Set())
  const signalSessionIdRef = useRef(`feed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)

  useEffect(() => {
    if (!authLoading) {
      loadInitialItems()
    }
  }, [hubMode, userId, isAuthenticated, authLoading])

  const loadInitialItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const initialItems = await DataService.getFeedItems(hubMode, userId || undefined)
      setItems(initialItems)
      setPage(2)
      setHasMore(initialItems.length >= 20)
    } catch (err) {
      setError('Failed to load feed. Please try again.')
      console.error('Error loading initial items:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreItems = useCallback(async () => {
    if (loading || !hasMore) return
    try {
      setLoading(true)
      setError(null)
      const newItems = await DataService.getFeedItems(hubMode, userId || undefined, page)
      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setItems((prev) => [...prev, ...newItems])
        setPage((prev) => prev + 1)
        setHasMore(newItems.length >= 20)
      }
    } catch (err) {
      setError('Failed to load more items. Please try again.')
      console.error('Error loading more items:', err)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, hubMode, userId])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreItems()
      },
      { rootMargin: '600px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMoreItems])

  const filteredItems = useMemo(() => items.filter(() => true), [items])

  const postSignal = useCallback(
    async (kind: 'impression' | 'click', item: FeedItem) => {
      const sessionUserId = session?.user?.id
      if (!sessionUserId) return

      try {
        await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: sessionUserId,
            workId: item.work.id,
            authorId: item.work.author.id,
            signalType: kind === 'impression' ? SignalType.VIEW_START : SignalType.CLICK_THROUGH,
            value: 1,
            metadata: {
              type: kind,
              source: 'infinite-feed',
              hubMode,
            },
            sessionId: signalSessionIdRef.current,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (signalError) {
        console.error(`Failed to track ${kind} signal:`, signalError)
      }
    },
    [hubMode, session?.user?.id]
  )

  useEffect(() => {
    if (!session?.user?.id) {
      if (feedObserverRef.current) {
        feedObserverRef.current.disconnect()
        feedObserverRef.current = null
      }
      impressionTimersRef.current.forEach((timer) => clearTimeout(timer))
      impressionTimersRef.current.clear()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLDivElement
          const workId = element.dataset.workId

          if (!workId) return

          if (!entry.isIntersecting) {
            const existingTimer = impressionTimersRef.current.get(workId)
            if (existingTimer) {
              clearTimeout(existingTimer)
              impressionTimersRef.current.delete(workId)
            }
            return
          }

          if (
            firedImpressionsRef.current.has(workId) ||
            impressionTimersRef.current.has(workId)
          ) {
            return
          }

          const item = filteredItems.find((candidate) => candidate.work.id === workId)
          if (!item) return

          const timer = setTimeout(() => {
            const observedElement = itemRefs.current.get(workId)
            if (!observedElement) return

            const bounds = observedElement.getBoundingClientRect()
            const isVisible = bounds.top < window.innerHeight && bounds.bottom > 0

            if (isVisible && !firedImpressionsRef.current.has(workId)) {
              firedImpressionsRef.current.add(workId)
              void postSignal('impression', item)
            }

            impressionTimersRef.current.delete(workId)
          }, 500)

          impressionTimersRef.current.set(workId, timer)
        })
      },
      { threshold: 0.4 }
    )

    feedObserverRef.current = observer

    itemRefs.current.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
      impressionTimersRef.current.forEach((timer) => clearTimeout(timer))
      impressionTimersRef.current.clear()
    }
  }, [filteredItems, postSignal, session?.user?.id])

  const setItemRef = useCallback((workId: string, node: HTMLDivElement | null) => {
    const observer = feedObserverRef.current
    const existingNode = itemRefs.current.get(workId)

    if (existingNode && observer) {
      observer.unobserve(existingNode)
    }

    if (node) {
      itemRefs.current.set(workId, node)
      if (observer) {
        observer.observe(node)
      }
    } else {
      itemRefs.current.delete(workId)
    }
  }, [])

  const handleFeedCardClick = useCallback(
    (item: FeedItem) => {
      if (!session?.user?.id) return
      void postSignal('click', item)
    },
    [postSignal, session?.user?.id]
  )

  const getEmptyStateMessage = () => {
    if (hubMode === 'reader') {
      return {
        title: 'Welcome to Chapturs!',
        message:
          'Your personalized feed will appear here. Start by subscribing to some stories or exploring our catalog.',
        action: 'Browse Stories',
      }
    }
    return {
      title: 'Creator Dashboard',
      message:
        'Track your story performance and reader engagement here. Upload your first story to get started!',
      action: 'Upload Story',
    }
  }

  if ((loading || authLoading) && items.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <FeedCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-red-500 text-6xl mb-4">{WARNING_EMOJI}</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={loadInitialItems}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!loading && filteredItems.length === 0) {
    const emptyState = getEmptyStateMessage()

    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-gray-300 dark:text-gray-600 text-6xl mb-4">
          {hubMode === 'reader' ? BOOKS_EMOJI : SPARKLES_EMOJI}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {emptyState.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
          {emptyState.message}
        </p>
        <button
          onClick={() => router.push(hubMode === 'reader' ? '/browse' : '/creator/upload')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {emptyState.action}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {hubMode === 'reader' ? 'Your Reading Feed' : 'Creator Analytics'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {hubMode === 'reader'
            ? 'Discover new stories and continue your reading journey'
            : 'Monitor your stories and reader engagement'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            ref={(node) => setItemRef(item.work.id, node)}
            data-work-id={item.work.id}
            onClickCapture={() => handleFeedCardClick(item)}
          >
            <FeedCard item={item} recommendationRank={index + 1} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading more stories...</span>
        </div>
      )}

      {error && items.length > 0 && (
        <div className="text-center py-4">
          <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={loadMoreItems}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">{FEED_END_EMOJI}</div>
          <p className="text-gray-500 dark:text-gray-400">You&rsquo;ve reached the end of your feed</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Check back later for new stories!
          </p>
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}
    </div>
  )
}
