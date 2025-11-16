import React from 'react';
import { useRecentAchievements } from '@/hooks/useRecentAchievements';
import { formatDistanceToNow } from 'date-fns';

interface ProfileRecentAchievementsStripProps {
  userId: string;
  isOwnProfile: boolean;
}

const getCategoryEmoji = (category: string): string => {
  switch (category) {
    case 'skill':
      return '🎯';
    case 'exploration':
      return '🌍';
    case 'social':
      return '👥';
    default:
      return '🏆';
  }
};

export const ProfileRecentAchievementsStrip: React.FC<ProfileRecentAchievementsStripProps> = ({
  userId,
  isOwnProfile,
}) => {
  const { data: recentAchievements = [], isLoading } = useRecentAchievements(userId, 3);

  if (isLoading || recentAchievements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        {isOwnProfile ? 'Recently unlocked' : 'Their recent achievements'}
      </p>
      <div className="flex flex-wrap gap-3">
        {recentAchievements.map((achievement) => (
          <div
            key={achievement.achievementId}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm"
          >
            <span className="text-2xl">{getCategoryEmoji(achievement.category)}</span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {achievement.name}
              </span>
              <span className="text-xs text-muted-foreground">
                Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
