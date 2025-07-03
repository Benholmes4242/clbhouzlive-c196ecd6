import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Users, Star } from 'lucide-react';
import BadgeDisplay from './BadgeDisplay';
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
  const communityBadges = getBadgesByCategory('community');

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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              All ({displayBadges.length})
            </TabsTrigger>
            <TabsTrigger value="top100" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Top 100
            </TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="community" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="w-full">
              <div className="flex space-x-3 pb-4">
                {displayBadges.length > 0 ? (
                  displayBadges.map((badgeProgress) => (
                    <div key={badgeProgress.badge.id} className="flex-shrink-0">
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
                  <div className="text-center text-muted-foreground py-8 w-full">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No badges earned yet</p>
                    <p className="text-sm">Start playing courses and engaging with the community!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="top100" className="mt-4">
            <ScrollArea className="w-full">
              <div className="flex space-x-3 pb-4">
                {top100Badges.map((badgeProgress) => (
                  <div key={badgeProgress.badge.id} className="flex-shrink-0">
                    <BadgeDisplay
                      badge={badgeProgress.badge}
                      isEarned={badgeProgress.is_earned}
                      progress={badgeProgress.current_progress}
                      showProgress={!showOnlyEarned}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="engagement" className="mt-4">
            <ScrollArea className="w-full">
              <div className="flex space-x-3 pb-4">
                {engagementBadges.map((badgeProgress) => (
                  <div key={badgeProgress.badge.id} className="flex-shrink-0">
                    <BadgeDisplay
                      badge={badgeProgress.badge}
                      isEarned={badgeProgress.is_earned}
                      progress={badgeProgress.current_progress}
                      showProgress={!showOnlyEarned}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="community" className="mt-4">
            <ScrollArea className="w-full">
              <div className="flex space-x-3 pb-4">
                {communityBadges.map((badgeProgress) => (
                  <div key={badgeProgress.badge.id} className="flex-shrink-0">
                    <BadgeDisplay
                      badge={badgeProgress.badge}
                      isEarned={badgeProgress.is_earned}
                      progress={badgeProgress.current_progress}
                      showProgress={!showOnlyEarned}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BadgeCarousel;