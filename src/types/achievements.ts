export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'author' | 'reader' | 'contributor';

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  badgeIcon: string;
  pointValue: number;
  tier: AchievementTier;
  category: AchievementCategory;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  awardedAt: string;
  isFeatured: boolean;
  sourceId?: string;
  achievement: Achievement;
}

export interface AchievementsResponse {
  achievements: UserAchievement[];
  totalPoints: number;
  level: { level: number; title: string; badge: string; minPoints: number } | null;
  stats: { total: number; featured: number };
}
