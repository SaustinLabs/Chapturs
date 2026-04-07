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
                      src={resolveCoverSrc(work.id, work.coverImage) as string}
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

export default function BrowsePageClient() {
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
