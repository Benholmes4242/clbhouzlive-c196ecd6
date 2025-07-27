import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Top100AchievementsSectionProps {
  userId: string;
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
  userId
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Achievements Stats Card - Takes up 2/3 of the space */}
      <div className="md:col-span-2">
        <Card className="bg-gray-50/50">
          <CardContent className="p-4 pr-4">
            <div className="space-y-2">
              <h3 className="font-bold text-lg">Achievements</h3>
              <p className="text-muted-foreground pr-0">
                You've played <span className="font-semibold text-foreground">{userProgress}</span> of 300 Top 100 courses
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earned Badges Card - Takes up 1/3 of the space */}
      <div className="md:col-span-1">
        <Card className="bg-gray-50/50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Earned Badges</h4>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="text-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm mb-1 transition-all duration-300 ${
                        getTierColor(achievement.tier, achievement.isEarned)
                      } ${achievement.isEarned ? 'shadow-md' : 'opacity-50'}`}
                    >
                      {achievement.emoji}
                    </div>
                    <div className="text-xs">
                      <div className={`font-medium ${achievement.isEarned ? 'text-foreground' : 'text-gray-400'}`}>
                        {achievement.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Top100AchievementsSection;