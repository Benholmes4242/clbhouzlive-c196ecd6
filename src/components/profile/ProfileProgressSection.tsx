import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, MapPin, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import CircularProgress from '@/components/ui/circular-progress';

interface ProfileProgressSectionProps {
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
  recentTrophies?: Array<{
    id: string;
    name: string;
    emoji: string;
    isUnlocked: boolean;
    requiredCourses: number;
  }>;
  achievements?: Array<{
    id: string;
    type: string;
    data: any;
    created_at: string;
  }>;
  isOwnProfile?: boolean;
  className?: string;
}

const ProfileProgressSection: React.FC<ProfileProgressSectionProps> = ({
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
  recentTrophies = [],
  achievements = [],
  isOwnProfile = false,
  className
}) => {
  const progressPercentage = (coursesPlayed / maxCourses) * 100;

  // Get the most recent/relevant trophies (up to 5)
  const displayTrophies = [
    {
      id: 'green-fee-rookie',
      name: 'The 20 Club',
      emoji: '🥉',
      isUnlocked: coursesPlayed >= 20,
      requiredCourses: 20,
    },
    {
      id: 'the-turn',
      name: 'The 50 Club',
      emoji: '🥈',
      isUnlocked: coursesPlayed >= 50,
      requiredCourses: 50,
    },
    {
      id: 'century-club',
      name: 'Century',
      emoji: '🥇',
      isUnlocked: coursesPlayed >= 100,
      requiredCourses: 100,
    },
    {
      id: 'clubhouse-elite',
      name: 'Elite',
      emoji: '🏆',
      isUnlocked: coursesPlayed >= 200,
      requiredCourses: 200,
    },
    {
      id: 'course-collector',
      name: 'Legend',
      emoji: '👑',
      isUnlocked: coursesPlayed >= 300,
      requiredCourses: 300,
    },
  ].slice(0, 5);

  const getRegionalProgress = (completed: number, total: number) => {
    return Math.min((completed / total) * 100, 100);
  };

  return (
    <>
      {/* Unified Layout - Same grid for both mobile and desktop */}
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            🏌️‍♂️ {isOwnProfile ? 'My' : 'Their'} Golf Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Courses Played</span>
              <span className="text-sm font-bold">{coursesPlayed} / {maxCourses}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>✨ {totalXP.toLocaleString()} XP</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          </div>

          {/* Trophy Strip */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Trophies
            </h4>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {displayTrophies.map((trophy) => (
                <div
                  key={trophy.id}
                  className={cn(
                    'flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-lg transition-colors',
                    trophy.isUnlocked 
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                      : 'bg-muted/50'
                  )}
                >
                  <span className={cn(
                    'text-2xl transition-all duration-200',
                    trophy.isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90 grayscale'
                  )}>
                    {trophy.emoji}
                  </span>
                  <span className={cn(
                    'text-xs font-medium text-center',
                    trophy.isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {trophy.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {trophy.requiredCourses}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Progress - 4 Mini Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Regional Lists
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Great Britain & Ireland */}
              <div className="text-center p-3 bg-background border border-border rounded-lg shadow-sm">
                <div className="mb-2">
                  <CircularProgress 
                    completed={britainIrelandCompleted}
                    total={britainIrelandTotal} 
                    size={40} 
                    strokeWidth={4}
                    className="mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-foreground">🇬🇧 GB&I</div>
                  <div className="text-xs text-muted-foreground">
                    {britainIrelandCompleted}/{britainIrelandTotal}
                  </div>
                </div>
              </div>

              {/* Continental Europe */}
              <div className="text-center p-3 bg-background border border-border rounded-lg shadow-sm">
                <div className="mb-2">
                  <CircularProgress 
                    completed={europeCompleted}
                    total={europeTotal} 
                    size={40} 
                    strokeWidth={4}
                    className="mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-foreground">🇪🇺 Europe</div>
                  <div className="text-xs text-muted-foreground">
                    {europeCompleted}/{europeTotal}
                  </div>
                </div>
              </div>

              {/* USA */}
              <div className="text-center p-3 bg-background border border-border rounded-lg shadow-sm">
                <div className="mb-2">
                  <CircularProgress 
                    completed={usaCompleted}
                    total={usaTotal} 
                    size={40} 
                    strokeWidth={4}
                    className="mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-foreground">🇺🇸 USA</div>
                  <div className="text-xs text-muted-foreground">
                    {usaCompleted}/{usaTotal}
                  </div>
                </div>
              </div>

              {/* Worldwide */}
              <div className="text-center p-3 bg-background border border-border rounded-lg shadow-sm">
                <div className="mb-2">
                  <CircularProgress 
                    completed={worldwideCompleted}
                    total={worldwideTotal} 
                    size={40} 
                    strokeWidth={4}
                    className="mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-foreground">🌍 World</div>
                  <div className="text-xs text-muted-foreground">
                    {worldwideCompleted}/{worldwideTotal}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ProfileProgressSection;