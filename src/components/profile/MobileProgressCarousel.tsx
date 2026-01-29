import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import SwipeableCarousel from '@/components/ui/SwipeableCarousel';
import CircularProgress from '@/components/ui/circular-progress';
import { Button } from '@/components/ui/button';

interface MobileProgressCarouselProps {
  coursesPlayed: number;
  totalXP: number;
  maxCourses?: number;
  britainIrelandCompleted?: number;
  britainIrelandTotal?: number;
  europeCompleted?: number;
  europeTotal?: number;
  usaCompleted?: number;
  usaTotal?: number;
  worldwideCompleted?: number;
  worldwideTotal?: number;
  achievements?: Array<{
    id: string;
    type: string;
    data: any;
    created_at: string;
  }>;
  className?: string;
}

const MobileProgressCarousel: React.FC<MobileProgressCarouselProps> = ({
  coursesPlayed,
  totalXP,
  maxCourses = 300,
  britainIrelandCompleted = 0,
  britainIrelandTotal = 20,
  europeCompleted = 0,
  europeTotal = 100,
  usaCompleted = 0,
  usaTotal = 100,
  worldwideCompleted = 0,
  worldwideTotal = 100,
  achievements = [],
  className
}) => {
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);

  // XP Progress Segments (0-100, 100-200, 200-300)
  const xpSegments = [
    { min: 0, max: 100, label: "Starter", emoji: "⭐", color: "from-gray-400 to-gray-600" },
    { min: 100, max: 200, label: "Climber", emoji: "🏔️", color: "from-blue-400 to-blue-600" },
    { min: 200, max: 300, label: "Legend", emoji: "👑", color: "from-purple-400 to-purple-600" }
  ];

  const getCurrentSegment = () => {
    return xpSegments.findIndex(segment => 
      coursesPlayed >= segment.min && coursesPlayed < segment.max
    );
  };

  const currentSegmentIndex = getCurrentSegment();
  const currentSegment = xpSegments[currentSegmentIndex] || xpSegments[xpSegments.length - 1];
  
  // Progress within current segment
  const segmentProgress = coursesPlayed >= 300 
    ? 100 
    : ((coursesPlayed - currentSegment.min) / (currentSegment.max - currentSegment.min)) * 100;

  // Regional cards data
  const regionalCards = [
    {
      id: 'britain-ireland',
      name: 'Great Britain & Ireland',
      flag: '🇬🇧',
      completed: britainIrelandCompleted,
      total: britainIrelandTotal,
      color: 'from-red-500 to-blue-600'
    },
    {
      id: 'europe',
      name: 'Continental Europe',
      flag: '🇪🇺',
      completed: europeCompleted,
      total: europeTotal,
      color: 'from-blue-500 to-yellow-500'
    },
    {
      id: 'usa',
      name: 'United States',
      flag: '🇺🇸',
      completed: usaCompleted,
      total: usaTotal,
      color: 'from-red-500 to-blue-700'
    },
    {
      id: 'worldwide',
      name: 'Global',
      flag: '🌍',
      completed: worldwideCompleted,
      total: worldwideTotal,
      color: 'from-green-500 to-blue-500'
    }
  ];

  // Format achievement data for display
  const formatAchievement = (achievement: any) => {
    const { type, data } = achievement;
    
    switch (type) {
      case 'course_played':
        return {
          emoji: '🎯',
          message: `Played ${data.course_name}`,
          xp: data.xp_gained || 110,
          timestamp: achievement.created_at
        };
      case 'trophy_unlock':
        return {
          emoji: data.trophy_emoji || '🏆',
          message: `Unlocked ${data.trophy_name}`,
          xp: 0,
          timestamp: achievement.created_at
        };
      case 'badge_earned':
        return {
          emoji: data.badge_emoji || '🏅',
          message: `Earned ${data.badge_name}`,
          xp: 0,
          timestamp: achievement.created_at
        };
      default:
        return {
          emoji: '✨',
          message: 'Achievement unlocked',
          xp: 0,
          timestamp: achievement.created_at
        };
    }
  };

  const displayedAchievements = achievementsExpanded ? achievements : achievements.slice(0, 2);

  return (
    <div className={cn('space-y-6', className)}>
      {/* XP Progress Carousel */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Journey Progress</h3>
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <SwipeableCarousel
              itemWidth="90%"
              gap="12px"
              showDots={true}
              className="mb-4"
            >
              {xpSegments.map((segment, index) => {
                const isActive = index === currentSegmentIndex;
                const isCompleted = coursesPlayed >= segment.max;
                const segmentCourses = isActive ? coursesPlayed - segment.min : isCompleted ? segment.max - segment.min : 0;
                const segmentPercent = (segmentCourses / (segment.max - segment.min)) * 100;
                
                return (
                  <Card key={segment.label} className={cn(
                    'border-2 transition-all duration-300',
                    isActive ? 'border-primary shadow-lg scale-105' : 'border-muted',
                    isCompleted && 'border-green-500'
                  )}>
                    <CardContent className="p-4 text-center">
                      <div className={cn(
                        'text-3xl mb-2 bg-gradient-to-r bg-clip-text text-transparent',
                        segment.color
                      )}>
                        {segment.emoji}
                      </div>
                      <h4 className="font-semibold mb-2">{segment.label}</h4>
                      <div className="text-sm text-muted-foreground mb-3">
                        {segment.min} - {segment.max} courses
                      </div>
                      <Progress 
                        value={segmentPercent} 
                        className="mb-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        {segmentCourses}/{segment.max - segment.min}
                        {isActive && ` (${Math.round(segmentPercent)}%)`}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </SwipeableCarousel>
            
            {/* Overall Progress Summary */}
            <div className="text-center">
              <div className="text-2xl font-bold">{coursesPlayed}/{maxCourses}</div>
              <div className="text-sm text-muted-foreground">Total Courses • {totalXP.toLocaleString()} XP</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Progress Carousel - Fitted for mobile viewport */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Regional Lists</h3>
        
        {/* Mobile: All 4 rings in one row with smaller gaps */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
          {regionalCards.map((region) => {
            const progress = region.total > 0 ? (region.completed / region.total) * 100 : 0;
            
            return (
              <div key={region.id} className="flex-shrink-0 w-20 text-center">
                <div className="space-y-2">
                  <div className="text-lg">{region.flag}</div>
                  <CircularProgress 
                    completed={region.completed}
                    total={region.total}
                    size={60}
                    strokeWidth={4}
                    className="mx-auto"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold">{region.completed}/{region.total}</div>
                    <div className="text-xs text-muted-foreground leading-tight">
                      {region.name.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Feed */}
      {achievements.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Achievements</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAchievementsExpanded(!achievementsExpanded)}
              className="gap-2"
            >
              {achievementsExpanded ? (
                <>
                  Collapse <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  View All <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
          
          <div className={cn(
            'space-y-3 overflow-y-auto transition-all duration-300',
            achievementsExpanded ? 'max-h-96' : 'max-h-32'
          )}>
            {displayedAchievements.map((achievement, index) => {
              const formatted = formatAchievement(achievement);
              
              return (
                <Card key={`${achievement.id}-${index}`} className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{formatted.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{formatted.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(formatted.timestamp).toLocaleDateString()}</span>
                          {formatted.xp > 0 && (
                            <span className="text-green-600">+{formatted.xp} XP</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileProgressCarousel;