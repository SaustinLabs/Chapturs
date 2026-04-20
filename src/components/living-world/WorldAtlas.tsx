'use client'

interface Work {
  id: string
  title: string
  description: string
  coverImage?: string | null
  status: string
  genres: string
  author: {
    id: string
    userId: string
    user: { username: string; displayName?: string | null; avatar?: string | null }
  }
}

interface Props {
  world: { id: string; title: string }
  works: Work[]
}

export default function WorldAtlas({ world, works }: Props) {
  if (works.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold text-white mb-6">Stories in this World</h2>
        <p className="text-gray-500 text-sm">No stories have been added to this world yet.</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-6">
        Stories in {world.title}
        <span className="ml-2 text-sm font-normal text-gray-400">({works.length})</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {works.map((work) => {
          let genres: string[] = []
          try {
            genres = JSON.parse(work.genres)
          } catch {}

          return (
            <a
              key={work.id}
              href={`/story/${work.id}`}
              className="group block rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-600 transition-colors"
            >
              <div className="aspect-[2/3] bg-gray-800 relative overflow-hidden">
                {work.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={work.coverImage}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-end p-3 bg-gradient-to-br from-indigo-900 to-gray-900">
                    <span className="text-xs font-medium text-gray-300 line-clamp-3">{work.title}</span>
                  </div>
                )}
                {/* Living World badge */}
                <div className="absolute top-2 left-2">
                  <span className="rounded-full bg-indigo-700/80 px-2 py-0.5 text-xs font-medium text-indigo-200 backdrop-blur-sm">
                    🌍
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-100 line-clamp-2 group-hover:text-white">
                  {work.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {work.author.user.displayName ?? work.author.user.username}
                </p>
                {genres.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {genres.slice(0, 2).map((g) => (
                      <span key={g} className="rounded-full bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
