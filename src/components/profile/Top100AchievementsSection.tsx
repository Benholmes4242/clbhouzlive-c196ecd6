import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Top100AchievementsSectionProps {
  userId: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  threshold: number;
  isEarned: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

const Top100AchievementsSection: React.FC<Top100AchievementsSectionProps> = ({
  userId,
  isOwnProfile = false,
  userDisplayName
}) => {
  console.log('Top100AchievementsSection rendering with userId:', userId);
  
  // Get real user's Top 100 course progress across all regional lists
  const { data: userProgress = 0 } = useQuery({
    queryKey: ['userTop100Progress', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      // Get courses from user_top100_courses table
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          golf_courses (
            regional_rank,
            usa_rank,
            global_rank
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);
      
      if (top100Error) {
        console.error('Error fetching user_top100_courses:', top100Error);
      }
      
      // Get courses from course_ratings table
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
      }
      
      // Combine all courses and filter for Top 100
      const allCourses = [
        ...(top100Data || []),
        ...(ratingsData || [])
      ];
      
      // Get unique course IDs and filter for Top 100 ranked courses
      const uniqueCourseIds = new Set();
      const uniqueTop100Courses = allCourses.filter(course => {
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
    {
      id: '20-club',
      emoji: '🥉',
      title: '20 Club',
      description: 'Played 20 Top 100 courses',
      threshold: 20,
      isEarned: userProgress >= 20,
      tier: 'bronze'
    },
    {
      id: '50-club',
      emoji: '🥈',
      title: '50 Club',
      description: 'Played 50 Top 100 courses',
      threshold: 50,
      isEarned: userProgress >= 50,
      tier: 'silver'
    },
    {
      id: '75-club',
      emoji: '🥇',
      title: '75 Club',
      description: 'Played 75 Top 100 courses',
      threshold: 75,
      isEarned: userProgress >= 75,
      tier: 'gold'
    },
    {
      id: '200-club',
      emoji: '🏆',
      title: '200 Club',
      description: 'Played 200 Top 100 courses',
      threshold: 200,
      isEarned: userProgress >= 200,
      tier: 'platinum'
    },
    {
      id: 'hall-of-famer',
      emoji: '💎',
      title: 'Hall of Famer',
      description: 'Completed all regional lists',
      threshold: 300,
      isEarned: userProgress >= 300,
      tier: 'diamond'
    }
  ], [userProgress]);

  const earnedAchievements = achievements.filter(achievement => achievement.isEarned);
  const hasEarnedBadges = earnedAchievements.length > 0;
  
  // Get the highest earned achievement for display
  const highestEarnedAchievement = earnedAchievements.length > 0 
    ? earnedAchievements[earnedAchievements.length - 1] 
    : null;

  // Get user's first name for display text
  const firstName = isOwnProfile 
    ? 'You' 
    : userDisplayName?.split(' ')[0] || 'This user';

  const getTierColor = (tier: string, isEarned: boolean) => {
    if (!isEarned) return 'bg-gray-300 text-gray-500';
    
    switch (tier) {
      case 'bronze': return 'bg-amber-600 text-white';
      case 'silver': return 'bg-gray-400 text-white';
      case 'gold': return 'bg-yellow-500 text-white';
      case 'platinum': return 'bg-purple-600 text-white';
      case 'diamond': return 'bg-blue-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex gap-4 mb-6">
      {/* Achievements Stats Card - Only takes space it needs */}
      <div className="flex-shrink-0">
        <div className="bg-white/20 backdrop-blur-sm rounded-[8px] px-4 py-3 border border-white/30">
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-white">Achievements</h3>
            <p className="text-white">
              You've played <span className="font-semibold text-white">{userProgress}</span> of 300 Top 100 courses
            </p>
          </div>
        </div>
      </div>

      {/* Earned Badge Card - Only show if user has earned badges */}
      {hasEarnedBadges && highestEarnedAchievement && (
        <div className="flex-shrink-0">
          <div className="text-center px-4 py-3">
            <div className="text-4xl mb-2">
              {highestEarnedAchievement.emoji}
            </div>
            <div>
              <div className="font-semibold text-white leading-tight">
                {highestEarnedAchievement.title}
              </div>
              <div className="text-xs text-white/80 -mt-0.5">
                Played {highestEarnedAchievement.threshold} top 100 courses
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Top100AchievementsSection;