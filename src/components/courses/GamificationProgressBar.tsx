import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Lock, CheckCircle, Plus, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import CircularProgress from '@/components/ui/circular-progress';
import { CourseListModal } from './CourseListModal';

interface GamificationProgressBarProps {
  completedCount: number;
  className?: string;
  userFirstName?: string; // For displaying other users' progress
  isCurrentUser?: boolean; // To determine if showing current user or another user
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
  userFirstName,
  isCurrentUser = true,
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
  const [selectedTrophy, setSelectedTrophy] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseList, setSelectedCourseList] = useState<any>(null);
  const [isCourseListModalOpen, setIsCourseListModalOpen] = useState(false);

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
              {isCurrentUser 
                ? `You've played ${completedCount} of 300 top 100 courses`
                : `${userFirstName || 'User'} has played ${completedCount} of 300 top 100 courses`
              }
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
                   <div 
                     key={trophy.id} 
                     className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-110 transition-transform duration-200"
                     onClick={() => {
                       setSelectedTrophy({
                         ...trophy,
                         type: 'global',
                         dateEarned: trophy.isUnlocked ? 'July 2025' : null,
                         description: `Complete ${trophy.requiredCourses} courses to earn ${trophy.xp.toLocaleString()} XP`
                       });
                       setIsModalOpen(true);
                     }}
                   >
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
                           'h-16 w-auto object-contain -mt-4 transition-all duration-300',
                           trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'
                         )}
                       />
                     ) : trophy.id === 'clubhouse-elite' ? (
                       <img 
                         src="/lovable-uploads/a9672498-b79d-4a47-9e6a-1128770700c9.png" 
                         alt="Clubhouse Elite Trophy" 
                         className={cn(
                           'h-16 w-auto object-contain -mt-4 transition-all duration-300',
                           trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'
                         )}
                       />
                     ) : trophy.id === 'course-collector' ? (
                       <img 
                         src="/lovable-uploads/3c517cb5-203d-4ad8-b3b5-e5e7c33a24b0.png" 
                         alt="Course Collector Trophy" 
                         className={cn(
                           'h-16 w-auto object-contain -mt-4 transition-all duration-300',
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
                       <div className="text-sm font-medium text-white">
                         {trophy.id === 'course-collector' ? '' : trophy.requiredCourses}
                       </div>
                       <div className="text-sm text-white max-w-16 leading-tight">
                         {trophy.name}
                       </div>
                     </div>
                   </div>
                  ))}
                </div>
            </div>

          </div>

          {/* Regional Lists Completion - Circular Progress Rings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base text-white">Regional List Completion</span>
              <span className="text-base text-white">
                {regionalProgress.completedLists}/4 lists completed
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {regionalProgress.lists.map((list) => (
                <div
                  key={list.id}
                  className="flex flex-col items-center p-4 rounded-lg border transition-all cursor-pointer hover:scale-105 bg-white/5 border-white/10 hover:bg-white/10"
                  onClick={() => {
                    setSelectedCourseList(list);
                    setIsCourseListModalOpen(true);
                  }}
                >
                  {/* Top Row: Trophy Left, Progress Ring Right */}
                  <div className="flex items-center justify-between w-full mb-3">
                    {/* Trophy Icon - Left Side */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        {list.id === 'britain-ireland' ? (
                          <img 
                            src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                            alt="British & Irish Trophy" 
                            className={cn(
                              'h-16 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100' : 'opacity-60 grayscale'
                            )}
                          />
                        ) : list.id === 'europe' ? (
                          <img 
                            src="/lovable-uploads/fa5756cb-1a89-478b-b8ad-8d26168c1f4f.png" 
                            alt="European Trophy" 
                            className={cn(
                              'h-16 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100' : 'opacity-60 grayscale'
                            )}
                          />
                        ) : list.id === 'usa' ? (
                          <img 
                            src="/lovable-uploads/7ae756b6-b8e6-4d03-a6ee-f8c336eec047.png" 
                            alt="USA Trophy" 
                            className={cn(
                              'h-16 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100' : 'opacity-60 grayscale'
                            )}
                          />
                        ) : list.id === 'worldwide' ? (
                          <img 
                            src="/lovable-uploads/ab0f852c-4e2f-408d-a13c-ef3a595470e8.png" 
                            alt="Worldwide Trophy" 
                            className={cn(
                              'h-16 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100' : 'opacity-60 grayscale'
                            )}
                          />
                        ) : null}
                      </div>
                    </div>
                    
                    {/* Circular Progress Ring - Right Side */}
                    <div className="flex-shrink-0">
                      <CircularProgress
                        completed={list.completed}
                        total={list.total}
                        size={80}
                        strokeWidth={6}
                        showAnimation={true}
                      />
                    </div>
                  </div>
                  
                  {/* Region Name */}
                  <h4 className="text-base font-semibold text-white text-center mb-1">
                    {list.name}
                  </h4>
                  
                  {/* Subtle Tag with Course Count and XP */}
                  <div className="flex items-center gap-2 text-sm text-white">
                    <span>Courses Played: {list.completed}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span>XP: {(list.completed * 110).toLocaleString()}</span>
                    </div>
                  </div>
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

        {/* Trophy Cabinet Section */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10" />
          <div className="relative p-6 space-y-6">
            <h4 className="text-xl font-semibold text-white">🏆 Trophy Cabinet</h4>
            
            {/* Global Trophies Row */}
            <div className="space-y-4">
              <h5 className="text-lg font-medium text-white/90">Global Milestones</h5>
              <div className="grid grid-cols-5 gap-4">
                {globalTrophies.map((trophy) => (
                  <div
                    key={trophy.id}
                    className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-105 transition-all duration-200"
                    onClick={() => {
                      setSelectedTrophy({
                        ...trophy,
                        type: 'global',
                        dateEarned: trophy.isUnlocked ? 'July 2025' : null,
                        description: `Complete ${trophy.requiredCourses} courses to earn ${trophy.xp.toLocaleString()} XP`
                      });
                      setIsModalOpen(true);
                    }}
                  >
                    <div className={cn(
                      'relative p-2 rounded-lg border transition-all',
                      trophy.isUnlocked 
                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-400/30' 
                        : 'bg-white/5 border-white/10'
                    )}>
                      {trophy.id === 'green-fee-rookie' ? (
                        <img 
                          src="/lovable-uploads/f2f50b99-38e1-466b-8ac8-c32e428231cb.png" 
                          alt="Green Fee Rookie Trophy" 
                          className={cn(
                            'h-12 w-auto object-contain transition-all duration-300',
                            trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                          )}
                        />
                      ) : trophy.id === 'the-turn' ? (
                        <div className="relative">
                          <img 
                            src="/lovable-uploads/43291ca4-d526-4b10-9585-6ea3488445cf.png" 
                            alt="The Turn Trophy"
                            className={cn(
                              'h-12 w-auto object-contain transition-all duration-300',
                              trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                            )}
                          />
                          {!trophy.isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-white/60" />
                            </div>
                          )}
                        </div>
                      ) : trophy.id === 'century-club' ? (
                        <div className="relative">
                          <img 
                            src="/lovable-uploads/0c126dc7-5509-40b9-862d-b054423ca7f6.png" 
                            alt="Century Club Trophy" 
                            className={cn(
                              'h-12 w-auto object-contain transition-all duration-300',
                              trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                            )}
                          />
                          {!trophy.isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-white/60" />
                            </div>
                          )}
                        </div>
                      ) : trophy.id === 'clubhouse-elite' ? (
                        <div className="relative">
                          <img 
                            src="/lovable-uploads/a9672498-b79d-4a47-9e6a-1128770700c9.png" 
                            alt="Clubhouse Elite Trophy" 
                            className={cn(
                              'h-12 w-auto object-contain transition-all duration-300',
                              trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                            )}
                          />
                          {!trophy.isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-white/60" />
                            </div>
                          )}
                        </div>
                      ) : trophy.id === 'course-collector' ? (
                        <div className="relative">
                          <img 
                            src="/lovable-uploads/3c517cb5-203d-4ad8-b3b5-e5e7c33a24b0.png" 
                            alt="Course Collector Trophy" 
                            className={cn(
                              'h-12 w-auto object-contain transition-all duration-300',
                              trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                            )}
                          />
                          {!trophy.isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-white/60" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <div className={cn(
                            'h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-300',
                            trophy.color,
                            trophy.isUnlocked ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                          )}>
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                          {!trophy.isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-white/60" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-white/90">{trophy.name}</div>
                      <div className="text-xs text-white/60">{trophy.requiredCourses} courses</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Trophies Row */}
            <div className="space-y-4">
              <h5 className="text-lg font-medium text-white/90">Regional Lists</h5>
              <div className="grid grid-cols-4 gap-4">
                {regionalProgress.lists.map((list) => (
                  <div
                    key={list.id}
                    className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-105 transition-all duration-200"
                    onClick={() => {
                      setSelectedTrophy({
                        ...list,
                        type: 'regional',
                        dateEarned: list.isCompleted ? 'July 2025' : null,
                        description: `Complete all courses in the ${list.name} list`,
                        requiredCourses: list.total
                      });
                      setIsModalOpen(true);
                    }}
                  >
                    <div className={cn(
                      'relative p-2 rounded-lg border transition-all',
                      list.isCompleted 
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30' 
                        : 'bg-white/5 border-white/10'
                    )}>
                      <div className="relative">
                        {list.id === 'britain-ireland' ? (
                          <img 
                            src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                            alt="British & Irish Trophy" 
                            className={cn(
                              'h-12 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                            )}
                          />
                        ) : list.id === 'europe' ? (
                          <img 
                            src="/lovable-uploads/fa5756cb-1a89-478b-b8ad-8d26168c1f4f.png" 
                            alt="European Trophy" 
                            className={cn(
                              'h-12 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                            )}
                          />
                        ) : list.id === 'usa' ? (
                          <img 
                            src="/lovable-uploads/7ae756b6-b8e6-4d03-a6ee-f8c336eec047.png" 
                            alt="USA Trophy" 
                            className={cn(
                              'h-12 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                            )}
                          />
                        ) : list.id === 'worldwide' ? (
                          <img 
                            src="/lovable-uploads/ab0f852c-4e2f-408d-a13c-ef3a595470e8.png" 
                            alt="Worldwide Trophy" 
                            className={cn(
                              'h-12 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100' : 'opacity-40 grayscale blur-sm'
                            )}
                          />
                        ) : null}
                        {!list.isCompleted && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-white/60" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-white/90">{list.shortName}</div>
                      <div className="text-xs text-white/60">{list.completed}/{list.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trophy Detail Modal */}
        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 z-50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl" />
              {selectedTrophy && (
                <div className="relative space-y-4 z-10">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-3 rounded-lg border',
                      selectedTrophy.isUnlocked || selectedTrophy.isCompleted
                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-400/30'
                        : 'bg-white/5 border-white/10'
                    )}>
                      {selectedTrophy.type === 'global' ? (
                        selectedTrophy.id === 'green-fee-rookie' ? (
                          <img src="/lovable-uploads/f2f50b99-38e1-466b-8ac8-c32e428231cb.png" alt="Trophy" className="h-16 w-auto" />
                        ) : selectedTrophy.id === 'the-turn' ? (
                          <img src="/lovable-uploads/43291ca4-d526-4b10-9585-6ea3488445cf.png" alt="Trophy" className="h-16 w-auto" />
                        ) : selectedTrophy.id === 'century-club' ? (
                          <img src="/lovable-uploads/0c126dc7-5509-40b9-862d-b054423ca7f6.png" alt="Trophy" className="h-16 w-auto" />
                        ) : selectedTrophy.id === 'clubhouse-elite' ? (
                          <img src="/lovable-uploads/a9672498-b79d-4a47-9e6a-1128770700c9.png" alt="Trophy" className="h-16 w-auto" />
                        ) : selectedTrophy.id === 'course-collector' ? (
                          <img src="/lovable-uploads/3c517cb5-203d-4ad8-b3b5-e5e7c33a24b0.png" alt="Trophy" className="h-16 w-auto" />
                        ) : (
                          <div className={cn('h-16 w-16 rounded-full flex items-center justify-center bg-gradient-to-br', selectedTrophy.color)}>
                            <Trophy className="w-8 h-8 text-white" />
                          </div>
                        )
                      ) : (
                        selectedTrophy.id === 'britain-ireland' ? (
                          <img src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" alt="Trophy" className="h-16 w-auto" />
                        ) : selectedTrophy.id === 'europe' ? (
                          <img src="/lovable-uploads/fa5756cb-1a89-478b-b8ad-8d26168c1f4f.png" alt="Trophy" className="h-16 w-auto" />
                        ) : selectedTrophy.id === 'usa' ? (
                          <img src="/lovable-uploads/7ae756b6-b8e6-4d03-a6ee-f8c336eec047.png" alt="Trophy" className="h-16 w-auto" />
                        ) : selectedTrophy.id === 'worldwide' ? (
                          <img src="/lovable-uploads/ab0f852c-4e2f-408d-a13c-ef3a595470e8.png" alt="Trophy" className="h-16 w-auto" />
                        ) : null
                      )}
                    </div>
                    <div className="flex-1">
                      <Dialog.Title className="text-xl font-bold text-white mb-1">
                        {selectedTrophy.name}
                      </Dialog.Title>
                      <div className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        selectedTrophy.isUnlocked || selectedTrophy.isCompleted
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      )}>
                        {selectedTrophy.isUnlocked || selectedTrophy.isCompleted ? '🏆 Unlocked' : '🔒 Locked'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/80">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">{selectedTrophy.description}</span>
                    </div>
                    
                    {selectedTrophy.dateEarned && (
                      <div className="flex items-center gap-2 text-green-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Earned {selectedTrophy.dateEarned}</span>
                      </div>
                    )}
                    
                    {!selectedTrophy.isUnlocked && !selectedTrophy.isCompleted && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm text-white/70">
                          {selectedTrophy.type === 'global' 
                            ? `Play ${selectedTrophy.requiredCourses - completedCount} more courses to unlock this trophy`
                            : `Complete ${selectedTrophy.requiredCourses - (selectedTrophy.completed || 0)} more courses in ${selectedTrophy.name} to unlock this trophy`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
                  ✕
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Course List Modal */}
        {selectedCourseList && (
          <CourseListModal
            isOpen={isCourseListModalOpen}
            onClose={() => setIsCourseListModalOpen(false)}
            region={selectedCourseList}
          />
        )}
      </div>
    </Tooltip.Provider>
  );
};

export default GamificationProgressBar;