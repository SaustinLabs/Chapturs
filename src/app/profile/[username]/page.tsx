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
      <ProfileLayout
        sidebar={
          <ProfileSidebar
            profileImage={profile?.profileImage || user.avatar || undefined}
            displayName={profile?.displayName || user.displayName || user.username}
            username={user.username}
            bio={profile?.bio || undefined}
            isOwner={false}
          />
        }
        featured={
          <FeaturedSpace
            type={profile?.featuredType as 'work' | 'block' | 'none' || 'none'}
            workData={featuredWork ? {
              id: featuredWork.id,
              title: featuredWork.title,
              coverImage: featuredWork.coverImage || undefined,
              description: featuredWork.description,
              genres: typeof featuredWork.genres === 'string'
                ? JSON.parse(featuredWork.genres)
                : featuredWork.genres,
              status: featuredWork.status,
            } : undefined}
            isOwner={false}
          />
        }
        blocks={
          <BlockGrid
            blocks={profile?.blocks || []}
            isOwner={false}
          />
        }
      />
    </AppLayout>
  )
}
