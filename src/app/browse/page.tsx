'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AppLayout from '@/components/AppLayout'
import { resolveCoverSrc } from '@/lib/images'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const GENRES = [
  'Fantasy', 'Romance', 'Science Fiction', 'Mystery', 'Thriller',
  'Horror', 'Adventure', 'Comedy', 'Drama', 'Historical', 'LitRPG', 'Isekai',
]

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus', label: 'Hiatus' },
]

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'recent', label: 'Recent' },
  { value: 'alpha', label: 'A–Z' },
]

const PAGE_SIZE = 24

function BrowseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [genre, setGenre] = useState(searchParams.get('genre') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'popular')

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [totalLabel, setTotalLabel] = useState('')

  const pushUrl = useCallback(
    (g: string, s: string, so: string, q: string) => {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (g) p.set('genre', g)
      if (s) p.set('status', s)
      if (so && so !== 'popular') p.set('sort', so)
      const qs = p.toString()
      router.replace(`/browse${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router],
  )

  const fetchResults = useCallback(
    async (append = false, currentOffset = 0) => {
      setLoading(true)
      try {
        const p = new URLSearchParams()
        if (query.trim()) p.set('q', query.trim())
        if (genre) p.set('genre', genre)
        if (status) p.set('status', status)
        p.set('sortBy', sort)
        p.set('limit', String(PAGE_SIZE))
        p.set('offset', String(currentOffset))

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, genre, status, sort],
  )

  useEffect(() => {
    setOffset(0)
    fetchResults(false, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, status, sort])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    pushUrl(genre, status, sort, query)
    setOffset(0)
    fetchResults(false, 0)
  }

  const setGenreFilter = (g: string) => {
    const next = genre === g ? '' : g
    setGenre(next)
    pushUrl(next, status, sort, query)
  }

  const setStatusFilter = (s: string) => {
    setStatus(s)
    pushUrl(genre, s, sort, query)
  }

  const setSortFilter = (s: string) => {
    setSort(s)
    pushUrl(genre, status, s, query)
  }

  const loadMore = () => {
    const next = offset + PAGE_SIZE
    setOffset(next)
    fetchResults(true, next)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse Stories</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {loading && items.length === 0 ? 'Loading…' : totalLabel || 'Discover your next favourite read'}
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search titles, authors…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2">
        {['', ...GENRES].map((g) => (
          <button
            key={g || '__all__'}
            onClick={() => setGenreFilter(g)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              genre === g
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            {g || 'All'}
          </button>
        ))}
      </div>

      {/* Status + Sort row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                status === s.value
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSortFilter(s.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                sort === s.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
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
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No stories found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Try different filters or a broader search term</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((work: any) => (
              <Link key={work.id} href={`/story/${work.id}`} className="group">
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2 shadow-sm">
                  {work.coverImage ? (
                    <Image
                      src={resolveCoverSrc(work.id, work.coverImage)}
                      alt={work.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 18vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800">
                      <span className="text-4xl">📖</span>
                    </div>
                  )}
                  {work.status === 'completed' && (
                    <span className="absolute top-2 left-2 text-[10px] font-semibold bg-green-600 text-white px-1.5 py-0.5 rounded">
                      Complete
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                  {work.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {work.author?.displayName || work.author?.username || ''}
                </p>
                {work.genres?.length > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">{work.genres[0]}</p>
                )}
              </Link>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
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

export default function BrowsePage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto animate-pulse space-y-5 pt-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              ))}
            </div>
          </div>
        }
      >
        <BrowseContent />
      </Suspense>
    </AppLayout>
  )
}

export default function BrowsePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(true)

  const genres = ['Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Thriller', 'Horror', 'Adventure', 'Comedy', 'Drama', 'Historical']
  const tags = ['Magic System', 'AI', 'Time Travel', 'Dragons', 'Space Opera', 'Enemies to Lovers', 'Found Family', 'Epic Fantasy']

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: searchQuery.trim() })
      if (filters.status?.length) params.set('status', filters.status[0])
      if (filters.formats?.length) params.set('formatType', filters.formats[0])

      const res = await fetch(`/api/works?${params.toString()}`)
      const data = await res.json()
      const works: any[] = data.data?.works || []

      // Client-side genre filtering (API currently does title/description search)
      const filtered = filters.genres?.length
        ? works.filter((w: any) => filters.genres!.some(g => (w.genres || []).includes(g)))
        : works

      setSearchResults(filtered)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load trending/recent published works on initial page load
    const loadTrending = async () => {
      try {
        const res = await fetch('/api/works?q=&status=published&limit=6')
        // Fall back to a general feed sample if no specific trending endpoint
        const feedRes = await fetch('/api/feed?limit=6')
        const feedData = await feedRes.json()
        const feedItems = feedData.data?.items || feedData.items || []
        setTrending(feedItems.slice(0, 6))
      } catch {
        // Trending is non-critical, fail silently
      } finally {
        setTrendingLoading(false)
      }
    }
    loadTrending()
  }, [])

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse Stories</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Discover your next favorite webnovel
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stories, authors, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genres
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {genres.map((genre) => (
                    <label key={genre} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.genres?.includes(genre) || false}
                        onChange={(e) => {
                          const current = filters.genres || []
                          if (e.target.checked) {
                            updateFilter('genres', [...current, genre])
                          } else {
                            updateFilter('genres', current.filter(g => g !== genre))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'ongoing', label: 'Ongoing' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'hiatus', label: 'On Hiatus' }
                  ].map((status) => (
                    <label key={status.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status.value as any) || false}
                        onChange={(e) => {
                          const current = filters.status || []
                          if (e.target.checked) {
                            updateFilter('status', [...current, status.value])
                          } else {
                            updateFilter('status', current.filter(s => s !== status.value))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Maturity Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maturity Rating
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'all-ages', label: 'All Ages' },
                    { value: 'mature', label: 'Mature (16+)' },
                    { value: 'adult', label: 'Adult (18+)' }
                  ].map((rating) => (
                    <label key={rating.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.maturityRating?.includes(rating.value as any) || false}
                        onChange={(e) => {
                          const current = filters.maturityRating || []
                          if (e.target.checked) {
                            updateFilter('maturityRating', [...current, rating.value])
                          } else {
                            updateFilter('maturityRating', current.filter(r => r !== rating.value))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{rating.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort by Popularity
                </label>
                <select
                  value={filters.popularity || ''}
                  onChange={(e) => updateFilter('popularity', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No preference</option>
                  <option value="views">Most Views</option>
                  <option value="bookmarks">Most Bookmarked</option>
                  <option value="subscriptions">Most Subscribed</option>
                </select>
              </div>

              {/* Recency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recency
                </label>
                <select
                  value={filters.recency || ''}
                  onChange={(e) => updateFilter('recency', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No preference</option>
                  <option value="published">Recently Published</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </div>

              {/* Search in Content */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.searchInContent || false}
                    onChange={(e) => updateFilter('searchInContent', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Search inside chapter text
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  May take longer but finds content within chapters
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Searching...</span>
          </div>
        )}

        {searchQuery && !loading && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Search Results
                {searchResults.length > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    ({searchResults.length} found)
                  </span>
                )}
              </h2>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium mb-2">No direct matches found</h3>
                  <p className="text-sm">Try adjusting your search terms or filters</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((story: any) => (
                    <div
                      key={story.id}
                      onClick={() => router.push(`/story/${story.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {story.title}
                      </h3>
                      {story.author && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          by {story.author.displayName || story.author.username}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                        {story.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(story.genres || []).slice(0, 3).map((genre: string) => (
                          <span
                            key={genre}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{story.chapterCount ?? 0} chapters</span>
                        <span>{story.bookmarkCount ?? 0} bookmarks</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Default Trending/Popular Content */}
        {!searchQuery && !loading && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Trending Now
              </h2>
              {trendingLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : trending.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {trending.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/story/${item.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {item.title}
                      </h3>
                      {(item.author || item.authorName) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          by {item.author?.displayName || item.author?.username || item.authorName}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(item.genres || []).slice(0, 3).map((genre: string) => (
                          <span key={genre} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 col-span-full">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-medium mb-2">Start exploring</h3>
                  <p className="text-sm">Use the search bar above to find your next favorite story</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
