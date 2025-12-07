import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AchievementCard } from '@/components/achievements/AchievementCard';

interface PostAchievementCardProps {
  achievementId: string;
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
      <div className="rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 p-4 animate-pulse">
        <div className="h-20 bg-muted/20 rounded" />
      </div>
    );
  }

  if (!achievement) return null;

  return (
    <div className="mb-3">
      <AchievementCard
        name={achievement.name}
        description={achievement.description}
        category={achievement.category}
        points={achievement.points}
        compact
      />
    </div>
  );
};
