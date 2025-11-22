import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import MedalIcon from '@/components/ui/medal-icon';

interface ClubhouseAchievementsTrayProps {
  userId: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
  className?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  threshold: number;
  isEarned: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: 'exploration' | 'skill';
  badgeType?: '20-club' | '50-club' | '100-club' | '200-club' | '300-club' | 'globe-trotter' | 'albatross' | 'birdie-blitz' | 'birdie-every-par' | 'eagle-collector';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

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
      
      const allCourses = [
        ...(top100Data || []),
        ...(ratingsData || [])
      ];
      
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

  // Define achievements with new badges
  const achievements: Achievement[] = useMemo(() => [
    // Exploration-Based Achievements
    {
      id: '20-club',
      title: '20 Club',
      description: 'Played 20 Top 100 courses',
      threshold: 20,
      isEarned: userProgress >= 20,
      tier: 'bronze',
      category: 'exploration',
      badgeType: '20-club',
      rarity: 'common'
    },
    {
      id: '50-club',
      title: '50 Club',
      description: 'Played 50 Top 100 courses',
      threshold: 50,
      isEarned: userProgress >= 50,
      tier: 'silver',
      category: 'exploration',
      badgeType: '50-club',
      rarity: 'rare'
    },
    {
      id: '100-century-club',
      title: '100 Century Club',
      description: 'Played 100 Top 100 courses',
      threshold: 100,
      isEarned: userProgress >= 100,
      tier: 'gold',
      category: 'exploration',
      badgeType: '100-club',
      rarity: 'epic'
    },
    {
      id: '200-clubhouse-elite',
      title: '200 Clubhouse Elite',
      description: 'Played 200 Top 100 courses',
      threshold: 200,
      isEarned: userProgress >= 200,
      tier: 'platinum',
      category: 'exploration',
      badgeType: '200-club',
      rarity: 'epic'
    },
    {
      id: '300-club-champion',
      title: '300 Club Champion',
      description: 'Played 300 Top 100 courses',
      threshold: 300,
      isEarned: userProgress >= 300,
      tier: 'diamond',
      category: 'exploration',
      badgeType: '300-club',
      rarity: 'legendary'
    },
    {
      id: 'globe-trotter-golfer',
      title: 'Globe Trotter Golfer',
      description: 'Played courses on every continent',
      threshold: 7, // 7 continents
      isEarned: false, // TODO: Implement continent tracking
      tier: 'platinum',
      category: 'exploration',
      badgeType: 'globe-trotter',
      rarity: 'legendary'
    },
    // Skill-Based Achievements
    {
      id: 'albatross-ace',
      title: 'Albatross Ace',
      description: 'Score the rarest shot in golf — In the hole for 2 on a par 5',
      threshold: 1,
      isEarned: false, // TODO: Implement score tracking
      tier: 'diamond',
      category: 'skill',
      badgeType: 'albatross',
      rarity: 'legendary'
    },
    {
      id: 'birdie-blitz',
      title: 'Birdie Blitz',
      description: 'Score 5 birdies in a single round',
      threshold: 5,
      isEarned: false, // TODO: Implement score tracking
      tier: 'gold',
      category: 'skill',
      badgeType: 'birdie-blitz',
      rarity: 'rare'
    },
    {
      id: 'birdie-every-par',
      title: 'Birdie Every Par',
      description: 'Score a birdie on every par (3, 4, and 5) in one round',
      threshold: 3,
      isEarned: false, // TODO: Implement score tracking
      tier: 'platinum',
      category: 'skill',
      badgeType: 'birdie-every-par',
      rarity: 'epic'
    },
    {
      id: 'eagle-collector',
      title: 'Eagle Collector',
      description: 'Score 10 eagles across all rounds',
      threshold: 10,
      isEarned: false, // TODO: Implement score tracking
      tier: 'platinum',
      category: 'skill',
      badgeType: 'eagle-collector',
      rarity: 'epic'
    }
  ], [userProgress]);

  const explorationAchievements = achievements.filter(a => a.category === 'exploration');
  const skillAchievements = achievements.filter(a => a.category === 'skill');
  const earnedAchievements = achievements.filter(a => a.isEarned);

  const getTierColor = (tier: string, isEarned: boolean) => {
    if (!isEarned) return 'bg-muted/50 text-muted-foreground border-muted';
    
    switch (tier) {
      case 'bronze': return 'bg-amber-500/20 text-amber-700 border-amber-500/50';
      case 'silver': return 'bg-slate-500/20 text-slate-700 border-slate-500/50';
      case 'gold': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
      case 'platinum': return 'bg-purple-500/20 text-purple-700 border-purple-500/50';
      case 'diamond': return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      default: return 'bg-muted/50 text-muted-foreground border-muted';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Badge variant="secondary" className="text-xs">Common</Badge>;
      case 'rare': return <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">Rare</Badge>;
      case 'epic': return <Badge variant="outline" className="text-xs border-purple-500 text-purple-700">Epic</Badge>;
      case 'legendary': return <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">Legendary</Badge>;
      default: return null;
    }
  };

  const renderAchievementBadge = (achievement: Achievement) => {
    if (achievement.badgeType) {
      return (
        <MedalIcon 
          type={achievement.badgeType} 
          size="lg" 
          className={!achievement.isEarned ? 'opacity-40 grayscale' : ''}
        />
      );
    }
    return (
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
        achievement.isEarned ? 'bg-primary/20' : 'bg-muted/50'
      }`}>
        🏆
      </div>
    );
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="font-display text-heading-lg font-semibold leading-snug text-foreground">Clubhouse Achievements</h3>
            <p className="text-body-sm text-muted-foreground">
              {earnedAchievements.length} of {achievements.length} achievements earned
            </p>
          </div>

          {/* Exploration Achievements */}
          <div>
            <h4 className="text-heading-md font-semibold leading-snug text-foreground mb-3">Exploration Achievements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {explorationAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    achievement.isEarned
                      ? getTierColor(achievement.tier, true)
                      : getTierColor(achievement.tier, false)
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {renderAchievementBadge(achievement)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-body-sm truncate">{achievement.title}</h5>
                        {achievement.rarity && getRarityBadge(achievement.rarity)}
                      </div>
                      <p className="text-meta text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-meta font-medium">
                          {achievement.isEarned ? (
                            <span className="text-green-600">✓ Earned!</span>
                          ) : (
                            <span>
                              {Math.min(userProgress, achievement.threshold)}/{achievement.threshold}
                            </span>
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {achievement.tier}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Achievements */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">Skill Achievements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skillAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    achievement.isEarned
                      ? getTierColor(achievement.tier, true)
                      : getTierColor(achievement.tier, false)
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {renderAchievementBadge(achievement)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm truncate">{achievement.title}</h5>
                        {achievement.rarity && getRarityBadge(achievement.rarity)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {achievement.isEarned ? (
                            <span className="text-green-600">✓ Earned!</span>
                          ) : (
                            <span className="text-muted-foreground">Not earned</span>
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {achievement.tier}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubhouseAchievementsTray;