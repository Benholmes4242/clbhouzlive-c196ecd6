import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

interface ClubhouseAchievementsTrayProps {
  userId: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
  className?: string;
}

interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  threshold: number;
  isEarned: boolean;
  tier: EliteCardTier;
}

/**
 * ClubhouseAchievementsTray - Part of Global Achievement & Milestone System
 * Uses unified EliteGameCard for premium game-reward styling
 */
const ClubhouseAchievementsTray: React.FC<ClubhouseAchievementsTrayProps> = ({
  userId,
  isOwnProfile = false,
  userDisplayName,
  className = ""
}) => {
  // Get user's Top 100 course progress
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

  const achievements: Achievement[] = useMemo(() => [
    { id: '5-club', title: '5 Club', subtitle: 'Rookie Club', threshold: 5, isEarned: userProgress >= 5, tier: '5' },
    { id: '10-club', title: '10 Club', subtitle: 'Fairway Club', threshold: 10, isEarned: userProgress >= 10, tier: '10' },
    { id: '20-club', title: '20 Club', subtitle: 'Founders Club', threshold: 20, isEarned: userProgress >= 20, tier: '20' },
    { id: '50-club', title: '50 Club', subtitle: 'Heritage Club', threshold: 50, isEarned: userProgress >= 50, tier: '50' },
    { id: '100-club', title: '100 Club', subtitle: 'Century Club', threshold: 100, isEarned: userProgress >= 100, tier: '100' },
    { id: '200-club', title: '200 Club', subtitle: 'Elite Club', threshold: 200, isEarned: userProgress >= 200, tier: '200' },
    { id: '300-club', title: '300 Club', subtitle: 'Legendary Club', threshold: 300, isEarned: userProgress >= 300, tier: '300' },
    { id: '400-club', title: '400 Club', subtitle: 'Grand Slam Club', threshold: 400, isEarned: userProgress >= 400, tier: '400' },
  ], [userProgress]);

  const earnedAchievements = achievements.filter(a => a.isEarned);

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="font-display text-heading-lg font-semibold leading-snug text-foreground">
              Clubhouse Achievements
            </h3>
            <p className="text-body-sm text-muted-foreground">
              {earnedAchievements.length} of {achievements.length} achievements earned
            </p>
          </div>

          {/* Achievement Grid - using EliteGameCard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((achievement) => (
              <EliteGameCard
                key={achievement.id}
                tier={achievement.tier}
                earned={achievement.isEarned}
                currentProgress={userProgress}
                enableAnimations={false}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubhouseAchievementsTray;
