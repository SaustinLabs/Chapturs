'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Work } from '@/types'
import { 
  BookmarkIcon as BookmarkOutline,
  HeartIcon as HeartOutline,
  EyeIcon,
  ClockIcon,
  StarIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { 
  BookmarkIcon as BookmarkSolid,
  HeartIcon as HeartSolid,
  StarIcon as StarSolid
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import Image from 'next/image'
import { resolveCoverSrc } from '@/lib/images'
import StoryPageSkeleton from '@/components/ui/StoryPageSkeleton'
import RateWorkModal from '@/components/RateWorkModal'

interface StoryPageClientProps {
  /** Work data pre-fetched by the Server Component. When provided, skips the
   *  client-side work fetch and renders immediately with no loading flash. */
  initialWork?: Work | null
  /** AI-generated reader summary (earlyReview or cumulativeReview). */
  aiReview?: string | null
  /** Pre-fetched featured comments for the story page carousel. */
  featuredComments?: FeaturedComment[]
  /** Works in the same genre(s), pre-fetched server-side, shown as 'Readers Also Enjoyed'. */
  relatedWorks?: RelatedWork[]
}

interface RelatedWork {
  id: string
  title: string
  coverImage: string | null
  author: { username: string; displayName: string | null }
  genres: string[]
  status: string
}

interface FeaturedComment {
  id: string
  content: string
  user: { id: string; username: string; displayName: string | null; avatar: string | null }
  section: { id: string; title: string; chapterNumber: number | null } | null
  featuredAt: string | null
}

export default function StoryPageClient({ initialWork, aiReview, featuredComments: initialFeaturedComments = [], relatedWorks = [] }: StoryPageClientProps) {
  const params = useParams()
  const router = useRouter()
  const storyId = params?.id as string
  const { data: session } = useSession()

  const [story, setStory] = useState<Work | null>(initialWork ?? null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [openingChapter, setOpeningChapter] = useState(false)
  const [resumeSectionId, setResumeSectionId] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  // If initialWork is provided, skip loading state — data is ready immediately
  const [loading, setLoading] = useState(!initialWork)
  const [error, setError] = useState<string | null>(null)
  const [featuredComments] = useState<FeaturedComment[]>(initialFeaturedComments)
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const [showRateModal, setShowRateModal] = useState(false)

  // Auto-advance featured comments carousel every 6 seconds
  useEffect(() => {
    if (featuredComments.length <= 1) return
    const timer = setInterval(() => {
      setFeaturedIdx(i => (i + 1) % featuredComments.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [featuredComments.length])

  useEffect(() => {
    const fetchStoryData = async () => {
      if (!storyId) return

      try {
        // When initialWork is provided, skip fetching the work itself
        let workData: any = initialWork ?? null

        if (!workData) {
          setLoading(true)
          setError(null)
          const workResponse = await fetch(`/api/works/${storyId}`)
          if (!workResponse.ok) throw new Error('Failed to fetch story data')
          workData = await workResponse.json()
          setStory(workData)
        }

        // Fire all user-interaction checks in parallel
        if (session?.user?.id && workData) {
          const [bookmarkRes, likeRes, subscriptionRes] = await Promise.all([
            fetch(`/api/bookmarks?userId=${session.user.id}&workId=${storyId}`),
            fetch(`/api/likes?userId=${session.user.id}&workId=${storyId}`),
            workData.author?.id
              ? fetch(`/api/subscriptions?userId=${session.user.id}&authorId=${workData.author.id}`)
              : Promise.resolve(null),
          ])

          if (bookmarkRes.ok) {
            const d = await bookmarkRes.json(); setIsBookmarked(d.isBookmarked)
          }
          if (likeRes.ok) {
            const d = await likeRes.json(); setIsLiked(d.isLiked)
          }
          if (subscriptionRes?.ok) {
            const d = await subscriptionRes.json(); setIsSubscribed(d.isSubscribed)
          }
        }
      } catch (err) {
        console.error('Error fetching story data:', err)
        if (!initialWork) {
          setError('This story couldn\'t be loaded right now. Please try refreshing the page.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStoryData()
  }, [storyId, session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!storyId) return
    // Load localStorage first (instant)
    try {
      const stored = window.localStorage.getItem(`reader-last-chapter-${storyId}`)
      if (stored) setResumeSectionId(stored)
    } catch {
      // ignore
    }
    // If logged in, prefer server-side position (works across devices)
    if (session?.user?.id) {
      fetch(`/api/reading-progress?workId=${storyId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.sectionId) setResumeSectionId(data.sectionId)
        })
        .catch(() => {})
    }
  }, [storyId, session?.user?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setPrefersReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  const openChapterWithTransition = (sectionId: string) => {
    setOpeningChapter(true)
    window.setTimeout(() => {
      router.push(`/story/${storyId}/chapter/${sectionId}`)
    }, prefersReducedMotion ? 50 : 230)
  }

  const handleBookmark = async () => {
    if (!session?.user?.id || !story) return
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workId: story.id, userId: session.user.id })
      })
      if (response.ok) setIsBookmarked(!isBookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const handleLike = async () => {
    if (!session?.user?.id || !story) return
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workId: story.id, userId: session.user.id })
      })
      if (response.ok) setIsLiked(!isLiked)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleSubscribe = async () => {
    if (!session?.user?.id || !story?.author?.id) return
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: story.author.id, userId: session.user.id })
      })
      if (response.ok) setIsSubscribed(!isSubscribed)
    } catch (error) {
      console.error('Error toggling subscription:', error)
    }
  }

  const startReading = () => {
    if (story?.sections && story.sections.length > 0) {
      const fallbackSectionId = story.sections[0].id
      const hasResume = resumeSectionId && story.sections.some((section) => section.id === resumeSectionId)
      openChapterWithTransition(hasResume ? resumeSectionId! : fallbackSectionId)
    }
  }

  const continueReading = () => {
    if (story?.sections && story.sections.length > 0) {
      const fallbackSectionId = story.sections[0].id
      const hasResume = resumeSectionId && story.sections.some((section) => section.id === resumeSectionId)
      openChapterWithTransition(hasResume ? resumeSectionId! : fallbackSectionId)
    }
  }

  if (loading) return <StoryPageSkeleton />

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const stats = {
    views: story.statistics?.views ?? 0,
    subscribers: story.statistics?.subscribers ?? 0,
    bookmarks: story.statistics?.bookmarks ?? 0,
    averageRating: story.statistics?.averageRating ?? 0,
    ratingCount: story.statistics?.ratingCount ?? 0,
  }

  return (
    <>
      {openingChapter && (
        <div className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="reader-zoom-pulse w-28 h-28 rounded-3xl bg-white/20 border border-white/50 shadow-2xl flex items-center justify-center">
            <span className="text-white text-xs font-semibold tracking-wide">Opening</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Story Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Story Cover */}
              <div className="flex-shrink-0">
                {story.coverImage ? (
                  <Image
                    src={resolveCoverSrc(story.id, story.coverImage) as string}
                    alt={story.title}
                    width={192}
                    height={256}
                    className="w-48 h-64 rounded-lg object-cover shadow-md"
                    priority
                  />
                ) : (
                  <div className="w-48 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">📚</div>
                      <div className="text-sm font-medium">Cover Image</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Story Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {story.title}
                    </h1>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-2">
                        <Image
                          src={story.author.avatar || '/default-avatar.png'}
                          alt={story.author.username}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-medium">{story.author.username}</span>
                      </div>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        story.status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        story.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleBookmark}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {isBookmarked ? (
                        <BookmarkSolid className="w-6 h-6 text-blue-500" />
                      ) : (
                        <BookmarkOutline className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={handleLike}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {isLiked ? (
                        <HeartSolid className="w-6 h-6 text-red-500" />
                      ) : (
                        <HeartOutline className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
                    !showFullDescription ? 'line-clamp-3' : ''
                  }`}>
                    {story.description}
                  </p>
                  {story.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-500 hover:text-blue-600 text-sm mt-2"
                    >
                      {showFullDescription ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {/* AI Reader Summary */}
                {aiReview && (
                  <div className="mb-5 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">
                      {aiReview}
                    </p>
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">AI summary</p>
                  </div>
                )}

                {/* Featured Comments Carousel */}
                {featuredComments.length > 0 && (
                  <div className="mb-5">
                    <div className="relative overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="text-amber-500 mt-0.5 shrink-0" aria-label="Featured comment">✦</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-3">
                            &ldquo;{featuredComments[featuredIdx].content}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">
                              {featuredComments[featuredIdx].user.displayName || featuredComments[featuredIdx].user.username}
                            </span>
                            {featuredComments[featuredIdx].section && (
                              <>
                                <span>·</span>
                                <span>{featuredComments[featuredIdx].section!.title}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {featuredComments.length > 1 && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setFeaturedIdx(i => (i - 1 + featuredComments.length) % featuredComments.length)}
                              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 text-amber-600"
                              aria-label="Previous featured comment"
                            >‹</button>
                            <button
                              onClick={() => setFeaturedIdx(i => (i + 1) % featuredComments.length)}
                              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 text-amber-600"
                              aria-label="Next featured comment"
                            >›</button>
                          </div>
                        )}
                      </div>
                      {featuredComments.length > 1 && (
                        <div className="flex justify-center gap-1 mt-2">
                          {featuredComments.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setFeaturedIdx(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === featuredIdx ? 'bg-amber-500' : 'bg-amber-300 dark:bg-amber-700'}`}
                              aria-label={`Go to comment ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Genres and Tags */}
                <div className="space-y-3 mb-6">
                  <div className="flex flex-wrap gap-2">
                    {story.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.views.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.subscribers.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Subscribers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.bookmarks.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Bookmarks</div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => session?.user?.id && setShowRateModal(true)}
                      title={session?.user?.id ? 'Rate this work' : 'Sign in to rate'}
                      className="group flex flex-col items-center focus:outline-none"
                    >
                      <div className="flex items-center space-x-1">
                        <StarSolid className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-yellow-500 transition-colors">
                          {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
                        {stats.ratingCount > 0 ? `${stats.ratingCount} ratings` : 'Rate this'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Reading Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={startReading}
                    disabled={!story.sections || story.sections.length === 0}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayIcon className="w-5 h-5" />
                    <span>Start Reading</span>
                  </button>
                  <button
                    onClick={continueReading}
                    disabled={!story.sections || story.sections.length === 0}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{resumeSectionId ? 'Continue Reading' : 'Quick Start'}</span>
                  </button>
                  {session?.user?.id && story.author?.id && (
                    <button
                      onClick={handleSubscribe}
                      className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                        isSubscribed
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'border border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Chapters ({story.sections?.length || 0})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {!story.sections || story.sections.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-lg font-medium mb-2">No chapters yet</h3>
                <p className="text-sm">Check back later for new content from this author.</p>
              </div>
            ) : (
              story.sections.map((section, index) => (
                <div
                  key={section.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-600 cursor-pointer transition-all duration-100 select-none"
                  onClick={() => openChapterWithTransition(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        Chapter {index + 1}: {section.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{section.publishedAt ? new Date(section.publishedAt).toLocaleDateString() : 'Draft'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>{section.wordCount} words</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(section as any).status === 'published' ? (
                        <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Readers Also Enjoyed */}
        {relatedWorks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Readers Also Enjoyed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedWorks.map((w) => (
                <Link key={w.id} href={`/story/${w.id}`} className="group">
                  <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
                    {w.coverImage ? (
                      <Image
                        src={resolveCoverSrc(w.id, w.coverImage)}
                        alt={w.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 45vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-600 dark:to-gray-700">
                        <span className="text-3xl">📖</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {w.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {w.author.displayName || w.author.username}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {story && (
        <RateWorkModal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          workId={story.id}
          workTitle={story.title}
          onSuccess={(average, total) => {
            // Optimistically update displayed stats
            setStory((prev) =>
              prev
                ? {
                    ...prev,
                    statistics: {
                      ...(prev as any).statistics,
                      averageRating: average,
                      ratingCount: total,
                    },
                  } as any
                : prev
            )
          }}
        />
      )}
    </>
  )
}
