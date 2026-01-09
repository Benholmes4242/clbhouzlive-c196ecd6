import React, { useMemo } from 'react';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { useBadges } from '@/hooks/useBadges';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Top100AchievementsListProps {
  userId: string;
  showAllInitially?: boolean;
}

/**
 * Top100AchievementsList - Part of Global Achievement & Milestone System
 * Uses unified EliteGameCard for premium game-reward styling
 */
const Top100AchievementsList: React.FC<Top100AchievementsListProps> = ({ 
  userId, 
  showAllInitially = false 
}) => {
  const { badgeProgress, isLoading } = useBadges(userId);

  // Get real user's Top 100 course progress across all regional lists (ratings-only)
  const { data: userProgress = 0 } = useQuery({
    queryKey: ['userTop100Progress', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          golf_courses (
            regional_rank,
            usa_rank,
            global_rank
          )
        `)
        .eq('user_id', userId);
      
      if (ratingsError) {
        console.error('Error fetching course_ratings:', ratingsError);
        return 0;
      }
      
      const uniqueCourseIds = new Set();
      const uniqueTop100Courses = (ratingsData || []).filter(course => {
        const gc = course.golf_courses;
        const isTop100 = gc && (
          (gc.regional_rank && gc.regional_rank <= 100) ||
          (gc.usa_rank && gc.usa_rank <= 100) ||
          (gc.global_rank && gc.global_rank <= 100)
        );
        
        if (isTop100 && !uniqueCourseIds.has(course.course_id)) {
          uniqueCourseIds.add(course.course_id);
          return true;
        }
        return false;
      });
      
      return uniqueTop100Courses.length;
    },
    enabled: !!userId,
  });

  const milestones = useMemo(() => [
    { threshold: 5, label: 'Rookie Club' },
    { threshold: 10, label: 'Fairway Club' },
    { threshold: 20, label: 'Founders Club' },
    { threshold: 50, label: 'Heritage Club' },
    { threshold: 100, label: 'Century Club' },
    { threshold: 200, label: 'Elite Club' },
    { threshold: 300, label: 'Legendary Club' },
    { threshold: 400, label: 'Grand Slam Club' },
  ], []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-[110px] bg-muted rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const isUnlocked = userProgress >= milestone.threshold;
          
          return (
            <EliteGameCard
              key={milestone.threshold}
              tier={String(milestone.threshold) as EliteCardTier}
              earned={isUnlocked}
              currentProgress={userProgress}
              enableAnimations={false}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Top100AchievementsList;
