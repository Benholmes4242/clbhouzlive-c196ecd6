import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Lock, CheckCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';

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
    requiredCourses: 20,
    xp: 2200,
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
    name: 'Century Club',
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
  const [showXPFloat, setShowXPFloat] = useState(false);
  const [prevCompletedCount, setPrevCompletedCount] = useState(completedCount);

  // Trigger XP animation when completedCount increases
  useEffect(() => {
    if (completedCount > prevCompletedCount) {
      setShowXPFloat(true);
      const timer = setTimeout(() => setShowXPFloat(false), 2000);
      setPrevCompletedCount(completedCount);
      return () => clearTimeout(timer);
    }
  }, [completedCount, prevCompletedCount]);
  
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
  const lastUnlockedTrophy = unlockedGlobalTrophies[unlockedGlobalTrophies.length - 1];

  return (
    <Tooltip.Provider>
      <div className={cn('space-y-6', className)}>
        {/* Liquid Glass Container */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          
          {/* Floating XP Animation */}
          {showXPFloat && (
            <div className="absolute top-4 right-4 z-20 animate-fade-in">
              <div 
                className="flex items-center gap-1 bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-1 text-green-400 font-medium"
                style={{
                  animation: 'slideUp 2s ease-out forwards'
                }}
              >
                <Plus className="w-4 h-4" />
                <span>110 XP</span>
              </div>
            </div>
          )}
          
          <div className="relative p-6 space-y-6">
            {/* Header with XP Counter */}
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-white">
                Golf Journey Progress
              </h4>
              <div className="text-lg font-bold text-white transition-all duration-500">
                Total XP: {currentXP.toLocaleString()}
              </div>
            </div>

          {/* Global XP Progress Bar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-base">
              <span className="text-white/80">Global Milestones</span>
              <span className="text-white/60">{completedCount} courses played</span>
            </div>
            
            {/* Trophy Timeline */}
            <div className="relative">
              {/* Progress Line */}
               <div className="absolute top-4 left-8 right-4 h-2 bg-white/20 rounded-full overflow-hidden">
                 {nextGlobalTrophy && lastUnlockedTrophy && (
                   <div 
                     className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                     style={{ 
                       width: `${((completedCount - lastUnlockedTrophy.requiredCourses) / (nextGlobalTrophy.requiredCourses - lastUnlockedTrophy.requiredCourses)) * 100}%`
                     }}
                   />
                 )}
                 {nextGlobalTrophy && !lastUnlockedTrophy && completedCount < 20 && (
                   <div 
                     className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                     style={{ 
                       width: `${(completedCount / nextGlobalTrophy.requiredCourses) * 20}%`
                     }}
                   />
                 )}
               </div>
              
               {/* Trophy Points */}
                <div className="flex justify-between items-start relative z-10">
                 {globalTrophies.map((trophy, index) => (
                   <Tooltip.Root key={trophy.id}>
                     <Tooltip.Trigger asChild>
                       <div className="flex flex-col items-center space-y-2 cursor-help hover:scale-110 transition-transform duration-200">
                         {trophy.id === 'green-fee-rookie' ? (
                           <img 
                             src="/lovable-uploads/f2f50b99-38e1-466b-8ac8-c32e428231cb.png" 
                             alt="Green Fee Rookie Trophy" 
                             className={cn(
                               'h-16 w-auto object-contain -mt-4 transition-all duration-300',
                               trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'
                             )}
                           />
                         ) : trophy.id === 'the-turn' ? (
                           <img 
                             src="/lovable-uploads/43291ca4-d526-4b10-9585-6ea3488445cf.png" 
                             alt="The Turn Trophy"
                             className={cn(
                               'h-16 w-auto object-contain -mt-4 transition-all duration-300',
                               trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'
                             )}
                           />
                         ) : trophy.id === 'century-club' ? (
                           <img 
                             src="/lovable-uploads/0c126dc7-5509-40b9-862d-b054423ca7f6.png" 
                             alt="Century Club Trophy" 
                             className={cn(
                               'h-12 w-auto object-contain -mt-4 transition-all duration-300',
                               trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'
                             )}
                           />
                         ) : trophy.id === 'clubhouse-elite' ? (
                           <img 
                             src="/lovable-uploads/a9672498-b79d-4a47-9e6a-1128770700c9.png" 
                             alt="Clubhouse Elite Trophy" 
                             className={cn(
                               'h-12 w-auto object-contain -mt-4 transition-all duration-300',
                               trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'
                             )}
                           />
                           ) : trophy.id === 'course-collector' ? (
                             <img 
                               src="/lovable-uploads/3c517cb5-203d-4ad8-b3b5-e5e7c33a24b0.png" 
                               alt="Course Collector Trophy" 
                               className={cn(
                                 'h-12 w-auto object-contain -mt-4 transition-all duration-300',
                                 trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'
                               )}
                             />
                          ) : (
                            <div className={cn(
                              'h-16 w-16 rounded-full flex items-center justify-center bg-gradient-to-br -mt-4 transition-all duration-300',
                              trophy.color,
                              trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'
                            )}>
                              <Trophy className="w-8 h-8 text-white" />
                            </div>
                          )}
                         <div className="text-center">
                           <div className="text-sm font-medium text-white/90">
                             {trophy.requiredCourses}
                           </div>
                           <div className="text-sm text-white/60 max-w-16 leading-tight">
                             {trophy.name}
                           </div>
                         </div>
                       </div>
                     </Tooltip.Trigger>
                     <Tooltip.Portal>
                       <Tooltip.Content 
                         className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg border border-white/10 backdrop-blur-sm z-50"
                         sideOffset={5}
                       >
                         {trophy.isUnlocked ? (
                           `🏆 Unlocked! You've achieved ${trophy.name}`
                         ) : (
                           `Unlock ${trophy.name} by playing ${trophy.requiredCourses} courses`
                         )}
                         <Tooltip.Arrow className="fill-gray-900" />
                       </Tooltip.Content>
                     </Tooltip.Portal>
                   </Tooltip.Root>
                  ))}
                </div>
            </div>

            {/* Next Milestone */}
            {nextGlobalTrophy && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                <p className="text-base text-white/80">
                  <span className="font-medium">{nextGlobalTrophy.requiredCourses - completedCount} more courses</span> 
                  {' '}to unlock <span className="font-medium text-white">{nextGlobalTrophy.name}</span>
                </p>
              </div>
            )}
          </div>

          {/* Regional Lists Completion */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base text-white/80">Regional List Completion</span>
              <span className="text-base text-white/60">
                {regionalProgress.completedLists}/4 lists completed
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {regionalProgress.lists.map((list) => (
                <div
                  key={list.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all h-24',
                    list.isCompleted
                      ? 'bg-green-500/20 border-green-400/30'
                      : 'bg-white/5 border-white/10'
                  )}
                >
                  {list.id === 'britain-ireland' ? (
                    // Special layout for GB&I with trophy
                    <div className="flex items-center gap-3 h-full">
                      <img 
                        src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                        alt="British & Irish Trophy" 
                        className="h-16 w-auto object-contain flex-shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-medium text-white/90">
                            Great Britain & Ireland
                          </span>
                          {list.isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-base text-white/70">
                            {list.completed}/{list.total}
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full transition-all duration-300 bg-green-400"
                              style={{ 
                                width: `${Math.min((list.completed / list.total) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : list.id === 'europe' ? (
                    // Special layout for Europe with trophy
                    <div className="flex items-center gap-3 h-full">
                      <img 
                        src="/lovable-uploads/fa5756cb-1a89-478b-b8ad-8d26168c1f4f.png" 
                        alt="European Trophy" 
                        className="h-16 w-auto object-contain flex-shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-medium text-white/90">
                            Europe
                          </span>
                          {list.isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-base text-white/70">
                            {list.completed}/{list.total}
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full transition-all duration-300 bg-green-400"
                              style={{ 
                                width: `${Math.min((list.completed / list.total) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : list.id === 'usa' ? (
                    // Special layout for USA with trophy
                    <div className="flex items-center gap-3 h-full">
                      <img 
                        src="/lovable-uploads/7ae756b6-b8e6-4d03-a6ee-f8c336eec047.png" 
                        alt="USA Trophy" 
                        className="h-16 w-auto object-contain flex-shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-medium text-white/90">
                            USA
                          </span>
                          {list.isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-base text-white/70">
                            {list.completed}/{list.total}
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full transition-all duration-300 bg-green-400"
                              style={{ 
                                width: `${Math.min((list.completed / list.total) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : list.id === 'worldwide' ? (
                    // Special layout for Worldwide with trophy
                    <div className="flex items-center gap-3 h-full">
                      <img 
                        src="/lovable-uploads/ab0f852c-4e2f-408d-a13c-ef3a595470e8.png" 
                        alt="Worldwide Trophy" 
                        className="h-16 w-auto object-contain flex-shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-medium text-white/90">
                            World
                          </span>
                          {list.isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-base text-white/70">
                            {list.completed}/{list.total}
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full transition-all duration-300 bg-green-400"
                              style={{ 
                                width: `${Math.min((list.completed / list.total) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Standard layout for other regions
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-medium text-white/90">
                          {list.shortName}
                        </span>
                        {list.isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-base text-white/70">
                          {list.completed}/{list.total}
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-300 bg-green-400"
                            style={{ 
                              width: `${Math.min((list.completed / list.total) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* World Conqueror Achievement */}
            {regionalProgress.isWorldConqueror && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-4 text-center">
                <h5 className="font-bold text-white mb-1">🌍 World Conqueror!</h5>
                <p className="text-base text-white/80">
                  You've completed all regional lists. Truly legendary!
                </p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="flex items-center justify-center text-base pt-2 border-t border-white/10">
            <div className="text-white/60">
              Global Trophies: {unlockedGlobalTrophies.length}/{globalTrophies.length}
            </div>
          </div>
        </div>
      </div>
      </div>
    </Tooltip.Provider>
  );
};

export default GamificationProgressBar;