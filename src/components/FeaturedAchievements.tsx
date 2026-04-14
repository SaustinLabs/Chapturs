'use client'

import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import AchievementBadge from './AchievementBadge'
import { UserAchievement } from '@/types/achievements'

interface FeaturedAchievementsProps {
  achievements: UserAchievement[]
  isOwnProfile: boolean
  onToggleFeatured?: (achievementId: string, isFeatured: boolean) => void
}

export default function FeaturedAchievements({
  achievements,
  isOwnProfile,
  onToggleFeatured,
}: FeaturedAchievementsProps) {
  const featured = achievements.filter((a) => a.isFeatured).slice(0, 4)
  const nonFeatured = achievements.filter((a) => !a.isFeatured)

  if (achievements.length === 0) return null

  const canPin = isOwnProfile && !!onToggleFeatured

  return (
    <div className="space-y-6">
      {/* Featured row — up to 4, lg size */}
      {featured.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Featured
          </p>
          <div className="flex flex-wrap gap-4">
            {featured.map((ua) => (
              <div key={ua.id} className="relative">
                <AchievementBadge
                  achievement={ua.achievement}
                  awardedAt={ua.awardedAt}
                  size="lg"
                  showTooltip
                />
                {canPin && (
                  <button
                    onClick={() => onToggleFeatured(ua.id, false)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors"
                    title="Unpin"
                  >
                    <StarIcon className="w-3 h-3 text-gray-900" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All / non-featured grid */}
      {nonFeatured.length > 0 && (
        <div>
          {featured.length > 0 && (
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              All Achievements
            </p>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {nonFeatured.map((ua) => (
              <div key={ua.id} className="relative group/item">
                <AchievementBadge
                  achievement={ua.achievement}
                  awardedAt={ua.awardedAt}
                  size="sm"
                  showTooltip
                />
                {/* Pin button — only visible on hover, only if < 4 featured */}
                {canPin && featured.length < 4 && (
                  <button
                    onClick={() => onToggleFeatured(ua.id, true)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 rounded-full items-center justify-center
                               opacity-0 group-hover/item:opacity-100 transition-opacity flex hover:bg-gray-600"
                    title="Pin to featured"
                  >
                    <StarOutlineIcon className="w-2.5 h-2.5 text-gray-300" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
