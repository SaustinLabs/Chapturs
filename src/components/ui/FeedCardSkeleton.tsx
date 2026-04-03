/**
 * FeedCardSkeleton — animated pulse placeholder while feed items load.
 * Mirrors the visual structure of FeedCard.
 */
export default function FeedCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-[28rem] animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

      {/* Content area */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Genre tag */}
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />

        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Author */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Description lines */}
        <div className="space-y-2 flex-1">
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}
