/**
 * StoryPageSkeleton — animated pulse placeholder while story page data loads.
 * Mirrors the two-column layout of the story detail page.
 */
export default function StoryPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Cover + header row */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {/* Cover image */}
        <div className="w-full sm:w-48 h-64 sm:h-72 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />

        {/* Title + meta */}
        <div className="flex-1 space-y-4">
          {/* Genre badges */}
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-7 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>

          {/* Author row */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-1">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Description block */}
      <div className="space-y-2 mb-8">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Chapter list heading */}
      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />

      {/* Chapter list items */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
