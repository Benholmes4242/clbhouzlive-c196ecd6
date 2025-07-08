import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Users, Star } from 'lucide-react';
import BadgeDisplay from './BadgeDisplay';
import Top100AchievementsList from './Top100AchievementsList';
import { useBadges } from '@/hooks/useBadges';
import { Badge as BadgeType } from '@/types/badges';

interface BadgeCarouselProps {
  userId: string;
  showOnlyEarned?: boolean;
}

const BadgeCarousel: React.FC<BadgeCarouselProps> = ({ 
  userId, 
  showOnlyEarned = false 
}) => {
  const { 
    badgeProgress, 
    isLoading, 
    getBadgesByCategory, 
    getEarnedBadges 
  } = useBadges(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Badges & Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 p-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-10 w-24 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadges = getEarnedBadges();
  const top100Badges = getBadgesByCategory('top_100_courses');
  const engagementBadges = getBadgesByCategory('engagement');

  // Filter specific badges for Activity tab
  const activityBadges = engagementBadges.filter(bp => 
    bp.badge.name === 'pro_tips_contributor' || 
    bp.badge.name === 'course_reviewer' || 
    bp.badge.name === 'active_rounder'
  );

  const displayBadges = showOnlyEarned ? earnedBadges : badgeProgress;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'top_100_courses': return <Target className="h-4 w-4" />;
      case 'engagement': return <Star className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Badges & Achievements
          {earnedBadges.length > 0 && (
            <span className="ml-auto text-sm text-muted-foreground">
              {earnedBadges.length} earned
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="engagement" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 h-12 rounded-xl">
            <TabsTrigger 
              value="engagement" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="top100" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <Target className="h-4 w-4 mr-2" />
              Top 100
            </TabsTrigger>
          </TabsList>

          <TabsContent value="engagement" className="mt-6">
            <div className="space-y-3">
              {activityBadges.length > 0 ? (
                activityBadges.map((badgeProgress) => (
                  <div key={badgeProgress.badge.id} className="w-full">
                    <BadgeDisplay
                      badge={badgeProgress.badge}
                      isEarned={badgeProgress.is_earned}
                      progress={badgeProgress.current_progress}
                      showProgress={!showOnlyEarned}
                      size="md"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-12 w-full">
                  <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No activity badges yet</p>
                  <p className="text-sm opacity-75 mt-1">Start engaging with the community to earn badges!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="top100" className="mt-6">
            <Top100AchievementsList 
              userId={userId}
              showAllInitially={showOnlyEarned}
            />
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BadgeCarousel;