import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AppLayout from '@/components/AppLayout'
import { prisma } from '@/lib/database/PrismaService'
import { resolveCoverSrc } from '@/lib/images'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const list = await prisma.readingList.findUnique({
    where: { id },
    select: { name: true, description: true, isPublic: true },
  })

  if (!list || !list.isPublic) return { title: 'Reading List Not Found | Chapturs' }

  const description = list.description ?? `Read ${list.name} on Chapturs.`

  return {
    title: `${list.name} | Chapturs`,
    description,
    openGraph: {
      title: `${list.name} | Chapturs`,
      description,
      url: `https://chapturs.com/lists/${id}`,
      siteName: 'Chapturs',
    },
    alternates: { canonical: `https://chapturs.com/lists/${id}` },
  }
}

export default async function ReadingListPage({ params }: Props) {
  const { id } = await params

  const list = await prisma.readingList.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
      items: {
        include: {
          work: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImage: true,
              status: true,
              formatType: true,
              maturityRating: true,
              genres: true,
              author: {
                select: {
                  id: true,
                  user: {
                    select: { id: true, username: true, displayName: true, avatar: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { orderIndex: 'asc' },
      },
      _count: { select: { items: true } },
    },
  })

  if (!list || !list.isPublic) notFound()

  const creatorName = list.user.displayName || list.user.username || 'Unknown'
  const createdAt = new Date(list.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link
            href={list.user.username ? `/profile/${list.user.username}` : '/'}
            className="hover:text-white transition"
          >
            {creatorName}
          </Link>
          <span>/</span>
          <span className="text-gray-200">Reading List</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {list.name}
          </h1>

          <Link
            href={list.user.username ? `/profile/${list.user.username}` : '/'}
            className="text-sm text-gray-400 hover:text-white transition inline-flex items-center gap-2"
          >
            {list.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={list.user.avatar}
                alt={creatorName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                {creatorName.charAt(0).toUpperCase()}
              </span>
            )}
            by {creatorName}
          </Link>

          <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-gray-400">
            <span>{list._count.items} work{list._count.items !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>Created {createdAt}</span>
          </div>

          {list.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-2xl">
              {list.description}
            </p>
          )}
        </div>

        {/* Works grid */}
        {list.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No works in this list yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Check back later for new additions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {list.items.map((item) => {
              const work = item.work
              if (!work) return null

              let genres: string[] = []
              try {
                genres = typeof work.genres === 'string' ? JSON.parse(work.genres) : (work.genres || [])
              } catch { /* noop */ }

              const coverSrc = work.coverImage ? resolveCoverSrc(work.id, work.coverImage) : null
              const authorName =
                work.author?.user?.displayName || work.author?.user?.username || ''

              return (
                <Link key={item.id} href={`/story/${work.id}`} className="group">
                  <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2 shadow-sm">
                    {coverSrc ? (
                      <Image
                        src={coverSrc}
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
                  {authorName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {authorName}
                    </p>
                  )}
                  {genres.length > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                      {genres[0]}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2 italic">
                      “{item.note}”
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
