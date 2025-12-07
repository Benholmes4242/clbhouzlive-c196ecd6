import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';

interface PostAchievementCardProps {
  achievementId: string;
}

// Map category to a tier for display
function getCategoryTier(category: string): AchievementTier {
  switch (category) {
    case 'skill': return '20';
    case 'exploration': return '50';
    case 'social': return '10';
    default: return '5';
  }
}

export const PostAchievementCard: React.FC<PostAchievementCardProps> = ({ achievementId }) => {
  const [achievement, setAchievement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievement = async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (!error && data) {
        setAchievement(data);
      }
      setIsLoading(false);
    };

    fetchAchievement();
  }, [achievementId]);

  if (isLoading) {
    return (
      <div className="rounded-sq-lg bg-card/50 backdrop-blur-sm border border-border/50 p-4 animate-pulse">
        <div className="h-20 bg-muted/20 rounded" />
      </div>
    );
  }

  if (!achievement) return null;

  return (
    <div className="mb-3">
      <AchievementBadgeCard
        tier={getCategoryTier(achievement.category)}
        title={achievement.name}
        subtitle={achievement.description}
        unlocked={true}
      />
    </div>
  );
};
