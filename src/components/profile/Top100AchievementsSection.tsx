import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MedalIcon from '@/components/ui/medal-icon';

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
    <div className="mb-6">
      {/* Achievements Stats Card with embedded achievements */}
      <div className="bg-white/20 backdrop-blur-sm rounded-[8px] px-4 py-3 border border-white/30">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-lg text-white">Achievements</h3>
            <p className="text-white">
              You've played <span className="font-semibold text-white">{userProgress}</span> of 300 Top 100 courses
            </p>
          </div>
          
          {/* Achievement Cards - Limited height with scroll */}
          <div className="relative">
            <div 
              className="max-h-32 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent space-y-2"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin'
              }}
            >
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-300 ${
                    achievement.isEarned
                      ? "bg-white/10 border-white/30"
                      : "bg-white/5 border-white/20 opacity-60"
                  }`}
                >
                  {/* Achievement Icon */}
                  <div className="flex items-center justify-center w-6 h-6 rounded-full text-sm">
                    {achievement.id === '20-club' ? (
                      <MedalIcon size="sm" />
                    ) : (
                      <span>{achievement.emoji}</span>
                    )}
                  </div>

                  {/* Achievement Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white text-sm leading-tight">
                          {achievement.title}
                        </h4>
                        <p className="text-xs text-white/70">
                          {achievement.description}
                        </p>
                      </div>
                      
                      {/* Progress/Status */}
                      <div className="text-right">
                        {achievement.isEarned ? (
                          <span className="text-xs font-medium text-green-300">
                            ✓ Earned!
                          </span>
                        ) : (
                          <span className="text-xs text-white/60">
                            {Math.min(userProgress, achievement.threshold)}/{achievement.threshold}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scroll indicator gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/10 to-transparent pointer-events-none rounded-b-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Top100AchievementsSection;