import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AppLayout from '@/components/AppLayout'
import { prisma } from '@/lib/database/PrismaService'
import { resolveCoverSrc } from '@/lib/images'
import SeriesSubscribeButton from '@/components/SeriesSubscribeButton'

interface Props {
  params: Promise<{ seriesId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seriesId } = await params
  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { title: true, description: true },
  })
  if (!series) return { title: 'Series Not Found | Chapturs' }

  return {
    title: `${series.title} | Chapturs`,
    description: series.description ?? `Read ${series.title} on Chapturs.`,
    openGraph: {
      title: `${series.title} | Chapturs`,
      description: series.description ?? `Read ${series.title} on Chapturs.`,
      url: `https://chapturs.com/series/${seriesId}`,
      siteName: 'Chapturs',
    },
    alternates: { canonical: `https://chapturs.com/series/${seriesId}` },
  }
}

export default async function SeriesPage({ params }: Props) {
  const { seriesId } = await params

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      author: {
        select: {
          id: true,
          userId: true,
          user: { select: { name: true, image: true, username: true, displayName: true } },
        },
      },
      volumes: { orderBy: { orderIndex: 'asc' } },
      works: {
        include: {
          work: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImage: true,
              status: true,
              genres: true,
              statistics: true,
            },
          },
          volume: { select: { id: true, title: true } },
        },
        orderBy: { orderIndex: 'asc' },
      },
      _count: { select: { works: true } },
    },
  })

  if (!series) notFound()

  const authorName =
    (series.author.user as any)?.displayName ||
    (series.author.user as any)?.name ||
    (series.author.user as any)?.username ||
    'Unknown'

  const STATUS_COLORS: Record<string, string> = {
    ongoing: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    hiatus: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  }

  // Group works by volume
  const byVolume = new Map<string | null, typeof series.works>()
  for (const sw of series.works) {
    const key = sw.volumeId ?? null
    if (!byVolume.has(key)) byVolume.set(key, [])
    byVolume.get(key)!.push(sw)
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href={`/author/${series.author.userId}`} className="hover:text-white transition">
              {authorName}
            </Link>
            <span>/</span>
            <span className="text-gray-200">Series</span>
          </div>

          <div className="flex items-start gap-6">
            {series.coverImage ? (
              <div className="relative w-32 h-44 flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={series.coverImage}
                  alt={series.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-32 h-44 bg-gray-800 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg">
                <span className="text-4xl">📚</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{series.title}</h1>
              <Link
                href={`/author/${series.author.userId}`}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                by {authorName}
              </Link>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[series.status] ?? 'bg-gray-500/20 text-gray-400'}`}
                >
                  {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
                </span>
                <span className="text-xs text-gray-400">
                  {series._count.works} work{series._count.works !== 1 ? 's' : ''}
                </span>
                {series.volumes.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {series.volumes.length} volume{series.volumes.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {series.description && (
                <p className="mt-3 text-gray-400 text-sm leading-relaxed">{series.description}</p>
              )}

              <div className="mt-4">
                <SeriesSubscribeButton seriesId={seriesId} workCount={series._count.works} />
              </div>
            </div>
          </div>
        </div>

        {/* Works list */}
        <div>
          {series.volumes.length > 0 ? (
            // Show by volume
            series.volumes.map((vol) => {
              const volWorks = byVolume.get(vol.id) ?? []
              return (
                <div key={vol.id} className="mb-8">
                  <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700/50">
                    {vol.title}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {volWorks.map((entry, i) => (
                      <WorkCard key={entry.id} entry={entry} index={i} />
                    ))}
                  </div>
                </div>
              )
            })
          ) : null}

          {/* Works without a volume */}
          {(() => {
            const unvolumed = byVolume.get(null) ?? []
            if (unvolumed.length === 0) return null
            return (
              <div className="mb-8">
                {series.volumes.length > 0 && (
                  <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700/50">
                    Other Works
                  </h2>
                )}
                <div className="flex flex-col gap-3">
                  {unvolumed.map((entry, i) => (
                    <WorkCard key={entry.id} entry={entry} index={i} />
                  ))}
                </div>
              </div>
            )
          })()}

          {series._count.works === 0 && (
            <p className="text-gray-500 text-sm text-center py-12">No works in this series yet.</p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

// ─── WorkCard ─────────────────────────────────────────────────────────────────

function WorkCard({
  entry,
  index,
}: {
  entry: {
    id: string
    orderIndex: number
    work: {
      id: string
      title: string
      description: string
      coverImage?: string | null
      status: string
      genres: string
      statistics: string
    }
    volume?: { id: string; title: string } | null
  }
  index: number
}) {
  const work = entry.work
  let genres: string[] = []
  try { genres = JSON.parse(work.genres) } catch { /* noop */ }
  let stats: Record<string, number> = {}
  try { stats = JSON.parse(work.statistics) } catch { /* noop */ }

  const coverSrc = work.coverImage ? resolveCoverSrc(work.id, work.coverImage) : null

  return (
    <Link
      href={`/story/${work.id}`}
      className="flex items-start gap-4 p-4 bg-gray-800/40 hover:bg-gray-800/70 rounded-xl border border-gray-700/40 hover:border-gray-600/60 transition group"
    >
      <div className="flex-shrink-0 w-6 text-gray-500 text-sm text-center pt-1">{index + 1}</div>

      {coverSrc ? (
        <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden">
          <Image src={coverSrc} alt={work.title} fill className="object-cover" />
        </div>
      ) : (
        <div className="w-12 h-16 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
          <span className="text-xl">📖</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold group-hover:text-blue-300 transition truncate">{work.title}</p>
        {work.description && (
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{work.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {genres.slice(0, 3).map((g) => (
            <span key={g} className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
              {g}
            </span>
          ))}
          {stats.chapters != null && (
            <span className="text-xs text-gray-500">{stats.chapters} ch.</span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            work.status === 'ongoing'
              ? 'bg-green-900/40 text-green-400'
              : work.status === 'completed'
              ? 'bg-blue-900/40 text-blue-400'
              : 'bg-yellow-900/40 text-yellow-400'
          }`}
        >
          {work.status}
        </span>
      </div>
    </Link>
  )
}
