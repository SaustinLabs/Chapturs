'use client'

import { AchievementTier } from '@/types/achievements'

interface AchievementBadgeProps {
  achievement: {
    key: string
    title: string
    description: string
    badgeIcon: string
    tier: AchievementTier
    pointValue: number
  }
  awardedAt?: Date | string
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

const tierRing: Record<AchievementTier, string> = {
  bronze: 'ring-amber-600 bg-amber-600/10',
  silver: 'ring-gray-400 bg-gray-400/10',
  gold: 'ring-yellow-400 bg-yellow-400/10',
  platinum: 'ring-purple-400 bg-purple-400/10',
}

const sizeClasses = {
  sm: 'w-8 h-8 text-base',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl',
}

export default function AchievementBadge({
  achievement,
  awardedAt,
  size = 'md',
  showTooltip = true,
}: AchievementBadgeProps) {
  return (
    <div className="relative group">
      {/* Badge circle */}
      <div
        className={`${sizeClasses[size]} ${tierRing[achievement.tier]} rounded-full ring-2 flex items-center justify-center cursor-default select-none`}
        aria-label={achievement.title}
      >
        <span role="img" aria-label={achievement.title}>
          {achievement.badgeIcon}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50
                     opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 text-left"
        >
          <p className="text-sm font-semibold text-gray-100 mb-0.5">
            {achievement.title}
          </p>
          <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-yellow-400">
              +{achievement.pointValue} pts
            </span>
            {awardedAt && (
              <span className="text-xs text-gray-500">
                {new Date(awardedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}
