'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import FeedCard from '@/components/FeedCard'
import FeedCardSkeleton from '@/components/ui/FeedCardSkeleton'
import { FeedItem } from '@/types'

const GENRES = [
  'Fantasy', 'Romance', 'Action', 'Horror', 'Mystery', 'Sci-Fi',
  'Slice of Life', 'Comedy', 'Drama', 'Thriller', 'Adventure', 'Historical',
  'Isekai', 'BL', 'GL', 'Cultivation', 'System', 'Post-Apocalyptic',
]

const STATUS_OPTIONS = [
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Hiatus', value: 'hiatus' },
]

const MATURITY_OPTIONS = [
  { label: 'G', value: 'G' },
  { label: 'PG', value: 'PG' },
  { label: 'PG-13', value: 'PG-13' },
  { label: 'R', value: 'R' },
]

const FORMAT_OPTIONS = [
  { label: 'Novel', value: 'novel' },
  { label: 'Comic', value: 'comic' },
  { label: 'Article', value: 'article' },
  { label: 'Hybrid', value: 'hybrid' },
]

const SORT_OPTIONS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Recent', value: 'recent' },
  { label: 'A–Z', value: 'alpha' },
]

function Pill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full border transition-colors whitespace-nowrap ${
        active
          ? 'bg-violet-600 border-violet-600 text-white'
          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400 dark:hover:border-violet-400'
      }`}
    >
      {label}
    </button>
  )
}

function SearchPageInner() {
  const router = useRouter()
  const params = useSearchParams()

  const [query, setQuery] = useState(params.get('q') || '')
  const [genre, setGenre] = useState(params.get('genre') || '')
  const [status, setStatus] = useState(params.get('status') || '')
  const [maturityRating, setMaturityRating] = useState(params.get('maturityRating') || '')
  const [formatType, setFormatType] = useState(params.get('formatType') || '')
  const [sortBy, setSortBy] = useState(params.get('sortBy') || 'popular')

  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (newOffset = 0, append = false) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (query) p.set('q', query)
      if (genre) p.set('genre', genre)
      if (status) p.set('status', status)
      if (maturityRating) p.set('maturityRating', maturityRating)
      if (formatType) p.set('formatType', formatType)
      p.set('sortBy', sortBy)
      p.set('limit', '24')
      p.set('offset', String(newOffset))

      const res = await fetch(`/api/search?${p}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      const newItems: FeedItem[] = data.data?.items || data.items || []

      setItems(prev => append ? [...prev, ...newItems] : newItems)
      setHasMore(data.data?.hasMore ?? data.hasMore ?? false)
      setOffset(newOffset + newItems.length)
    } catch {
      // errors are silent — empty state handles it
    } finally {
      setLoading(false)
    }
  }, [query, genre, status, maturityRating, formatType, sortBy])

  // Sync URL params and debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // Update URL without push
      const p = new URLSearchParams()
      if (query) p.set('q', query)
      if (genre) p.set('genre', genre)
      if (status) p.set('status', status)
      if (maturityRating) p.set('maturityRating', maturityRating)
      if (formatType) p.set('formatType', formatType)
      if (sortBy !== 'popular') p.set('sortBy', sortBy)
      router.replace(`/search?${p}`, { scroll: false })
      fetchResults(0, false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, genre, status, maturityRating, formatType, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (current: string, value: string, setter: (v: string) => void) => {
    setter(current === value ? '' : value)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Search</h1>
          <p className="text-gray-600 dark:text-gray-400">Find your next favourite story</p>
        </div>

        {/* Search input */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or description…"
            className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-8">
          {/* Genre */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Genre</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <Pill key={g} label={g} active={genre === g} onClick={() => toggle(genre, g, setGenre)} />
              ))}
            </div>
          </div>

          {/* Row of small filter groups */}
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((o) => (
                  <Pill key={o.value} label={o.label} active={status === o.value} onClick={() => toggle(status, o.value, setStatus)} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Rating</p>
              <div className="flex flex-wrap gap-2">
                {MATURITY_OPTIONS.map((o) => (
                  <Pill key={o.value} label={o.label} active={maturityRating === o.value} onClick={() => toggle(maturityRating, o.value, setMaturityRating)} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Format</p>
              <div className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((o) => (
                  <Pill key={o.value} label={o.label} active={formatType === o.value} onClick={() => toggle(formatType, o.value, setFormatType)} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sort by</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((o) => (
                  <Pill key={o.value} label={o.label} active={sortBy === o.value} onClick={() => setSortBy(o.value)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        {(genre || status || maturityRating || formatType) && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
            {[
              genre && { label: genre, clear: () => setGenre('') },
              status && { label: STATUS_OPTIONS.find(o => o.value === status)?.label || status, clear: () => setStatus('') },
              maturityRating && { label: maturityRating, clear: () => setMaturityRating('') },
              formatType && { label: FORMAT_OPTIONS.find(o => o.value === formatType)?.label || formatType, clear: () => setFormatType('') },
            ].filter(Boolean).map((f: any) => (
              <button
                key={f.label}
                onClick={f.clear}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded text-sm"
              >
                {f.label}
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            ))}
            <button
              onClick={() => { setGenre(''); setStatus(''); setMaturityRating(''); setFormatType('') }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results */}
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <FeedCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-64 text-center">
            <MagnifyingGlassIcon className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {query || genre || status || maturityRating || formatType ? 'No results found' : 'Start searching'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              {query || genre || status || maturityRating || formatType
                ? 'Try adjusting your filters or search terms.'
                : 'Type a title, author name, or use the filters above to discover stories.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item, index) => (
                <FeedCard key={item.id} item={item} recommendationRank={index + 1} />
              ))}
            </div>

            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
              </div>
            )}

            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchResults(offset, true)}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
