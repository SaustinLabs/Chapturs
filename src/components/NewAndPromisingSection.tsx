'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { resolveCoverSrc } from '@/lib/images'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

interface Work {
  id: string
  title: string
  coverImage: string | null
  author: { username: string; displayName: string | null } | null
  genres: string[]
  status: string
}

export default function NewAndPromisingSection() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/search?sortBy=recent&limit=8')
      .then((r) => r.json())
      .then((data) => {
        const items: any[] = data.data?.items || []
        const mapped = items.map((item: any) => {
          const w = item.work ?? item
          return {
            id: w.id,
            title: w.title,
            coverImage: w.coverImage ?? null,
            author: w.author ?? null,
            genres: Array.isArray(w.genres) ? w.genres : [],
            status: w.status ?? '',
          } as Work
        })
        setWorks(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && works.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          ✨ New &amp; Promising
        </h2>
        <Link
          href="/browse?sort=recent"
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          See all <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-none w-28 sm:w-32 animate-pulse">
                <div className="aspect-[2/3] rounded-lg bg-gray-200 dark:bg-gray-700 mb-1.5" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-1" />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
              </div>
            ))
          : works.map((w) => (
              <Link key={w.id} href={`/story/${w.id}`} className="flex-none w-28 sm:w-32 group">
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-1.5 shadow-sm">
                  {w.coverImage ? (
                    <Image
                      src={resolveCoverSrc(w.id, w.coverImage as string) as string}
                      alt={w.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="128px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800">
                      <span className="text-2xl">📖</span>
                    </div>
                  )}
                  {w.status === 'completed' && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold bg-green-600 text-white px-1 py-0.5 rounded">
                      Complete
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                  {w.title}
                </p>
                {w.author && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {w.author.displayName || w.author.username}
                  </p>
                )}
              </Link>
            ))}
      </div>
    </section>
  )
}
