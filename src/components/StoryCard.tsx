import Image from 'next/image'
import { FeedItem } from '@/types'
import { BookmarkIcon, HeartIcon, EyeIcon, StarIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { getFormatIcon } from '@/lib/mockData'
import { resolveCoverSrc } from '@/lib/images'
import { Badge } from './ui/Badge'

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

function statusBadge(feedType: string) {
  switch (feedType) {
    case 'subscribed': return { label: 'Subscribed', variant: 'genre' as const }
    case 'new': return { label: 'New', variant: 'success' as const }
    case 'discovery': return { label: 'Discovery', variant: 'discovery' as const }
    case 'algorithmic': return { label: 'Recommended', variant: 'trending' as const }
    default: return null
  }
}

export default function StoryCard({
  item, isBookmarked, isLiked, isSubscribed,
  isAuthLoading, isLoading,
  onCardClick, onBookmark, onLike, onSubscribe,
  children,
}: StoryCardProps) {
  const coverSrc = resolveCoverSrc(item.work.id, item.work.coverImage)
  const badge = statusBadge(item.feedType)
  const isInProgress = item.readingStatus === 'in-progress'

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 flex flex-col"
      onClick={onCardClick}
    >
      {/* Cover image — dominant, per DESIGN.md */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex-shrink-0">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={item.work.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="text-white text-center p-4">
              <h3 className="text-lg font-bold mb-1 line-clamp-3">{item.work.title}</h3>
              <p className="text-sm opacity-80">by {item.work.author.displayName || item.work.author.username}</p>
            </div>
          </div>
        )}

        {/* Status badge — top left */}
        {badge && (
          <div className="absolute top-2 left-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        )}

        {/* In-progress indicator */}
        {isInProgress && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-500/80 text-white backdrop-blur-sm">
              📖 Continue
            </span>
          </div>
        )}

        {/* Action buttons — top right */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {isAuthLoading ? (
            <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <div className="w-4 h-4 text-white/50 animate-pulse">⏳</div>
            </div>
          ) : (
            <>
              <button
                onClick={onBookmark}
                disabled={isLoading}
                className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-50"
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                {isBookmarked ? (
                  <BookmarkSolidIcon className="w-4 h-4 text-yellow-400" />
                ) : (
                  <BookmarkIcon className="w-4 h-4 text-white/80 hover:text-yellow-400" />
                )}
              </button>
              <button
                onClick={onLike}
                disabled={isLoading}
                className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-50"
                title={isLiked ? 'Unlike' : 'Like'}
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-4 h-4 text-red-400" />
                ) : (
                  <HeartIcon className="w-4 h-4 text-white/80 hover:text-red-400" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        {/* Title + author (shown when cover exists) */}
        {coverSrc && (
          <>
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
              {item.work.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              by {item.work.author.displayName || item.work.author.username}
            </p>
          </>
        )}

        {/* Genre tags */}
        <div className="flex flex-wrap gap-1">
          {item.work.genres.slice(0, 3).map((genre: string) => (
            <Badge key={genre} variant="genre">{genre}</Badge>
          ))}
          {item.work.genres.length > 3 && (
            <span className="text-xs text-gray-400">+{item.work.genres.length - 3}</span>
          )}
          {item.work.livingWorld && (
            <a
              href={`/worlds/${item.work.livingWorld.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs rounded border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            >
              🌍 {item.work.livingWorld.title}
            </a>
          )}
        </div>

        {/* Reading progress */}
        {isInProgress && item.lastReadSection && (
          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Reading: {item.lastReadSection}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
        )}

        {/* Stats + actions footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <EyeIcon className="w-3.5 h-3.5" />
              {formatNumber(item.work.statistics?.views ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <StarIcon className="w-3.5 h-3.5" />
              {(item.work.statistics.averageRating ?? 0).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 capitalize">{item.work.formatType}</span>
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
      </div>
    </div>
  )
}
