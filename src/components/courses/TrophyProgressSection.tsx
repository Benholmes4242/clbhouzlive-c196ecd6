import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Lock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
              {isCurrentUser 
                ? `You've played ${completedCount} of 300 top 100 courses`
                : `${userFirstName || 'User'} has played ${completedCount} of 300 top 100 courses`
              }
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
                         >
                           {trophy.id === 'green-fee-rookie' ? (
                             <img 
                               src="/lovable-uploads/5a091ad9-4617-497e-ba13-9da6506fe989.png" 
                               alt="20 Club Trophy" 
                               className={cn(
                             'h-24 w-auto object-contain transition-all duration-300',
                             trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                           )}
                               style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                             />
                           ) : trophy.id === 'the-turn' ? (
                             <img 
                               src="/lovable-uploads/43291ca4-d526-4b10-9585-6ea3488445cf.png" 
                               alt="The Turn Trophy"
                               className={cn(
                             'h-24 w-auto object-contain transition-all duration-300',
                             trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                           )}
                               style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(148, 163, 184, 0.6))' : 'none' }}
                             />
                           ) : (
                             <TrophyIcon 
                               isUnlocked={trophy.isUnlocked} 
                               color={trophy.color} 
                               size="lg" 
                             />
                           )}
                           
                           <div className="text-center space-y-1 w-full">
                             <h6 className="font-semibold text-sm text-foreground">
                               {trophy.name}
                             </h6>
                             <p className="text-xs text-muted-foreground">
                               {trophy.requiredCourses} courses
                             </p>
                             <div className="text-xs font-medium text-primary">
                               {trophy.xp.toLocaleString()} XP
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                ) : (
                  /* Desktop: Full Grid with Spacing */
                  <div className="grid grid-cols-5 gap-8 pt-8 pb-4">
                    {globalTrophies.map((trophy, index) => (
                      <div key={trophy.id} className="relative flex flex-col items-center space-y-3 cursor-pointer hover:scale-105 transition-all duration-300">
                        {trophy.id === 'green-fee-rookie' ? (
                          <img 
                            src="/lovable-uploads/5a091ad9-4617-497e-ba13-9da6506fe989.png" 
                            alt="20 Club Trophy" 
                            className={cn(
                          'h-32 w-auto object-contain transition-all duration-300',
                          trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                        )}
                            style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                          />
                        ) : trophy.id === 'the-turn' ? (
                          <img 
                            src="/lovable-uploads/43291ca4-d526-4b10-9585-6ea3488445cf.png" 
                            alt="The Turn Trophy"
                            className={cn(
                          'h-32 w-auto object-contain transition-all duration-300',
                          trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                        )}
                            style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(148, 163, 184, 0.6))' : 'none' }}
                          />
                        ) : (
                          <TrophyIcon 
                            isUnlocked={trophy.isUnlocked} 
                            color={trophy.color} 
                            size="lg" 
                          />
                        )}
                        
                        <div className="text-center space-y-1">
                          <h6 className="font-semibold text-sm text-foreground">
                            {trophy.name}
                          </h6>
                          <p className="text-xs text-muted-foreground">
                            {trophy.requiredCourses} courses
                          </p>
                          <div className="text-xs font-medium text-primary">
                            {trophy.xp.toLocaleString()} XP
                          </div>
                        </div>
                      </div>
                    ))}
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