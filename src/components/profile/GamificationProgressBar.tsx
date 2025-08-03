import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Lock } from 'lucide-react';
import { useUserAchievements } from '@/hooks/useUserAchievements';

interface GamificationProgressBarProps {
  userId: string;
  isOwnProfile: boolean;
}

const GamificationProgressBar: React.FC<GamificationProgressBarProps> = ({
  userId,
  isOwnProfile
}) => {
  const { data: achievements } = useUserAchievements(userId);
  
  const totalPlayed = achievements?.totalPlayed || 0;
  const currentXP = totalPlayed * 110;

  // Global XP-Based Trophies
  const globalTrophies = [
    { 
      id: 'rookie', 
      name: 'The Green Fee Rookie', 
      xp: 1100, 
      courses: 10, 
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700'
    },
    { 
      id: 'turn', 
      name: 'The Turn', 
      xp: 5500, 
      courses: 50, 
      color: 'from-gray-300 to-gray-500',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700'
    },
    { 
      id: 'century', 
      name: 'The Century Club', 
      xp: 11000, 
      courses: 100, 
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700'
    },
    { 
      id: 'elite', 
      name: 'Clubhouse Elite', 
      xp: 22000, 
      courses: 200, 
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700'
    },
    { 
      id: 'collector', 
      name: 'Course Collector', 
      xp: 33000, 
      courses: 300, 
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700'
    }
  ];

  // Regional Progress
  const regionalLists = [
    { 
      id: 'gbi', 
      name: 'Great Britain & Ireland', 
      progress: achievements?.linksLegend || 0, 
      total: 100,
      color: 'from-red-400 to-red-600'
    },
    { 
      id: 'europe', 
      name: 'Continental Europe', 
      progress: achievements?.continentalSwinger || 0, 
      total: 100,
      color: 'from-blue-400 to-blue-600'
    },
    { 
      id: 'usa', 
      name: 'USA', 
      progress: achievements?.starsStripes || 0, 
      total: 100,
      color: 'from-red-500 to-blue-500'
    },
    { 
      id: 'worldwide', 
      name: 'Worldwide Top 100', 
      progress: totalPlayed, 
      total: 100,
      color: 'from-yellow-400 to-yellow-600'
    }
  ];

  const findCurrentLevel = () => {
    for (let i = 0; i < globalTrophies.length; i++) {
      if (currentXP < globalTrophies[i].xp) {
        return i;
      }
    }
    return globalTrophies.length - 1;
  };

  const currentLevel = findCurrentLevel();
  const nextTrophy = globalTrophies[currentLevel];
  const previousTrophy = currentLevel > 0 ? globalTrophies[currentLevel - 1] : null;
  
  const progressToNext = nextTrophy ? 
    ((currentXP - (previousTrophy?.xp || 0)) / (nextTrophy.xp - (previousTrophy?.xp || 0))) * 100 : 100;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-lg">Progress Journey</h3>
          <div className="ml-auto text-sm text-muted-foreground">
            {currentXP.toLocaleString()} XP
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Global Progress</span>
            <span className="text-sm text-muted-foreground">
              {totalPlayed} / {nextTrophy?.courses || 300} courses
            </span>
          </div>
          
          {/* Trophy Progress Line */}
          <div className="relative mb-4">
            <div className="h-2 bg-muted rounded-full">
              <div 
                className="h-2 bg-gradient-to-r from-primary to-primary-foreground rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
            
            {/* Trophy Icons */}
            <div className="flex justify-between mt-3">
              {globalTrophies.map((trophy, index) => {
                const isUnlocked = currentXP >= trophy.xp;
                const isCurrent = index === currentLevel && currentXP < trophy.xp;
                
                return (
                  <div key={trophy.id} className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${
                      isUnlocked ? trophy.bgColor : 'bg-gray-100'
                    } mb-1 transition-all duration-300`}>
                      {isUnlocked ? (
                        <Trophy className={`h-4 w-4 ${trophy.textColor}`} />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className={`text-xs text-center max-w-[60px] ${
                      isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'
                    }`}>
                      {trophy.courses}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Next Trophy Info */}
          {nextTrophy && currentXP < nextTrophy.xp && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">{nextTrophy.name}</p>
              <p className="text-xs text-muted-foreground">
                {nextTrophy.courses - totalPlayed} more courses to unlock
              </p>
            </div>
          )}
        </div>

        {/* Regional Completion */}
        <div>
          <h4 className="font-medium text-sm mb-3">Regional Lists</h4>
          <div className="grid grid-cols-2 gap-3">
            {regionalLists.map((list) => {
              const completionRate = (list.progress / list.total) * 100;
              const isCompleted = list.progress >= list.total;
              
              return (
                <div key={list.id} className="p-3 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${
                        isCompleted ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {isCompleted ? (
                          <Trophy className="h-3 w-3 text-green-600" />
                        ) : (
                          <Lock className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs font-medium">{list.name}</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                    <div 
                      className={`h-1.5 bg-gradient-to-r ${list.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {list.progress} / {list.total}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* World Conqueror Trophy */}
          <div className="mt-4 p-3 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50/50">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">
                World Conqueror Trophy
              </span>
            </div>
            <p className="text-xs text-yellow-600 text-center mt-1">
              Complete all four regional lists to unlock
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamificationProgressBar;