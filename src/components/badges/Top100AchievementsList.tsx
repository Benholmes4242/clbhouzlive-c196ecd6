import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Top100AchievementCard from './Top100AchievementCard';
import { useBadges } from '@/hooks/useBadges';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Top100Achievement {
  id: string;
  emoji: string;
  title: string;
  requirement: string;
  threshold: number;
  isEarned: boolean;
  progress: number;
  isSpecial?: boolean;
}

interface Top100AchievementsListProps {
  userId: string;
  showAllInitially?: boolean;
}

const Top100AchievementsList: React.FC<Top100AchievementsListProps> = ({ 
  userId, 
  showAllInitially = false 
}) => {
  const [showAll, setShowAll] = useState(showAllInitially);
  const { badgeProgress, isLoading } = useBadges(userId);

  // Get real user's Top 100 course progress
  const { data: userProgress = 0 } = useQuery({
    queryKey: ['userTop100Progress', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { data, error } = await supabase
        .from('user_top100_courses')
        .select('course_id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('played', true);
      
      if (error) {
        console.error('Error fetching user Top 100 progress:', error);
        return 0;
      }
      
      return data?.length || 0;
    },
    enabled: !!userId,
  });

  const achievements: Top100Achievement[] = useMemo(() => [
    {
      id: '20-club',
      emoji: '🎖️',
      title: '20 Club',
      requirement: 'Played 20 Top 100 courses',
      threshold: 20,
      isEarned: userProgress >= 20,
      progress: userProgress
    },
    {
      id: '50-club',
      emoji: '🏅',
      title: '50 Club',
      requirement: 'Played 50 Top 100 courses',
      threshold: 50,
      isEarned: userProgress >= 50,
      progress: userProgress
    },
    {
      id: '75-club',
      emoji: '🥈',
      title: '75 Club',
      requirement: 'Played 75 Top 100 courses',
      threshold: 75,
      isEarned: userProgress >= 75,
      progress: userProgress
    },
    {
      id: 'top-100-finisher',
      emoji: '🥇',
      title: 'Top 100 Finisher',
      requirement: 'Completed a full Top 100 list (any one list)',
      threshold: 100,
      isEarned: userProgress >= 100,
      progress: userProgress
    },
    {
      id: '200-club',
      emoji: '🥉',
      title: '200 Club',
      requirement: 'Played 200 of the 300 unique Top 100 courses across all lists',
      threshold: 200,
      isEarned: userProgress >= 200,
      progress: userProgress
    },
    {
      id: '300-club',
      emoji: '💎',
      title: '300 Club',
      requirement: 'Completed all 300 unique courses across the GB&I, Europe, and USA Top 100s',
      threshold: 300,
      isEarned: userProgress >= 300,
      progress: userProgress
    },
    {
      id: 'global-finisher',
      emoji: '🏆',
      title: 'Clbhouz Global Finisher',
      requirement: 'All 4 Lists Complete - Every course on every Top 100 list',
      threshold: 400,
      isEarned: userProgress >= 400,
      progress: userProgress,
      isSpecial: true
    }
  ], [userProgress]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-4 p-4 rounded-2xl border">
              <div className="w-12 h-12 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted/60 rounded w-2/3"></div>
              </div>
              <div className="w-16 h-8 bg-muted rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayedAchievements = showAll ? achievements : achievements.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Achievements List */}
      <div className="space-y-3">
        {displayedAchievements.map((achievement) => (
          <Top100AchievementCard
            key={achievement.id}
            achievement={achievement}
          />
        ))}
      </div>

      {/* Show More/Less Toggle */}
      {achievements.length > 4 && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted/50"
          >
            {showAll ? 'Show Less' : `See All Achievements (${achievements.length - 4} more)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Top100AchievementsList;