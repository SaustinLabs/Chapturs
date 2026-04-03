'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import ProfileLayout from '@/components/profile/ProfileLayout'
import ProfileSidebar from '@/components/profile/ProfileSidebar'
import FeaturedSpace from '@/components/profile/FeaturedSpace'
import BlockGrid from '@/components/profile/BlockGrid'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    fetch(`/api/profile/${username}`)
      .then(async (res) => {
        if (res.status === 404) {
          setError('not_found')
          return
        }
        if (!res.ok) throw new Error('Failed to fetch profile')
        const json = await res.json()
        setData(json)
      })
      .catch(() => setError('fetch_error'))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400">Loading profile...</div>
        </div>
      </AppLayout>
    )
  }

  if (error === 'not_found') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-100 mb-2">User Not Found</h1>
            <p className="text-gray-400">This user doesn&apos;t exist.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Error</h1>
            <p className="text-gray-400">Failed to load profile.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const { user, profile, featuredWork } = data

  // If profile exists but not published
  if (profile && !profile.isPublished) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Profile Not Published
            </h1>
            <p className="text-gray-400">
              This creator hasn&apos;t published their profile yet.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* User's works list */}
      {data.works && data.works.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.displayName || user.username}&apos;s Works
            </h2>
            {user.isPremium && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
                ✦ Premium
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {data.author?.workCount || data.works.length} {data.works.length === 1 ? 'work' : 'works'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.works.map((work: any) => (
              <a
                key={work.id}
                href={`/work/${work.id}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{work.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{work.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{work.statistics.sections} chapters</span>
                  <span>{work.statistics.likes} likes</span>
                  <span className="capitalize">{work.status}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
