import { FeedItem } from '@/types'
import { BookmarkIcon, HeartIcon, EyeIcon, StarIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { getFormatIcon } from '@/lib/mockData'
import PretextClampText from './PretextClampText'

interface StoryCardProps {
  item: FeedItem
  isBookmarked: boolean
  isLiked: boolean
  isSubscribed: boolean
  isAuthLoading: boolean
  isLoading: boolean
  onCardClick: () => void
  onBookmark: (e: React.MouseEvent) => void
  onLike: (e: React.MouseEvent) => void
  onSubscribe: (e: React.MouseEvent) => void
  children?: React.ReactNode
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export default function StoryCard({
  item,
  isBookmarked,
  isLiked,
  isSubscribed,
  isAuthLoading,
  isLoading,
  onCardClick,
  onBookmark,
  onLike,
  onSubscribe,
  children,
}: StoryCardProps) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 h-full flex flex-col min-h-[32rem] sm:min-h-[30rem] md:min-h-[28rem]"
      onClick={onCardClick}
    >
      {/* Thumbnail Image */}
      <div className="aspect-video bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 relative overflow-hidden flex-shrink-0">
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

        {/* Genre indicator */}
        <div className="absolute top-1 md:top-2 left-1 md:left-2">
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white font-medium">
            {item.work.genres[0]}
          </span>
        </div>

        {/* Status badges */}
        <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 flex flex-col gap-0.5 md:gap-1">
          {item.feedType === 'subscribed' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-blue-500/80 text-white backdrop-blur-sm">
              📌 Subscribed
            </span>
          )}
          {item.feedType === 'new' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-green-500/80 text-white backdrop-blur-sm">
              ✨ New
            </span>
          )}
          {item.feedType === 'discovery' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-purple-500/80 text-white backdrop-blur-sm">
              🎯 Discovery
            </span>
          )}
          {item.feedType === 'algorithmic' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-orange-500/80 text-white backdrop-blur-sm">
              🔮 Recommended
            </span>
          )}
          {item.readingStatus === 'in-progress' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-yellow-500/80 text-white backdrop-blur-sm">
              📖 Continue
            </span>
          )}
          {item.readingStatus === 'caught-up' && (
            <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-medium bg-emerald-500/80 text-white backdrop-blur-sm">
              ✅ Current
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
            onClick={onBookmark}
            disabled={isLoading || isAuthLoading}
            className="p-1 md:p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-all backdrop-blur-sm transform hover:scale-110 disabled:opacity-50"
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? (
              <BookmarkSolidIcon className="w-3 md:w-4 h-3 md:h-4 text-yellow-400" />
            ) : (
              <BookmarkIcon className="w-3 md:w-4 h-3 md:h-4 text-white/80 hover:text-yellow-400" />
            )}
          </button>

          <button
            onClick={onLike}
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
          <PretextClampText
            as="p"
            text={item.work.description || 'No description available for this work yet.'}
            lineClamp={4}
            font="14px Inter"
            lineHeight={22}
            className="text-sm leading-relaxed text-gray-600 dark:text-gray-300"
          />
        </div>

        {/* Discovery reason */}
        {item.reason && (
          <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-2 border-purple-300 dark:border-purple-600 flex-shrink-0">
            <PretextClampText
              as="p"
              text={`💡 ${item.reason}`}
              lineClamp={2}
              font="12px Inter"
              lineHeight={18}
              className="text-xs text-purple-700 dark:text-purple-300"
            />
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
            {/* Living World badge */}
            {item.work.livingWorld && (
              <a
                href={`/worlds/${item.work.livingWorld.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs rounded border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                title={`Part of the ${item.work.livingWorld.title} Living World`}
              >
                🌍 {item.work.livingWorld.title}
              </a>
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

        {/* Statistics footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600 mt-auto">
          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              {formatNumber(item.work.statistics?.views ?? 0)}
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
            {item.score > 0.75 && (
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">🔥 Trending</span>
            )}
            {item.score <= 0.75 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.work.status === 'ongoing' ? 'Ongoing' : 'Complete'}
              </span>
            )}
            {!isSubscribed && (
              <button
                onClick={onSubscribe}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50"
              >
                Subscribe
              </button>
            )}
            {children}
          </div>
        </div>

        {/* Recommendation reason */}
        {item.reason && (
          <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 italic truncate">
            {item.reason}
          </p>
        )}
      </div>
    </div>
  )
}
