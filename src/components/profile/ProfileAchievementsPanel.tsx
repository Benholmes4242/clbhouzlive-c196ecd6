import React, { useState, useMemo } from 'react';
import { useUserAchievements, type UserAchievement } from '@/hooks/useUserAchievements';
import { Check, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProfileAchievementsPanelProps {
  userId: string;
  isOwnProfile: boolean;
  onShareAchievement?: (achievement: UserAchievement) => void;
}

type CategoryFilter = 'all' | 'skill' | 'exploration' | 'social';

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

export const ProfileAchievementsPanel: React.FC<ProfileAchievementsPanelProps> = ({
  userId,
  isOwnProfile,
  onShareAchievement,
}) => {
  const { data: achievements = [], isLoading } = useUserAchievements(userId);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let filtered = achievements;

    if (selectedCategory !== 'all') {
      filtered = achievements.filter(a => a.category === selectedCategory);
    }

    // Sort: unlocked first, then by sort order
    return [...filtered].sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) {
        return a.isUnlocked ? -1 : 1;
      }
      return 0; // Rely on hook's sort_order
    });
  }, [achievements, selectedCategory]);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  if (isLoading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
        <div className="space-y-4">
          <div className="h-6 bg-muted/20 rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted/20 rounded w-full max-w-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted/20 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasUnlockedAchievements = unlockedCount > 0;

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">
            {isOwnProfile ? 'Achievements' : 'Their Achievements'}
          </h3>
          {hasUnlockedAchievements && (
            <span className="text-sm text-muted-foreground">
              {unlockedCount} / {achievements.length} unlocked
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isOwnProfile
            ? 'Track milestones from your Golf Journey, Top 100 exploration, and social activity.'
            : 'See what this golfer has unlocked so far.'}
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'skill', 'exploration', 'social'] as CategoryFilter[]).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              selectedCategory === category
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            )}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {!hasUnlockedAchievements && (
        <div className="py-12 text-center space-y-2">
          <p className="text-foreground font-medium">
            {isOwnProfile
              ? "You haven't unlocked any achievements yet."
              : "This golfer hasn't unlocked any achievements yet."}
          </p>
          {isOwnProfile && (
            <p className="text-sm text-muted-foreground">
              Play rounds, leave reviews, and follow golfers to start unlocking.
            </p>
          )}
        </div>
      )}

      {/* Achievement Grid */}
      {hasUnlockedAchievements && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.achievementId}
              className={cn(
                'group relative p-4 rounded-xl border transition-all',
                achievement.isUnlocked
                  ? 'bg-gradient-to-br from-primary/5 to-transparent border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
                  : 'bg-muted/5 border-border/30 opacity-60'
              )}
            >
              {/* Unlocked Glow Effect */}
              {achievement.isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}

              <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 text-2xl">
                  {getCategoryEmoji(achievement.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm leading-tight">
                      {achievement.name}
                    </h4>
                    {achievement.isUnlocked && (
                      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {achievement.description}
                  </p>
                  {achievement.isUnlocked && achievement.unlockedAt && (
                    <p className="text-xs text-muted-foreground">
                      Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                    </p>
                  )}
                  {!achievement.isUnlocked && (
                    <p className="text-xs text-muted-foreground italic">
                      Locked
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
