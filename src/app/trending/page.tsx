'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AppLayout from '@/components/AppLayout'
import { resolveCoverSrc } from '@/lib/images'
import { FireIcon } from '@heroicons/react/24/solid'

const TIME_FILTERS = [
  { value: '', label: 'All time' },
  { value: '30', label: 'This month' },
  { value: '7', label: 'This week' },
]

const PAGE_SIZE = 24

function TrendingContent() {
  const [timeWindow, setTimeWindow] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [totalLabel, setTotalLabel] = useState('')

  const fetchResults = useCallback(
    async (append = false, currentOffset = 0) => {
      setLoading(true)
      try {
        const p = new URLSearchParams()
        p.set('sortBy', 'popular')
        p.set('limit', String(PAGE_SIZE))
        p.set('offset', String(currentOffset))
        if (timeWindow) p.set('publishedWithinDays', timeWindow)

        const res = await fetch(`/api/search?${p.toString()}`)
        const data = await res.json()
        const rawItems: any[] = data.data?.items || []
        const works = rawItems.map((item: any) => item.work ?? item)

        if (append) {
          setItems((prev) => [...prev, ...works])
        } else {
          setItems(works)
          const total: number = data.data?.total ?? works.length
          setTotalLabel(total > 0 ? `${total}${data.data?.hasMore ? '+' : ''} stories` : '')
        }
        setHasMore(rawItems.length === PAGE_SIZE)
      } catch {
        // non-critical — leave existing results in place
      } finally {
        setLoading(false)
      }
    },
    [timeWindow],
  )

  useEffect(() => {
    setOffset(0)
    fetchResults(false, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeWindow])

  const loadMore = () => {
    const next = offset + PAGE_SIZE
    setOffset(next)
    fetchResults(true, next)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FireIcon className="w-7 h-7 text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trending</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {loading && items.length === 0 ? 'Loading…' : totalLabel || 'The most-read stories right now'}
        </p>
      </div>

      {/* Time filter */}
      <div className="flex gap-2">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTimeWindow(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              timeWindow === f.value
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results grid */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔥</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nothing yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Try a wider time window</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((work: any, index: number) => (
              <Link key={work.id} href={`/story/${work.id}`} className="group">
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2 shadow-sm">
                  {work.coverImage ? (
                    <Image
                      src={resolveCoverSrc(work.id, work.coverImage) as string}
                      alt={work.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 18vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-700 dark:to-gray-800">
                      <span className="text-4xl">📖</span>
                    </div>
                  )}
                  {/* Rank badge for top 3 */}
                  {index < 3 && offset === 0 && (
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      'bg-amber-600 text-white'
                    }`}>
                      #{index + 1}
                    </span>
                  )}
                  {work.status === 'completed' && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold bg-green-600 text-white px-1.5 py-0.5 rounded">
                      Complete
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-tight">
                  {work.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {work.author?.displayName || work.author?.username || ''}
                </p>
                {work.genres?.length > 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 truncate">{work.genres[0]}</p>
                )}
              </Link>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
            </div>
          )}

          {!loading && hasMore && (
            <div className="flex justify-center py-4">
              <button
                onClick={loadMore}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function TrendingPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto animate-pulse space-y-5 pt-2">
            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
              ))}
            </div>
          </div>
        }
      >
        <TrendingContent />
      </Suspense>
    </AppLayout>
  )
}
