import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import padlockIcon from '@/assets/padlock-clean.png';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';

interface TrophyProgressSectionProps {
  completedCount: number;
  className?: string;
  userFirstName?: string;
  isCurrentUser?: boolean;
  milestoneUnlockDates?: Record<number, string>; // e.g., { 20: '2024-09-15', 50: '2024-11-20' }
}

// Global XP-Based Trophies
const GLOBAL_TROPHIES = [
  {
    id: 'green-fee-rookie',
    name: 'The 20 Club',
    requiredCourses: 20,
    xp: 2200,
    color: 'from-green-600 to-green-800',
    tier: 'green',
    description: 'Awarded for completing 20 Top 100 Courses. Welcome to the club!',
    customBadge: '/lovable-uploads/9a5af57b-72fa-4986-bcbb-9c3ce337584c.png',
  },
  {
    id: 'the-turn',
    name: 'The 50 Club',
    requiredCourses: 50,
    xp: 5500,
    color: 'from-green-600 to-green-800',
    tier: 'green',
    description: 'Awarded for completing 50 Top 100 Courses. You\'re making the turn!',
    customBadge: '/lovable-uploads/b9a07b6a-a2ef-4f59-acea-76f2b67faa8d.png',
  },
  {
    id: 'century-club',
    name: 'The Century Club',
    requiredCourses: 100,
    xp: 11000,
    color: 'from-yellow-500 to-amber-600',
    tier: 'gold',
    description: 'Awarded for completing 100 Top 100 Courses. Century achievement unlocked!',
    customBadge: '/lovable-uploads/f6339399-b23a-457b-b65e-8c2f7322a12b.png',
  },
  {
    id: 'clubhouse-elite',
    name: 'Clubhouse Elite',
    requiredCourses: 200,
    xp: 22000,
    color: 'from-gray-400 to-slate-500',
    tier: 'silver',
    description: 'Awarded for completing 200 Top 100 Courses. Elite status achieved!',
    customBadge: '/lovable-uploads/3fad8a43-f0de-42f5-b709-ae685b2cd173.png',
  },
  {
    id: 'course-collector',
    name: 'Club Champion',
    requiredCourses: 300,
    xp: 33000,
    color: 'from-yellow-500 to-amber-600',
    tier: 'gold',
    description: 'Awarded for completing 300 Top 100 Courses. Ultimate champion status!',
    customBadge: '/lovable-uploads/5e67194f-43f3-4c9d-a5a2-8c0b335c0a09.png',
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
        <Trophy className="w-4 h-4 text-foreground" />
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center bg-gray-600 border-2 border-gray-500',
      sizeClasses[size]
    )}>
      <img src={padlockIcon} alt="Locked" className="w-5 h-5 opacity-70 drop-shadow-none" style={{ filter: 'none', background: 'transparent' }} />
    </div>
  );
};

