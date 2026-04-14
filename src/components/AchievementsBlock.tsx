'use client'

import { useEffect, useState, useCallback } from 'react'
import { AchievementsResponse, UserAchievement } from '@/types/achievements'
import FeaturedAchievements from './FeaturedAchievements'

interface AchievementsBlockProps {
  userId: string
  isOwnProfile: boolean
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded w-36" />
          <div className="h-3 bg-gray-700 rounded w-24" />
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-8 h-8 bg-gray-700 rounded-full" />
        ))}
      </div>
    </div>
  )
}

export default function AchievementsBlock({ userId, isOwnProfile }: AchievementsBlockProps) {
  const [data, setData] = useState<AchievementsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/achievements/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const handleToggleFeatured = useCallback(
    async (achievementId: string, isFeatured: boolean) => {
      if (!data) return

      // Optimistic update
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          achievements: prev.achievements.map((a) =>
            a.id === achievementId ? { ...a, isFeatured } : a
          ),
        }
      })

      // PATCH /api/achievements/[userId]/featured — Rusty implements
      fetch(`/api/achievements/${userId}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId, isFeatured }),
      }).catch(() => {
        // Revert on network failure
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            achievements: prev.achievements.map((a) =>
              a.id === achievementId ? { ...a, isFeatured: !isFeatured } : a
            ),
          }
        })
      })
    },
    [data, userId]
  )

  const handleVisibilityToggle = useCallback(async () => {
    if (toggling) return
    setToggling(true)
    const next = !visible
    setVisible(next)

    // PATCH /api/achievements/[userId]/visibility — Rusty implements
    fetch(`/api/achievements/${userId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: next }),
    })
      .catch(() => setVisible(!next)) // revert on failure
      .finally(() => setToggling(false))
  }, [toggling, visible, userId])

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {data?.level ? (
              <>
                <span className="text-2xl" role="img" aria-label={data.level.title}>
                  {data.level.badge}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-100">
                    Level {data.level.level} — {data.level.title}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {data.totalPoints.toLocaleString()} points
                  </p>
                </div>
              </>
            ) : (
              <h2 className="text-lg font-bold text-gray-100">Achievements</h2>
            )}
          </div>

          {isOwnProfile && (
            <button
              onClick={handleVisibilityToggle}
              disabled={toggling}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                visible
                  ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
                  : 'border-gray-600 text-gray-500 hover:border-gray-500 hover:text-gray-400'
              }`}
            >
              {visible ? 'Shown on profile' : 'Hidden'}
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : !data || data.achievements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">🏆</p>
            <p className="text-gray-400 text-sm">
              No achievements yet — start writing!
            </p>
          </div>
        ) : (
          <FeaturedAchievements
            achievements={data.achievements}
            isOwnProfile={isOwnProfile}
            onToggleFeatured={isOwnProfile ? handleToggleFeatured : undefined}
          />
        )}
      </div>
    </section>
  )
}
