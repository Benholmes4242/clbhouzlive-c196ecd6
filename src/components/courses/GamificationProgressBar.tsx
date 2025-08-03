import React, { useMemo } from 'react';
import { Trophy, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GamificationProgressBarProps {
  completedCount: number;
  className?: string;
  // Regional completion data
  britainIrelandCompleted?: number;
  britainIrelandTotal?: number;
  europeCompleted?: number;
  europeTotal?: number;
  usaCompleted?: number;
  usaTotal?: number;
  worldwideCompleted?: number;
  worldwideTotal?: number;
}

// Global XP-Based Trophies
const GLOBAL_TROPHIES = [
  {
    id: 'green-fee-rookie',
    name: 'The Green Fee Rookie',
    requiredCourses: 10,
    xp: 1100,
    color: 'from-amber-500 to-yellow-600',
    tier: 'gold',
  },
  {
    id: 'the-turn',
    name: 'The Turn',
    requiredCourses: 50,
    xp: 5500,
    color: 'from-gray-400 to-slate-500',
    tier: 'silver',
  },
  {
    id: 'century-club',
    name: 'The Century Club',
    requiredCourses: 100,
    xp: 11000,
    color: 'from-blue-500 to-indigo-600',
    tier: 'blue',
  },
  {
    id: 'clubhouse-elite',
    name: 'Clubhouse Elite',
    requiredCourses: 200,
    xp: 22000,
    color: 'from-emerald-500 to-green-600',
    tier: 'green',
  },
  {
    id: 'course-collector',
    name: 'Course Collector',
    requiredCourses: 300,
    xp: 33000,
    color: 'from-purple-500 to-violet-600',
    tier: 'purple',
  },
];

// Regional List Completion
const REGIONAL_LISTS = [
  {
    id: 'britain-ireland',
    name: 'Great Britain & Ireland',
    shortName: 'GB&I',
  },
  {
    id: 'europe',
    name: 'Europe',
    shortName: 'EUR',
  },
  {
    id: 'usa',
    name: 'USA',
    shortName: 'USA',
  },
  {
    id: 'worldwide',
    name: 'Worldwide Top 100',
    shortName: 'World',
  },
];

const TrophyIcon: React.FC<{ 
  isUnlocked: boolean; 
  color: string; 
  size?: 'sm' | 'md' | 'lg' 
}> = ({ isUnlocked, color, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  if (isUnlocked) {
    return (
      <div className={cn(
        'rounded-full flex items-center justify-center bg-gradient-to-br',
        color,
        sizeClasses[size]
      )}>
        <Trophy className="w-4 h-4 text-white" />
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center bg-gray-600 border-2 border-gray-500',
      sizeClasses[size]
    )}>
      <Lock className="w-4 h-4 text-gray-400" />
    </div>
  );
};

const GamificationProgressBar: React.FC<GamificationProgressBarProps> = ({
  completedCount,
  className = '',
  britainIrelandCompleted = 0,
  britainIrelandTotal = 100,
  europeCompleted = 0,
  europeTotal = 100,
  usaCompleted = 0,
  usaTotal = 100,
  worldwideCompleted = 0,
  worldwideTotal = 100,
}) => {
  const currentXP = completedCount * 110;
  
  // Calculate global trophy progress
  const globalTrophies = useMemo(() => {
    return GLOBAL_TROPHIES.map(trophy => ({
      ...trophy,
      isUnlocked: completedCount >= trophy.requiredCourses,
      progress: Math.min((completedCount / trophy.requiredCourses) * 100, 100),
    }));
  }, [completedCount]);

  // Calculate regional list completion
  const regionalProgress = useMemo(() => {
    const lists = [
      {
        ...REGIONAL_LISTS[0],
        completed: britainIrelandCompleted,
        total: britainIrelandTotal,
        isCompleted: britainIrelandCompleted >= britainIrelandTotal,
      },
      {
        ...REGIONAL_LISTS[1],
        completed: europeCompleted,
        total: europeTotal,
        isCompleted: europeCompleted >= europeTotal,
      },
      {
        ...REGIONAL_LISTS[2],
        completed: usaCompleted,
        total: usaTotal,
        isCompleted: usaCompleted >= usaTotal,
      },
      {
        ...REGIONAL_LISTS[3],
        completed: worldwideCompleted,
        total: worldwideTotal,
        isCompleted: worldwideCompleted >= worldwideTotal,
      },
    ];

    const completedLists = lists.filter(list => list.isCompleted).length;
    const isWorldConqueror = completedLists === 4;

    return { lists, completedLists, isWorldConqueror };
  }, [
    britainIrelandCompleted, britainIrelandTotal,
    europeCompleted, europeTotal,
    usaCompleted, usaTotal,
    worldwideCompleted, worldwideTotal
  ]);

  const nextGlobalTrophy = globalTrophies.find(trophy => !trophy.isUnlocked);
  const unlockedGlobalTrophies = globalTrophies.filter(trophy => trophy.isUnlocked);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">
          Golf Journey Progress
        </h4>
        <div className="text-sm text-white/70">
          {currentXP.toLocaleString()} XP
        </div>
      </div>

      {/* Global XP Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">Global Milestones</span>
          <span className="text-white/60">{completedCount} courses played</span>
        </div>
        
        {/* Trophy Timeline */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-white/20 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ 
                width: nextGlobalTrophy 
                  ? `${(completedCount / nextGlobalTrophy.requiredCourses) * 100}%`
                  : '100%'
              }}
            />
          </div>
          
          {/* Trophy Points */}
          <div className="flex justify-between items-start relative z-10">
            {globalTrophies.map((trophy, index) => (
              <div key={trophy.id} className="flex flex-col items-center space-y-2">
                <TrophyIcon 
                  isUnlocked={trophy.isUnlocked}
                  color={trophy.color}
                  size="md"
                />
                <div className="text-center">
                  <div className="text-xs font-medium text-white/90">
                    {trophy.requiredCourses}
                  </div>
                  <div className="text-xs text-white/60 max-w-16 leading-tight">
                    {trophy.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Milestone */}
        {nextGlobalTrophy && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <p className="text-sm text-white/80">
              <span className="font-medium">{nextGlobalTrophy.requiredCourses - completedCount} more courses</span> 
              {' '}to unlock <span className="font-medium text-white">{nextGlobalTrophy.name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Regional Lists Completion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">Regional List Completion</span>
          <span className="text-sm text-white/60">
            {regionalProgress.completedLists}/4 lists completed
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {regionalProgress.lists.map((list) => (
            <div
              key={list.id}
              className={cn(
                'p-3 rounded-lg border transition-all',
                list.isCompleted
                  ? 'bg-green-500/20 border-green-400/30'
                  : 'bg-white/5 border-white/10'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {list.id === 'britain-ireland' && (
                    <img 
                      src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                      alt="British & Irish Trophy" 
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span className="text-xs font-medium text-white/90">
                    {list.shortName}
                  </span>
                </div>
                {list.isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-white/70">
                  {list.completed}/{list.total}
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div 
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      list.isCompleted 
                        ? 'bg-green-400' 
                        : 'bg-blue-400'
                    )}
                    style={{ 
                      width: `${Math.min((list.completed / list.total) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* World Conqueror Achievement */}
        {regionalProgress.isWorldConqueror && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-4 text-center">
            <h5 className="font-bold text-white mb-1">🌍 World Conqueror!</h5>
            <p className="text-sm text-white/80">
              You've completed all regional lists. Truly legendary!
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
        <div className="text-white/60">
          Global Trophies: {unlockedGlobalTrophies.length}/{globalTrophies.length}
        </div>
        <div className="text-white/60">
          Total XP: {currentXP.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default GamificationProgressBar;