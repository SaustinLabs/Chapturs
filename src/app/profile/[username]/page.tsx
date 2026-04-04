'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/components/AppLayout'
import ProfileLayout from '@/components/profile/ProfileLayout'
import ProfileSidebar from '@/components/profile/ProfileSidebar'
import FeaturedSpace from '@/components/profile/FeaturedSpace'
import BlockGrid from '@/components/profile/BlockGrid'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { data: session } = useSession()
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

  const { user, works, profile } = data
  const featuredWork = profile?.featuredWorkId
    ? works?.find((w: any) => w.id === profile.featuredWorkId) ?? works?.[0] ?? null
    : works?.[0] ?? null
  const isOwner = session?.user?.name === username || session?.user?.email != null && user.id === (session as any)?.user?.id

  return (
    <AppLayout>
      <ProfileLayout
        sidebar={
          <ProfileSidebar
            profileImage={user.avatar || undefined}
            displayName={user.displayName || user.username}
            username={user.username}
            bio={user.bio || undefined}
            isPremium={user.isPremium}
          />
        }
        featured={
          featuredWork ? (
            <FeaturedSpace
              type="work"
              workData={{
                id: featuredWork.id,
                title: featuredWork.title,
                coverImage: featuredWork.coverImage || undefined,
                description: featuredWork.description || '',
                genres: featuredWork.genres || [],
                status: featuredWork.status,
              }}
            />
          ) : (
            <FeaturedSpace type="none" />
          )
        }
        blocks={
          <BlockGrid
            blocks={profile?.blocks ?? []}
            isOwner={isOwner}
            onAddBlock={isOwner ? () => window.location.assign('/creator/profile/edit') : undefined}
          />
        }
      />

      {/* Additional works beyond the featured one */}
      {works && works.length > 1 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            More from {user.displayName || user.username}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.slice(1).map((work: any) => (
              <a
                key={work.id}
                href={`/story/${work.id}`}
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