const TrophyProgressSection: React.FC<TrophyProgressSectionProps> = ({
  completedCount,
  className = '',
  userFirstName,
  isCurrentUser = true,
  milestoneUnlockDates = {},
}) => {
  const currentXP = completedCount * 110;
  const [showXPFloat, setShowXPFloat] = useState(false);
  const [prevCompletedCount, setPrevCompletedCount] = useState(completedCount);
  
  // Mobile detection
  const isMobile = useIsMobile();

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
    return GLOBAL_TROPHIES.map(trophy => {
      const isUnlocked = completedCount >= trophy.requiredCourses;
      const currentProgress = Math.min(completedCount, trophy.requiredCourses);
      
      // Use actual milestone unlock date if available
      let unlockedDate = null;
      if (isUnlocked && milestoneUnlockDates[trophy.requiredCourses]) {
        const date = new Date(milestoneUnlockDates[trophy.requiredCourses]);
        unlockedDate = date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      }
      
      return {
        ...trophy,
        isUnlocked,
        progress: Math.min((completedCount / trophy.requiredCourses) * 100, 100),
        currentProgress,
        unlockedDate,
      };
    });
  }, [completedCount, milestoneUnlockDates]);

   const nextGlobalTrophy = globalTrophies.find(trophy => !trophy.isUnlocked);
   const unlockedGlobalTrophies = globalTrophies.filter(trophy => trophy.isUnlocked);
   const lastUnlockedTrophy = unlockedGlobalTrophies[unlockedGlobalTrophies.length - 1];
   
   // Carousel navigation for mobile trophy slider
   const { carouselRef, canScrollLeft, canScrollRight, scroll } = useCarouselNavigation(globalTrophies.length);

  return (
    <Tooltip.Provider>
      <div className={cn('space-y-6', className)}>
        {/* Content without background container */}
        <div className="space-y-0 relative overflow-hidden">
          
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
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-lg px-4 py-2 text-foreground font-medium backdrop-blur-sm"
                style={{
                  animation: 'slideDown 3s ease-out forwards'
                }}
              >
                <span className="text-xl">{getThemeInfo(currentTheme).emoji}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">New milestone reached!</span>
                  <span className="text-xs text-muted-foreground">{getThemeInfo(currentTheme).name}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="relative">
            {/* Title */}
            <h2 className="text-3xl font-bold text-foreground mb-4">Achievements</h2>
            
            {/* Header with XP Counter */}
            <div className="flex items-center justify-between pb-0 px-0 pt-2">
            <p className="text-muted-foreground">
              {isCurrentUser 
                ? `${completedCount} of 300 courses played`
                : `${completedCount} of 300 courses played`
              }
            </p>
              <p className="text-muted-foreground">
                Course XP: {currentXP.toLocaleString()}
              </p>
            </div>

          {/* Global XP Progress Bar with improved spacing */}
          <div className="space-y-0 mt-0 mb-0">
            
            {/* Trophy Timeline */}
            <div className="relative">
               {/* Trophy Points - Mobile: Horizontal Slider, Desktop: Grid with Progress Bars */}
                {isMobile ? (
                   /* Mobile: Horizontal Scrollable version of desktop layout */
                   <div className="relative">
                     <div 
                       ref={carouselRef}
                       className="flex overflow-x-auto scrollbar-hide gap-0 px-2 pb-4 snap-x snap-mandatory items-center pt-2 pb-1"
                       style={{ scrollPaddingLeft: '8px', scrollPaddingRight: '8px' }}
                     >
                       {globalTrophies.map((trophy, index) => {
                         return (
                           <div key={`trophy-progress-mobile-${trophy.id}`} className="contents">
                             {/* Trophy */}
                             <div className="flex justify-center flex-shrink-0">
                               <Tooltip.Root delayDuration={200}>
                                 <Tooltip.Trigger asChild>
                                   <div className="relative flex flex-col items-center space-y-3 cursor-pointer hover:scale-105 transition-all duration-300 z-10">
                                     {trophy.id === 'green-fee-rookie' ? (
                                       <img 
                                         src="/lovable-uploads/9a5af57b-72fa-4986-bcbb-9c3ce337584c.png"
                                         alt="20 Club Trophy" 
                                         className={cn(
                                       'h-24 w-auto object-contain transition-all duration-300',
                                       trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                     )}
                                         style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))' : 'none' }}
                                       />
                                     ) : trophy.id === 'the-turn' ? (
                                       <img 
                                         src="/lovable-uploads/b9a07b6a-a2ef-4f59-acea-76f2b67faa8d.png"
                                         alt="The Turn Trophy"
                                         className={cn(
                                       'h-24 w-auto object-contain transition-all duration-300',
                                       trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                     )}
                                          style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))' : 'none' }}
                                        />
                                      ) : trophy.id === 'century-club' ? (
                                        <img 
                                          src="/lovable-uploads/f6339399-b23a-457b-b65e-8c2f7322a12b.png"
                                          alt="Century Club Trophy"
                                          className={cn(
                                        'h-24 w-auto object-contain transition-all duration-300',
                                        trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                      )}
                                          style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                                        />
                                      ) : trophy.id === 'clubhouse-elite' ? (
                                        <img 
                                          src="/lovable-uploads/3fad8a43-f0de-42f5-b709-ae685b2cd173.png"
                                          alt="Clubhouse Elite Trophy"
                                          className={cn(
                                        'h-24 w-auto object-contain transition-all duration-300',
                                        trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                      )}
                                          style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(148, 163, 184, 0.6))' : 'none' }}
                                        />
                                      ) : trophy.id === 'course-collector' ? (
                                        <img 
                                          src="/lovable-uploads/5e67194f-43f3-4c9d-a5a2-8c0b335c0a09.png"
                                          alt="Club Champion Trophy"
                                          className={cn(
                                        'h-24 w-auto object-contain transition-all duration-300',
                                        trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                      )}
                                          style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                                        />
                                      ) : (
                                       <TrophyIcon 
                                         isUnlocked={trophy.isUnlocked} 
                                         color={trophy.color} 
                                         size="lg" 
                                       />
                                     )}
                                   </div>
                                 </Tooltip.Trigger>
                                 <Tooltip.Portal>
                                   <Tooltip.Content 
                                     className="bg-background border border-border rounded-lg p-3 shadow-lg z-50 max-w-[200px] animate-fade-in"
                                     sideOffset={8}
                                     side="bottom"
                                   >
                                     <div className="text-center space-y-1">
                                       <h4 className="font-semibold text-sm text-foreground">{trophy.name}</h4>
                                       <p className="text-xs text-muted-foreground leading-relaxed">{trophy.description}</p>
                                       <p className="text-xs font-medium text-primary">
                                         Progress: {trophy.currentProgress}/{trophy.requiredCourses}
                                       </p>
                                       {trophy.isUnlocked && trophy.unlockedDate && (
                                         <p className="text-xs text-green-600 font-medium">Unlocked: {trophy.unlockedDate}</p>
                                       )}
                                     </div>
                                     <Tooltip.Arrow className="fill-border" />
                                   </Tooltip.Content>
                                 </Tooltip.Portal>
                               </Tooltip.Root>
                             </div>
                             
                             {/* Progress Bar (except after last trophy) */}
                             {index < globalTrophies.length - 1 && (
                               <div className="flex items-center justify-center w-16 flex-shrink-0">
                                 <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                                   <div 
                                     className="h-full bg-green-700 transition-all duration-500 ease-out"
                                     style={{ 
                                       width: `${(() => {
                                         const nextTrophy = globalTrophies[index + 1];
                                         const currentMilestone = trophy.requiredCourses;
                                         const nextMilestone = nextTrophy.requiredCourses;
                                         const segmentSize = nextMilestone - currentMilestone;
                                         const progressInSegment = Math.max(0, Math.min(completedCount - currentMilestone, segmentSize));
                                         return (progressInSegment / segmentSize) * 100;
                                       })()}%` 
                                     }}
                                   />
                                 </div>
                               </div>
                             )}
                            </div>
                         );
                       })}
                     </div>
                   </div>
                ) : (
                  /* Desktop: Grid with Progress Bars Between Trophies */
                  <div className="grid grid-cols-9 gap-0 pt-2 pb-1 items-center">
                    {globalTrophies.map((trophy, index) => {
                      const prevMilestone = index === 0 ? 0 : globalTrophies[index - 1].requiredCourses;
                      const currentMilestone = trophy.requiredCourses;
                      const segmentSize = currentMilestone - prevMilestone;
                      const progressInSegment = Math.max(0, Math.min(completedCount - prevMilestone, segmentSize));
                      const segmentProgress = (progressInSegment / segmentSize) * 100;
                      
                      return (
                        <div key={`trophy-progress-${trophy.id}`} className="contents">
                          {/* Trophy */}
                          <div className="flex justify-center">
                            <Tooltip.Root delayDuration={200}>
                              <Tooltip.Trigger asChild>
                                <div className="relative flex flex-col items-center space-y-3 cursor-pointer hover:scale-105 transition-all duration-300 z-10">
                                  {trophy.id === 'green-fee-rookie' ? (
                                    <img 
                                      src="/lovable-uploads/9a5af57b-72fa-4986-bcbb-9c3ce337584c.png" 
                                      alt="20 Club Trophy" 
                                      className={cn(
                                    'h-36 w-auto object-contain transition-all duration-300',
                                    trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                  )}
                                      style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))' : 'none' }}
                                    />
                                  ) : trophy.id === 'the-turn' ? (
                                    <img 
                                      src="/lovable-uploads/b9a07b6a-a2ef-4f59-acea-76f2b67faa8d.png" 
                                      alt="The Turn Trophy"
                                      className={cn(
                                    'h-36 w-auto object-contain transition-all duration-300',
                                    trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                  )}
                                       style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))' : 'none' }}
                                     />
                                   ) : trophy.id === 'century-club' ? (
                                     <img 
                                       src="/lovable-uploads/f6339399-b23a-457b-b65e-8c2f7322a12b.png" 
                                       alt="Century Club Trophy"
                                       className={cn(
                                     'h-36 w-auto object-contain transition-all duration-300',
                                     trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                   )}
                                       style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                                     />
                                   ) : trophy.id === 'clubhouse-elite' ? (
                                     <img 
                                       src="/lovable-uploads/3fad8a43-f0de-42f5-b709-ae685b2cd173.png" 
                                       alt="Clubhouse Elite Trophy"
                                       className={cn(
                                     'h-36 w-auto object-contain transition-all duration-300',
                                     trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                   )}
                                       style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(148, 163, 184, 0.6))' : 'none' }}
                                     />
                                   ) : trophy.id === 'course-collector' ? (
                                     <img 
                                       src="/lovable-uploads/5e67194f-43f3-4c9d-a5a2-8c0b335c0a09.png" 
                                       alt="Club Champion Trophy"
                                       className={cn(
                                     'h-36 w-auto object-contain transition-all duration-300',
                                     trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                                   )}
                                       style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                                     />
                                   ) : (
                                    <TrophyIcon 
                                      isUnlocked={trophy.isUnlocked} 
                                      color={trophy.color} 
                                      size="lg" 
                                    />
                                  )}
                                </div>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content 
                                  className="bg-background border border-border rounded-lg p-3 shadow-lg z-50 max-w-[200px] animate-fade-in"
                                  sideOffset={8}
                                  side="bottom"
                                >
                                  <div className="text-center space-y-1">
                                    <h4 className="font-semibold text-sm text-foreground">{trophy.name}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{trophy.description}</p>
                                    <p className="text-xs font-medium text-primary">
                                      Progress: {trophy.currentProgress}/{trophy.requiredCourses}
                                    </p>
                                    {trophy.isUnlocked && trophy.unlockedDate && (
                                      <p className="text-xs text-green-600 font-medium">Unlocked: {trophy.unlockedDate}</p>
                                    )}
                                  </div>
                                  <Tooltip.Arrow className="fill-border" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          </div>
                          
                          {/* Progress Bar (except after last trophy) */}
                          {index < globalTrophies.length - 1 && (
                            <div className="flex items-center justify-center">
                              <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-700 transition-all duration-500 ease-out"
                                  style={{ 
                                    width: `${(() => {
                                      const nextTrophy = globalTrophies[index + 1];
                                      const currentMilestone = trophy.requiredCourses;
                                      const nextMilestone = nextTrophy.requiredCourses;
                                      const segmentSize = nextMilestone - currentMilestone;
                                      const progressInSegment = Math.max(0, Math.min(completedCount - currentMilestone, segmentSize));
                                      return (progressInSegment / segmentSize) * 100;
                                    })()}%` 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
};

export default TrophyProgressSection;