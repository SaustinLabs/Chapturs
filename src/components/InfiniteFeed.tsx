'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { saveFeedSnapshot, getFeedSnapshot } from '@/lib/feedCache'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FeedItem } from '@/types'
import FeedCard from './FeedCard'
import FeedCardSkeleton from './ui/FeedCardSkeleton'
import DataService from '@/lib/api/DataService'
import { useUser } from '@/hooks/useUser'
import { SignalType } from '@/lib/recommendations/SignalTracker'
import TasteProfileSurvey from './onboarding/TasteProfileSurvey'

interface InfiniteFeedProps {
  hubMode: 'reader' | 'creator'
}

const BOOKS_EMOJI = String.fromCodePoint(0x1f4da)
const WARNING_EMOJI = String.fromCodePoint(0x26a0)
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
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const feedObserverRef = useRef<IntersectionObserver | null>(null)
  const impressionTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const firedImpressionsRef = useRef<Set<string>>(new Set())
  const signalSessionIdRef = useRef(`feed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  // Feed state cache — back-navigation restoration
  const scrollYRef = useRef(0)
  const cacheCheckedRef = useRef(false)
  const restoredFromCacheRef = useRef(false)
  const snapshotStateRef = useRef<{
    items: FeedItem[]; page: number; hasMore: boolean
    feedFilter: 'all' | 'following'; userId: string | null
  }>({ items: [], page: 1, hasMore: true, feedFilter: 'all', userId: null })

  const loadInitialItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const initialItems = await DataService.getFeedItems(hubMode, userId || undefined, 1, feedFilter)
      setItems(initialItems)
      setPage(2)
      setHasMore(initialItems.length >= 20)
    } catch (err) {
      setError('Failed to load feed. Please try again.')
      console.error('Error loading initial items:', err)
    } finally {
      setLoading(false)
    }
  }, [hubMode, userId, feedFilter])

  const handleFilterSwitch = useCallback((newFilter: 'all' | 'following') => {
    if (newFilter === feedFilter) return
    setFeedFilter(newFilter)
    setItems([])
    setPage(1)
    setHasMore(true)
  }, [feedFilter])

  // ---- Feed state cache for instant back-navigation ----

  // Track scroll position with a passive listener (zero overhead)
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mirror latest state into a ref so the unmount closure always has current values
  useEffect(() => {
    snapshotStateRef.current = { items, page, hasMore, feedFilter, userId: userId ?? null }
  }, [items, page, hasMore, feedFilter, userId])

  // Save snapshot on true unmount (empty deps = runs cleanup only on unmount)
  useEffect(() => {
    return () => {
      const { items, page, hasMore, feedFilter, userId } = snapshotStateRef.current
      if (items.length > 0) {
        saveFeedSnapshot(hubMode, {
          items, page, hasMore, feedFilter,
          scrollY: scrollYRef.current,
          timestamp: Date.now(),
          userId,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore from cache as soon as auth settles — runs before the load effect below
  useEffect(() => {
    if (authLoading) return
    if (cacheCheckedRef.current) return
    cacheCheckedRef.current = true

    const snapshot = getFeedSnapshot(hubMode, userId ?? null)
    if (!snapshot || snapshot.items.length === 0) return

    setItems(snapshot.items)
    setPage(snapshot.page)
    setHasMore(snapshot.hasMore)
    setFeedFilter(snapshot.feedFilter)
    restoredFromCacheRef.current = true

    // Restore scroll position once React has committed the items to the DOM
    const savedY = snapshot.scrollY
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, savedY)))
  }, [authLoading, hubMode, userId])

  // ---- End feed state cache ----

  useEffect(() => {
    if (!authLoading) {
      if (restoredFromCacheRef.current) {
        // Skip fresh load — we already restored from cache. Reset for next trigger.
        restoredFromCacheRef.current = false
        return
      }
      loadInitialItems()
    }
  }, [loadInitialItems, authLoading, isAuthenticated, hubMode, userId])

  const loadMoreItems = useCallback(async () => {
    if (loading || !hasMore) return
    try {
      setLoading(true)
      setError(null)
      const newItems = await DataService.getFeedItems(hubMode, userId || undefined, page, feedFilter)
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
  }, [page, loading, hasMore, hubMode, userId, feedFilter])

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

    const timers = impressionTimersRef.current

    return () => {
      observer.disconnect()
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
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
    if (hubMode === 'reader' && feedFilter === 'following') {
      return {
        title: 'No updates yet',
        message: "You're not following anyone yet. Subscribe to authors you love to see their latest chapters here.",
        action: 'Browse Stories',
        href: '/browse',
      }
    }
    if (hubMode === 'reader') {
      return {
        title: 'Welcome to Chapturs!',
        message:
          'Your personalized feed will appear here. Start by subscribing to some stories or exploring our catalog.',
        action: 'Browse Stories',
        href: '/browse',
      }
    }
    return {
      title: 'Creator Dashboard',
      message:
        'Track your story performance and reader engagement here. Upload your first story to get started!',
      action: 'Upload Story',
      href: '/creator/upload',
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

    // Enhanced empty state for the "all" reader feed — most likely a brand new user
    if (hubMode === 'reader' && feedFilter === 'all') {
      const QUICK_GENRES = ['Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Horror', 'Mystery', 'Drama', 'Adventure']

      // Authenticated users get the full onboarding taste-picker survey
      if (isAuthenticated) {
        return (
          <>
            {showOnboarding && (
              <TasteProfileSurvey
                onComplete={() => {
                  setShowOnboarding(false)
                  loadInitialItems()
                }}
              />
            )}
            <div className="flex flex-col items-center justify-center min-h-96 text-center px-4">
              <div className="text-gray-300 dark:text-gray-600 text-6xl mb-4">{BOOKS_EMOJI}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Your feed is getting ready
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md text-sm">
                Tell us what you like and we&apos;ll tune your feed to match.
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg mb-4"
              >
                Personalize my feed
              </button>
              <button
                onClick={() => router.push(emptyState.href)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Browse all stories instead
              </button>
            </div>
          </>
        )
      }

      // Guest users get genre quick-pick links
      return (
        <div className="flex flex-col items-center justify-center min-h-96 text-center px-4">
          <div className="text-gray-300 dark:text-gray-600 text-6xl mb-4">{BOOKS_EMOJI}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Chapturs
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md text-sm">
            Discover stories across every genre, from independent writers worldwide.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6 max-w-sm">
            {QUICK_GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => router.push(`/browse?genre=${encodeURIComponent(genre)}`)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 transition-colors"
              >
                {genre}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push(emptyState.href)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            {emptyState.action}
          </button>
        </div>
      )
    }

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
          onClick={() => router.push(emptyState.href)}
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

      {hubMode === 'reader' && isAuthenticated && (
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleFilterSwitch('all')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              feedFilter === 'all'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => handleFilterSwitch('following')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              feedFilter === 'following'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Following
          </button>
        </div>
      )}

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
