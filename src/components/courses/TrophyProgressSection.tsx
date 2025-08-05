import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Lock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
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
}

// Global XP-Based Trophies
const GLOBAL_TROPHIES = [
  {
    id: 'green-fee-rookie',
    name: 'The 20 Club',
    requiredCourses: 20,
    xp: 2200,
    color: 'from-amber-500 to-yellow-600',
    tier: 'gold',
  },
  {
    id: 'the-turn',
    name: 'The 50 Club',
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
    name: 'Club Collector',
    requiredCourses: 300,
    xp: 33000,
    color: 'from-purple-500 to-violet-600',
    tier: 'purple',
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
      <Lock className="w-4 h-4 text-gray-400" />
    </div>
  );
};

const TrophyProgressSection: React.FC<TrophyProgressSectionProps> = ({
  completedCount,
  className = '',
  userFirstName,
  isCurrentUser = true,
}) => {
  const currentXP = completedCount * 110;
  const [showXPFloat, setShowXPFloat] = useState(false);
  const [prevCompletedCount, setPrevCompletedCount] = useState(completedCount);
  const [selectedTrophy, setSelectedTrophy] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    return GLOBAL_TROPHIES.map(trophy => ({
      ...trophy,
      isUnlocked: completedCount >= trophy.requiredCourses,
      progress: Math.min((completedCount / trophy.requiredCourses) * 100, 100),
    }));
  }, [completedCount]);

   const nextGlobalTrophy = globalTrophies.find(trophy => !trophy.isUnlocked);
   const unlockedGlobalTrophies = globalTrophies.filter(trophy => trophy.isUnlocked);
   const lastUnlockedTrophy = unlockedGlobalTrophies[unlockedGlobalTrophies.length - 1];
   
   // Carousel navigation for mobile trophy slider
   const { carouselRef, canScrollLeft, canScrollRight, scroll } = useCarouselNavigation(globalTrophies.length);

  return (
    <Tooltip.Provider>
      <div className={cn('space-y-6', className)}>
        {/* Background Container matching stats bar */}
        <div className="bg-muted border border-border rounded-xl p-6 space-y-6 relative overflow-hidden">
          
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
            {/* Header with XP Counter */}
            <div className="flex items-center justify-between pb-6">
            <h4 className="text-xl font-semibold text-foreground">
              Trophy Progress
            </h4>
              <div className="text-lg font-bold text-foreground transition-all duration-500">
                Total XP: {currentXP.toLocaleString()}
              </div>
            </div>

          {/* Global XP Progress Bar with improved spacing */}
          <div className="space-y-4 mt-6 mb-8">
            
            {/* Trophy Timeline */}
            <div className="relative">
              {/* Desktop only progress line */}
              {!isMobile && (
                <>
                  {/* Progress Line with improved visibility */}
                   <div className="absolute top-4 left-8 right-4 h-3 bg-gray-200 rounded-full overflow-hidden shadow-sm">
                     {nextGlobalTrophy && lastUnlockedTrophy && (
                       <div 
                         className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                         style={{ 
                           width: `${((completedCount - lastUnlockedTrophy.requiredCourses) / (nextGlobalTrophy.requiredCourses - lastUnlockedTrophy.requiredCourses)) * 100}%`,
                           boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)'
                         }}
                       />
                     )}
                     {nextGlobalTrophy && !lastUnlockedTrophy && completedCount < 20 && (
                       <div 
                         className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out shadow-sm animate-pulse"
                         style={{ 
                           width: `${(completedCount / nextGlobalTrophy.requiredCourses) * 20}%`,
                           boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)'
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
                              <div className="bg-background/90 text-foreground text-xs px-2 py-1 rounded whitespace-nowrap border border-border shadow-sm">
                                🏁 {friend.display_name || friend.username} ({friend.coursesPlayed})
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                </>
              )}
               {/* Trophy Points - Mobile: Horizontal Slider, Desktop: Grid */}
                {isMobile ? (
                   /* Mobile: Horizontal Scrollable Slider showing 2 trophies + peek of 3rd */
                   <div className="relative">
                     <div 
                       ref={carouselRef}
                       className="flex overflow-x-auto scrollbar-hide gap-4 px-2 pb-4 snap-x snap-mandatory"
                       style={{ scrollPaddingLeft: '8px', scrollPaddingRight: '8px' }}
                     >
                       {globalTrophies.map((trophy, index) => (
                          <div 
                            key={trophy.id} 
                            className="relative flex-none w-[calc(42%-8px)] flex flex-col items-center space-y-3 cursor-pointer hover:scale-105 transition-all duration-300 snap-start p-4 rounded-xl bg-background/50 border border-border/50 pb-6"
                            style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))' }}
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
                           <TrophyIcon isUnlocked={trophy.isUnlocked} color={trophy.color} size="lg" />
                           <div className="text-center space-y-1">
                             <h5 className="font-bold text-sm text-foreground leading-tight">{trophy.name}</h5>
                             <p className="text-xs text-muted-foreground">{trophy.requiredCourses} courses</p>
                             <p className="text-xs font-medium text-primary">{trophy.xp.toLocaleString()} XP</p>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                ) : (
                  /* Desktop: Horizontal layout with spacing */
                  <div className="flex justify-between items-start pt-2 relative">
                    {globalTrophies.map((trophy, index) => (
                      <Tooltip.Root key={trophy.id}>
                        <Tooltip.Trigger asChild>
                          <div 
                            className="relative flex flex-col items-center space-y-3 cursor-pointer hover:scale-105 transition-all duration-300 group z-10"
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
                            <TrophyIcon isUnlocked={trophy.isUnlocked} color={trophy.color} size="lg" />
                            <div className="text-center space-y-1">
                              <h5 className="font-bold text-sm text-foreground leading-tight">{trophy.name}</h5>
                              <p className="text-xs text-muted-foreground">{trophy.requiredCourses} courses</p>
                              <p className="text-xs font-medium text-primary">{trophy.xp.toLocaleString()} XP</p>
                            </div>
                          </div>
                        </Tooltip.Trigger>
                        <Tooltip.Content 
                          className="bg-background border border-border text-foreground p-3 rounded-lg shadow-lg max-w-xs z-50" 
                          sideOffset={5}
                        >
                          <div className="space-y-2">
                            <h4 className="font-semibold text-foreground">{trophy.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Complete {trophy.requiredCourses} courses to earn {trophy.xp.toLocaleString()} XP
                            </p>
                            {trophy.isUnlocked && (
                              <p className="text-xs text-green-600 font-medium">✓ Unlocked in July 2025</p>
                            )}
                            {!trophy.isUnlocked && (
                              <p className="text-xs text-muted-foreground">
                                {completedCount}/{trophy.requiredCourses} courses ({Math.round(trophy.progress)}%)
                              </p>
                            )}
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Root>
                    ))}
                  </div>
                )}
            </div>
          </div>
          </div>
        </div>

        {/* Trophy Detail Modal */}
        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
              {selectedTrophy && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <TrophyIcon isUnlocked={selectedTrophy.isUnlocked} color={selectedTrophy.color} size="lg" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{selectedTrophy.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTrophy.description}</p>
                    {selectedTrophy.isUnlocked && selectedTrophy.dateEarned && (
                      <p className="text-xs text-green-600 font-medium">✓ Unlocked in {selectedTrophy.dateEarned}</p>
                    )}
                    {!selectedTrophy.isUnlocked && (
                      <p className="text-xs text-muted-foreground">
                        Progress: {completedCount}/{selectedTrophy.requiredCourses} courses ({Math.round(selectedTrophy.progress)}%)
                      </p>
                    )}
                  </div>
                </div>
              )}
              <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <span className="sr-only">Close</span>
                ✕
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

      </div>
    </Tooltip.Provider>
  );
};

export default TrophyProgressSection;