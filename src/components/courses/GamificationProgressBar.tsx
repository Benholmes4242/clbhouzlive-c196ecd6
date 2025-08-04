import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Lock, CheckCircle, Plus, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import CircularProgress from '@/components/ui/circular-progress';
import { CourseListModal } from './CourseListModal';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import FriendsLeaderboard from './friends/FriendsLeaderboard';
import CompareWithFriendsModal from './friends/CompareWithFriendsModal';

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
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Fetch real user achievements
  const { achievements, loading: achievementsLoading } = useUserAchievements(5);
  
  // Fetch friends data for progress markers
  const { user } = useSupabaseSession();
  const { data: friends = [] } = useFriendsLeaderboard(user?.id);

  // Visual theme based on progress
  const getProgressTheme = (courses: number) => {
    if (courses >= 300) return 'aurora';
    if (courses >= 200) return 'mountain';
    if (courses >= 100) return 'twilight';
    if (courses >= 50) return 'golden';
    if (courses >= 10) return 'midday';
    return 'morning';
  };

  const currentTheme = getProgressTheme(completedCount);
  const [displayTheme, setDisplayTheme] = useState(currentTheme);
  const [showMilestoneTooltip, setShowMilestoneTooltip] = useState(false);

  // Handle theme transitions and milestone notifications
  useEffect(() => {
    if (currentTheme !== displayTheme) {
      // Show milestone notification
      setShowMilestoneTooltip(true);
      
      // Fade transition
      setTimeout(() => {
        setDisplayTheme(currentTheme);
      }, 250);

      // Hide tooltip after 3 seconds
      setTimeout(() => {
        setShowMilestoneTooltip(false);
      }, 3000);
    }
  }, [currentTheme, displayTheme]);

  const getThemeInfo = (theme: string) => {
    const themes = {
      morning: {
        name: 'Dawn Breaker',
        description: 'Your golf journey begins with the morning sun',
        emoji: '☀️'
      },
      midday: {
        name: 'Fairway Explorer',
        description: 'Making your mark under the midday sun',
        emoji: '🌤️'
      },
      golden: {
        name: 'Golden Hour',
        description: 'Reaching new heights in the golden light',
        emoji: '🌅'
      },
      twilight: {
        name: 'Twilight Master',
        description: 'Playing among the stars and twilight skies',
        emoji: '🌌'
      },
      mountain: {
        name: 'Peak Performer',
        description: 'Standing tall among the mountain ranges',
        emoji: '⛰️'
      },
      aurora: {
        name: 'Legend of the Links',
        description: 'You\'ve achieved the ultimate golfing aurora',
        emoji: '✨'
      }
    };
    return themes[theme as keyof typeof themes] || themes.morning;
  };

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
        {/* Themed Background Container with Progress-Based Visuals */}
        <div className={cn(
          "relative overflow-hidden rounded-xl transition-all duration-500 ease-in-out"
        )}>
          {/* Liquid glass background */}
          <div 
            className="absolute inset-0 bg-white/10 border border-white/20"
            style={{ 
              backdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: '12px'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" style={{ borderRadius: '12px' }} />
          
          {/* Progress-based themed overlay */}
          <div className={cn(
            "absolute inset-0 transition-all duration-500 ease-in-out rounded-xl",
            displayTheme === 'morning' && "bg-gradient-to-br from-sky-500/10 via-yellow-400/8 to-transparent",
            displayTheme === 'midday' && "bg-gradient-to-br from-yellow-400/12 via-green-300/8 to-transparent",
            displayTheme === 'golden' && "bg-gradient-to-br from-orange-500/15 via-amber-400/10 to-red-400/8",
            displayTheme === 'twilight' && "bg-gradient-to-br from-purple-600/15 via-indigo-500/10 to-blue-700/8",
            displayTheme === 'mountain' && "bg-gradient-to-br from-gray-700/15 via-slate-600/10 to-stone-500/8",
            displayTheme === 'aurora' && "bg-gradient-to-br from-emerald-500/20 via-cyan-400/15 to-purple-500/10"
          )} />
          
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

          {/* Milestone Achievement Notification */}
          {showMilestoneTooltip && (
            <div className="absolute top-4 left-4 z-20 animate-fade-in">
              <div 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-lg px-4 py-2 text-white font-medium backdrop-blur-sm"
                style={{
                  animation: 'slideDown 3s ease-out forwards'
                }}
              >
                <span className="text-xl">{getThemeInfo(currentTheme).emoji}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">New milestone reached!</span>
                  <span className="text-xs text-white/80">{getThemeInfo(currentTheme).name}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="relative p-6 space-y-6">
            {/* Header with XP Counter */}
            <div className="flex items-center justify-between pb-6">
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
          <div className="space-y-4 mt-24">
            
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
                  
                  {/* Friend Progress Markers */}
                  {friends.length > 0 && friends.map((friend, index) => {
                    const friendProgress = (friend.coursesPlayed / 300) * 100;
                    if (friendProgress <= 0 || friendProgress >= 95) return null;
                    
                    return (
                      <div
                        key={friend.id}
                        className="absolute top-0 transform -translate-x-1/2 z-20"
                        style={{ left: `${friendProgress}%` }}
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-lg mb-1" />
                          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            🏁 {friend.display_name || friend.username} ({friend.coursesPlayed})
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                         {trophy.requiredCourses}
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
          <div className="space-y-4 pt-4">
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
                  className="relative flex flex-col items-center p-4 rounded-lg transition-all cursor-pointer hover:scale-105 overflow-hidden"
                  onClick={() => {
                    setSelectedCourseList(list);
                    setIsCourseListModalOpen(true);
                  }}
                >
                  {/* Glassmorphism overlay */}
                  <div 
                    className="absolute inset-0 bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                    style={{ 
                      backdropFilter: 'blur(8px) saturate(120%)',
                      borderRadius: '8px'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-transparent" style={{ borderRadius: '8px' }} />
                  
                  {/* Content - relative positioning to appear above the glass overlay */}
                  <div className="relative z-10 w-full">
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

          {/* Dynamic Achievements Feed */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-base text-white">📣 Recent Achievements</span>
              <span className="text-sm text-white/60">Last 7 days</span>
            </div>

            <div className="space-y-3">
              {/* Show loading state while fetching achievements */}
              {achievementsLoading ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-white/20 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-white/10 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              ) : achievements.length > 0 ? (
                /* Render real achievements from database */
                achievements.map((achievement, index) => (
                  <div 
                    key={achievement.id}
                    className="animate-fade-in flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-2xl">{achievement.emoji}</div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{achievement.message}</p>
                      <p className="text-xs text-white/60">{achievement.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                /* Show empty state when no achievements */
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-2xl">🎯</div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">Start playing courses to earn achievements!</p>
                    <p className="text-xs text-white/60">Your journey begins here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compare with Friends Button */}
          {isCurrentUser && (
            <div className="flex items-center justify-center pt-6 border-t border-white/10">
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-400 font-medium transition-colors"
              >
                <Target className="w-4 h-4" />
                Compare with Friends
              </button>
            </div>
          )}

          {/* Summary Stats */}
          <div className="flex items-center justify-center text-base pt-6 border-t border-white/10">
            <div className="text-white/60">
              Global Trophies: {unlockedGlobalTrophies.length}/{globalTrophies.length}
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

        {/* Compare with Friends Modal */}
        <CompareWithFriendsModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          currentUserCourses={completedCount}
          currentUserRegionalProgress={{
            britainIrelandCompleted,
            europeCompleted,
            usaCompleted,
            worldwideCompleted
          }}
        />

        {/* Friends Leaderboard Section */}
        {isCurrentUser && (
          <div className="mt-6">
            <FriendsLeaderboard
              onInviteFriends={() => {
                // TODO: Implement invite friends functionality
                console.log('Invite friends clicked');
              }}
              onCompareWith={(friendId) => {
                console.log('Compare with friend:', friendId);
                setIsCompareModalOpen(true);
              }}
            />
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
};

export default GamificationProgressBar;