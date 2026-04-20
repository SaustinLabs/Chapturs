'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { useUser } from '@/hooks/useUser'
import { signIn } from 'next-auth/react'
import {
  BookOpenIcon,
  ClockIcon,
  FireIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { resolveCoverSrc } from '@/lib/images'

interface ReadingStats {
  worksRead: number
  totalMinutes: number
  totalHours: number
  totalWords: number
  totalSessions: number
  currentStreak: number
  heatmap: Array<{ date: string; minutes: number; words: number; sessions: number }>
  genreBreakdown: Array<{ genre: string; count: number }>
  recentReads: Array<{
    workId: string
    workTitle: string
    coverImage: string | null
    status: string
    sectionId: string | null
    sectionTitle: string | null
    chapterNumber: number | null
    progress: number
    lastReadAt: string
  }>
}

const GENRE_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
]

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remainHours = hours % 24
    return `${days}d ${remainHours}h`
  }
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default function ReaderStatsPage() {
  const { isAuthenticated, isLoading: userLoading } = useUser()
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/reader/stats')
        if (!res.ok) throw new Error('Failed to load stats')
        const data = await res.json()
        setStats(data.stats)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [isAuthenticated])

  if (userLoading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reading Stats</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sign in to see your personalized reading statistics.
            </p>
            <button
              onClick={() => signIn('google')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Reading Stats</h1>
          <p className="text-gray-500 dark:text-gray-400">Your reading journey at a glance.</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : stats ? (
          <>
            {/* ── Hero Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<BookOpenIcon className="w-6 h-6" />}
                label="Works Read"
                value={stats.worksRead.toString()}
                color="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
              />
              <StatCard
                icon={<ClockIcon className="w-6 h-6" />}
                label="Time Spent"
                value={formatDuration(stats.totalMinutes)}
                color="text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400"
              />
              <StatCard
                icon={<DocumentTextIcon className="w-6 h-6" />}
                label="Words Read"
                value={formatNumber(stats.totalWords)}
                color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
              />
              <StatCard
                icon={<FireIcon className="w-6 h-6" />}
                label="Day Streak"
                value={stats.currentStreak.toString()}
                color="text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400"
                accent={stats.currentStreak > 0}
              />
            </div>

            {/* ── Reading Heatmap ── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Reading Activity</h2>
              <ReadingHeatmap data={stats.heatmap} />
            </div>

            {/* ── Two column: Genres + Recent ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Genre Breakdown */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Genre Profile</h2>
                {stats.genreBreakdown.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Start reading to build your genre profile!
                  </p>
                ) : (
                  <GenreBreakdown data={stats.genreBreakdown} />
                )}
              </div>

              {/* Recent Reading */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recently Read</h2>
                {stats.recentReads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-3">No reading history yet.</p>
                    <a href="/" className="text-blue-600 hover:text-blue-500 text-sm font-medium">Explore stories →</a>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {stats.recentReads.map((read) => (
                      <a
                        key={`${read.workId}-${read.sectionId}`}
                        href={read.sectionId ? `/story/${read.workId}/chapter/${read.sectionId}` : `/story/${read.workId}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                      >
                        {/* Cover */}
                        <div className="w-10 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex-shrink-0 overflow-hidden">
                          {read.coverImage && resolveCoverSrc(read.workId, read.coverImage) ? (
                            <img
                              src={resolveCoverSrc(read.workId, read.coverImage)!}
                              alt={read.workTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpenIcon className="w-5 h-5 text-white/60" />
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {read.workTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            {read.sectionTitle
                              ? `Ch. ${read.chapterNumber || '?'}: ${read.sectionTitle}`
                              : 'Started reading'}
                          </p>
                        </div>
                        {/* Progress */}
                        <div className="flex-shrink-0 text-right">
                          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${Math.min(read.progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(read.lastReadAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}

// ─── Sub-components ───

function StatCard({
  icon,
  label,
  value,
  color,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm ${accent ? 'ring-2 ring-orange-400/50' : ''}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
    </div>
  )
}

function ReadingHeatmap({ data }: { data: ReadingStats['heatmap'] }) {
  // Build a 90-day grid
  const now = new Date()
  const days: Array<{ date: string; level: number; minutes: number }> = []
  const dataMap = new Map(data.map(d => [d.date, d.minutes]))
  const maxMinutes = Math.max(...data.map(d => d.minutes), 1)

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    const minutes = dataMap.get(dateStr) || 0
    const level = minutes === 0 ? 0 : Math.min(Math.ceil((minutes / maxMinutes) * 4), 4)
    days.push({ date: dateStr, level, minutes })
  }

  const levelColors = [
    'bg-gray-100 dark:bg-gray-700',
    'bg-green-200 dark:bg-green-900',
    'bg-green-400 dark:bg-green-700',
    'bg-green-500 dark:bg-green-600',
    'bg-green-700 dark:bg-green-500',
  ]

  // Arrange into 13 columns of 7 rows
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.minutes}m read`}
                className={`w-3 h-3 rounded-[2px] ${levelColors[day.level]} transition-colors cursor-default`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
        <span>Less</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-[2px] ${color}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function GenreBreakdown({ data }: { data: ReadingStats['genreBreakdown'] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = Math.round((item.count / total) * 100)
        return (
          <div key={item.genre}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.genre}</span>
              <span className="text-xs text-gray-400">{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${GENRE_COLORS[i % GENRE_COLORS.length]} rounded-full transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
