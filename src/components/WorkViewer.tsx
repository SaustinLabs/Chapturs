'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Work, ContentFormat } from '@/types'
import { getFormatIcon, mockChapters } from '@/lib/mockData'
import { BookmarkIcon, HeartIcon, EyeIcon, StarIcon, ShareIcon, PlayIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { resolveCoverSrc } from '@/lib/images'
import CommentSection from './CommentSection'
import { useUser } from '@/hooks/useUser'

interface WorkViewerProps {
  work: Work
  onBookmark?: () => void
  onLike?: () => void
  onSubscribe?: () => void
  isBookmarked?: boolean
  isLiked?: boolean
  isSubscribed?: boolean
}

export default function WorkViewer({ 
  work, 
  onBookmark, 
  onLike, 
  onSubscribe,
  isBookmarked = false,
  isLiked = false,
  isSubscribed = false
}: WorkViewerProps) {
  // Expose glossary terms to client-side renderers for highlighting.
  if (typeof window !== 'undefined') {
    try {
      ;(window as any).__CURRENT_GLOSSARY_TERMS__ = work.glossary || []
    } catch (e) {
      // ignore
    }
  }
  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'glossary' | 'comments'>('overview')
  const router = useRouter()
  const { userId, isAuthenticated } = useUser()

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const startReading = () => {
    // Use actual work sections instead of mock data
    const sections = work.sections || []
    if (sections.length > 0) {
      const firstSection = sections.sort((a: any, b: any) => (a.chapterNumber || 0) - (b.chapterNumber || 0))[0]
      router.push(`/story/${work.id}/chapter/${firstSection.id}`)
    } else {
      // Fallback: navigate to the story page
      router.push(`/story/${work.id}`)
    }
  }

  const getFormatSpecificReader = () => {
    switch (work.formatType) {
      case 'novel':
        return <NovelReader work={work} />
      case 'comic':
        return <ComicReader work={work} />
      case 'article':
        return <ArticleReader work={work} />
      case 'hybrid':
        return <HybridReader work={work} />
      default:
        return <DefaultReader work={work} />
    }
  }

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="relative">
        {/* Cover Image / Header Background */}
        <div className="h-64 relative">
          {work.coverImage ? (
            <img
              src={resolveCoverSrc(work.id, work.coverImage)}
              alt={work.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500" />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getFormatIcon(work.formatType)}</span>
              <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-sm font-medium">
                {work.formatType.charAt(0).toUpperCase() + work.formatType.slice(1)}
              </span>
              <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-sm">
                {work.status === 'ongoing' ? 'Ongoing' : 'Completed'}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{work.title}</h1>
            <p className="text-lg opacity-90">by {work.author.displayName || work.author.username}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                {formatNumber(work.statistics.views)} views
              </span>
              <span className="flex items-center gap-1">
                <StarIcon className="w-4 h-4" />
                {work.statistics.averageRating.toFixed(1)} ({formatNumber(work.statistics.ratingCount)})
              </span>
              <span>{formatNumber(work.statistics.subscribers)} subscribers</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onBookmark}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {isBookmarked ? (
                  <BookmarkSolidIcon className="w-4 h-4 text-yellow-500" />
                ) : (
                  <BookmarkIcon className="w-4 h-4" />
                )}
                Bookmark
              </button>
              
              <button
                onClick={onLike}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-4 h-4 text-red-500" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                Like
              </button>
              
              <button
                onClick={onSubscribe}
                className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
                  isSubscribed
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
              
              <button className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <ShareIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {['overview', 'sections', 'glossary', 'comments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {work.description}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Genres & Tags</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {work.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {work.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(work.statistics.views)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatNumber(work.statistics.subscribers)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Subscribers</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {work.statistics.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Rating</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(work.statistics.completionRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completion</div>
                </div>
              </div>
            </div>

            {/* Start Reading Button */}
            <div className="flex justify-center">
              <button
                onClick={startReading}
                className="flex items-center space-x-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                <PlayIcon className="w-6 h-6" />
                <span>Start Reading</span>
                <span className="text-sm opacity-90">
                  {getFormatIcon(work.formatType)}
                </span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div>
            {getFormatSpecificReader()}
          </div>
        )}

        {activeTab === 'glossary' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Glossary</h3>
            {work.glossary.length > 0 ? (
              <div className="space-y-4">
                {work.glossary.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-lg">{entry.term}</h4>
                    <p className="text-gray-700 dark:text-gray-300">{entry.definition}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        {entry.category}
                      </span>
                      {entry.spoilerLevel !== 'none' && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                          Spoiler: {entry.spoilerLevel}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No glossary entries available for this work.
              </p>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            <CommentSection
              workId={work.id}
              canComment={isAuthenticated}
              currentUserId={userId || undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Format-specific reader components
function NovelReader({ work }: { work: Work }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h3 className="text-xl font-semibold mb-4">📖 Novel Chapters</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This novel contains multiple chapters for immersive reading.
      </p>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
        <p className="text-blue-800 dark:text-blue-200">
          📚 Use the &ldquo;Start Reading&rdquo; button in the Overview tab to begin this novel from the first chapter.
        </p>
      </div>
    </div>
  )
}

function ComicReader({ work }: { work: Work }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">🎨 Comic Panels</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This comic features visual storytelling with dynamic artwork.
      </p>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-500">
        <p className="text-purple-800 dark:text-purple-200">
          🎨 Use the &ldquo;Start Reading&rdquo; button to view this comic chapter by chapter!
        </p>
      </div>
    </div>
  )
}

function ArticleReader({ work }: { work: Work }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">📰 Article Sections</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This article provides in-depth analysis and insights.
      </p>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
        <p className="text-green-800 dark:text-green-200">
          📰 Use the &ldquo;Start Reading&rdquo; button to read this article from the beginning!
        </p>
      </div>
    </div>
  )
}

function HybridReader({ work }: { work: Work }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">📚 Hybrid Content</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This work combines multiple content formats for a rich experience.
      </p>
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-500">
        <p className="text-orange-800 dark:text-orange-200">
          📚 Use the &ldquo;Start Reading&rdquo; button to experience this multimedia content!
        </p>
      </div>
    </div>
  )
}

function DefaultReader({ work }: { work: Work }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">📄 Content</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Content reader for this format is being developed.
      </p>
    </div>
  )
}
