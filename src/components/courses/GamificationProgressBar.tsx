import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Lock, CheckCircle, Plus, Calendar, Target, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CircularProgress from '@/components/ui/circular-progress';
import { CourseListModal } from './CourseListModal';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import FriendsLeaderboard from './friends/FriendsLeaderboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';

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

// Regional List Completion
const REGIONAL_LISTS = [
  {
    id: 'britain-ireland',
    name: 'GB&I Top 100',
    shortName: 'GB&I',
    tag: 'Links Legend',
    description: "You've mastered the finest across the British Isles.",
  },
  {
    id: 'europe',
    name: 'Europe Top 100',
    shortName: 'EUR',
    tag: 'The Continental Swinger',
    description: 'From Algarve to the Alps. Europe\'s elite courses. Conquered.',
  },
  {
    id: 'usa',
    name: 'USA Top 100',
    shortName: 'USA',
    tag: 'Stars and Stripes Tourer',
    description: 'Coast to coast, you\'ve played the American greats.',
  },
  {
    id: 'worldwide',
    name: 'Global Top 100',
    shortName: 'Global',
    tag: 'Legends Club',
    description: 'From Seve to Tiger to Jack, legends have walked where you now stand. You\'ve joined golf\'s most elite circle. Welcome.',
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
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  
  // Mobile detection
  const isMobile = useIsMobile();

  // Fetch friends data for progress markers
  const { user } = useSupabaseSession();
  const { data: friends = [] } = useFriendsLeaderboard(user?.id);

  // Fetch real user achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useUserAchievements(user?.id);

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
                ? `You've rated ${completedCount} of 300 top 100 courses`
                : `${userFirstName || 'User'} has rated ${completedCount} of 300 top 100 courses`
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
                           ) : trophy.id === 'century-club' ? (
                             <img 
                               src="/lovable-uploads/0c126dc7-5509-40b9-862d-b054423ca7f6.png" 
                               alt="Century Club Trophy" 
                               className={cn(
                             'h-24 w-auto object-contain transition-all duration-300',
                             trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                           )}
                               style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))' : 'none' }}
                             />
                           ) : trophy.id === 'clubhouse-elite' ? (
                             <img 
                               src="/lovable-uploads/a9672498-b79d-4a47-9e6a-1128770700c9.png" 
                               alt="Clubhouse Elite Trophy" 
                               className={cn(
                             'h-24 w-auto object-contain transition-all duration-300',
                             trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                           )}
                               style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))' : 'none' }}
                             />
                           ) : trophy.id === 'course-collector' ? (
                             <img 
                               src="/lovable-uploads/3c517cb5-203d-4ad8-b3b5-e5e7c33a24b0.png" 
                               alt="Course Collector Trophy" 
                               className={cn(
                             'h-24 w-auto object-contain transition-all duration-300',
                             trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                           )}
                               style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(147, 51, 234, 0.6))' : 'none' }}
                             />
                           ) : (
                             <div className={cn(
                             'h-24 w-24 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-300',
                             trophy.color,
                             trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                           )}
                             style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.3))' : 'none' }}
                             >
                                <Trophy className="w-12 h-12 text-foreground" />
                              </div>
                            )}
                            <div className="text-center">
                              <div className="text-xl font-bold text-foreground mb-1">
                                {trophy.requiredCourses}
                              </div>
                              <div className="text-sm text-muted-foreground leading-tight font-medium">
                                {trophy.name}
                             </div>
                           </div>
                           
                            {/* Full-width progress bar connected to bottom of card */}
                            <div className="absolute bottom-0 left-0 right-0 z-10">
                              <div className="w-full bg-gray-200 h-1.5 overflow-hidden" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                                 <div
                                   className="h-1.5 transition-all duration-500 ease-out"
                                   style={{ 
                                     width: `${Math.min((completedCount / trophy.requiredCourses) * 100, 100)}%`,
                                     backgroundColor: '#22c55e',
                                     filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.4))',
                                     borderBottomLeftRadius: '12px',
                                     borderBottomRightRadius: '12px'
                                   }}
                                   
                                 />
                               </div>
                           </div>
                         </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Desktop: Original Grid Layout */
                  <div className="flex justify-between items-start relative z-10">
                   {globalTrophies.map((trophy, index) => (
                     <div 
                       key={trophy.id} 
                       className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-110 transition-all duration-300 hover:-translate-y-1"
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
                       {trophy.id === 'green-fee-rookie' ? (
                         <img 
                           src="/lovable-uploads/f2f50b99-38e1-466b-8ac8-c32e428231cb.png" 
                           alt="Green Fee Rookie Trophy" 
                           className={cn(
                          'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                         trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                       )}
                           style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                         />
                       ) : trophy.id === 'the-turn' ? (
                         <img 
                           src="/lovable-uploads/43291ca4-d526-4b10-9585-6ea3488445cf.png" 
                           alt="The Turn Trophy"
                           className={cn(
                          'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                         trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                       )}
                           style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(148, 163, 184, 0.6))' : 'none' }}
                         />
                       ) : trophy.id === 'century-club' ? (
                         <img 
                           src="/lovable-uploads/0c126dc7-5509-40b9-862d-b054423ca7f6.png" 
                           alt="Century Club Trophy" 
                           className={cn(
                          'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                         trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                       )}
                           style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))' : 'none' }}
                         />
                       ) : trophy.id === 'clubhouse-elite' ? (
                         <img 
                           src="/lovable-uploads/a9672498-b79d-4a47-9e6a-1128770700c9.png" 
                           alt="Clubhouse Elite Trophy" 
                           className={cn(
                          'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                         trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                       )}
                           style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))' : 'none' }}
                         />
                       ) : trophy.id === 'course-collector' ? (
                         <img 
                           src="/lovable-uploads/3c517cb5-203d-4ad8-b3b5-e5e7c33a24b0.png" 
                           alt="Course Collector Trophy" 
                           className={cn(
                         'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                         trophy.isUnlocked ? 'opacity-100 animate-subtle-bounce' : 'opacity-40 grayscale'
                       )}
                           style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(147, 51, 234, 0.6))' : 'none' }}
                         />
                       ) : (
                         <div className={cn(
                         'h-20 w-20 rounded-full flex items-center justify-center bg-gradient-to-br -mt-4 transition-all duration-300',
                         trophy.color,
                         trophy.isUnlocked ? 'opacity-100 animate-bounce' : 'opacity-40 grayscale'
                       )}
                         style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.3))' : 'none' }}
                         >
                             <Trophy className="w-10 h-10 text-foreground" />
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">
                            {trophy.requiredCourses}
                          </div>
                          <div className="text-sm text-muted-foreground max-w-16 leading-tight font-medium">
                            {trophy.name}
                         </div>
                       </div>
                     </div>
                    ))}
                   </div>
                 )}
             </div>

          </div>

          {/* Divider Line */}
          <div className="mx-16 border-t border-gray-300/60"></div>

          {/* Regional Lists Completion - Improved Cards with enhanced spacing */}
          <div className="space-y-4 pt-8">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Regional List Completion</span>
              <span className="text-base font-medium text-foreground">
                {regionalProgress.completedLists}/4 lists completed
              </span>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-4 gap-4">
              {regionalProgress.lists.map((list) => (
                <div
                  key={list.id}
                  className="flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer hover:scale-105 hover:-translate-y-1 bg-background border-border hover:shadow-lg duration-300"
                  style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                  onClick={() => {
                    setSelectedCourseList(list);
                    setIsCourseListModalOpen(true);
                  }}
                >
                  {/* Region Name at Top */}
                  <h4 className="text-lg font-semibold text-foreground text-center mb-3 w-full">
                    {list.name}
                  </h4>

                  {/* Top Row: Trophy Left, Progress Ring Right */}
                  <div className="flex items-center justify-between w-full mb-2">
                    {/* Trophy Icon - Left Side with enhanced styling */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        {list.id === 'britain-ireland' ? (
                          <img 
                            src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                            alt="British & Irish Trophy" 
                            className={cn(
                              'h-20 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                            )}
                            style={{ 
                              filter: list.isCompleted 
                                ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                            }}
                          />
                        ) : list.id === 'europe' ? (
                          <img 
                            src="/lovable-uploads/fa5756cb-1a89-478b-b8ad-8d26168c1f4f.png" 
                            alt="European Trophy" 
                            className={cn(
                              'h-20 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                            )}
                            style={{ 
                              filter: list.isCompleted 
                                ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                            }}
                          />
                        ) : list.id === 'usa' ? (
                          <img 
                            src="/lovable-uploads/7ae756b6-b8e6-4d03-a6ee-f8c336eec047.png" 
                            alt="USA Trophy" 
                            className={cn(
                              'h-20 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                            )}
                            style={{ 
                              filter: list.isCompleted 
                                ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                            }}
                          />
                        ) : list.id === 'worldwide' ? (
                          <img 
                            src="/lovable-uploads/ab0f852c-4e2f-408d-a13c-ef3a595470e8.png" 
                            alt="Worldwide Trophy" 
                            className={cn(
                              'h-20 w-auto object-contain transition-all duration-300',
                              list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                            )}
                            style={{ 
                              filter: list.isCompleted 
                                ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                            }}
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
                        bottomText={`${(list.completed * 110).toLocaleString()} XP`}
                      />
                    </div>
                  </div>
                  
                  {/* Spacer for separation */}
                  <div className="flex-1"></div>
                  
                  {/* Text content moved to bottom */}
                  <div className="mt-auto w-full">
                    {/* Achievement Tag - Black Text */}
                    <div className="text-sm font-medium text-black text-center mb-1">
                      {list.tag}
                    </div>
                    
                    {/* Description */}
                    <p className="text-xs text-black text-center mb-1 leading-relaxed">
                      {list.description}
                    </p>
                  </div>
                  
                </div>
              ))}
            </div>

            {/* Mobile Swipeable Layout */}
            <div className="md:hidden">
              <div className="relative overflow-hidden">
                <div 
                  className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
                  style={{ 
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {regionalProgress.lists.map((list, index) => (
                    <div
                      key={list.id}
                      className="flex-shrink-0 w-[calc(100vw-5rem)] max-w-[280px] snap-center"
                      style={{
                        marginRight: index === regionalProgress.lists.length - 1 ? '0' : '1rem'
                      }}
                    >
                      <div
                        className="aspect-[4/3.5] flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer hover:scale-105 hover:-translate-y-1 bg-background border-border hover:shadow-lg duration-300 h-full"
                        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                        onClick={() => {
                          setSelectedCourseList(list);
                          setIsCourseListModalOpen(true);
                        }}
                      >
                        {/* Region Name at Top */}
                        <h4 className="text-base font-semibold text-foreground text-center mb-3 w-full">
                          {list.name}
                        </h4>

                        {/* Top Row: Trophy Left, Progress Ring Right */}
                        <div className="flex items-center justify-between w-full mb-auto">
                          {/* Trophy Icon - Left Side with enhanced styling */}
                          <div className="flex-shrink-0">
                            <div className="relative">
                              {list.id === 'britain-ireland' ? (
                                <img 
                                  src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                                  alt="British & Irish Trophy" 
                                  className={cn(
                                    'h-24 w-auto object-contain transition-all duration-300',
                                    list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                                  )}
                                  style={{ 
                                    filter: list.isCompleted 
                                      ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                                  }}
                                />
                              ) : list.id === 'europe' ? (
                                <img 
                                  src="/lovable-uploads/fa5756cb-1a89-478b-b8ad-8d26168c1f4f.png" 
                                  alt="European Trophy" 
                                  className={cn(
                                    'h-24 w-auto object-contain transition-all duration-300',
                                    list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                                  )}
                                  style={{ 
                                    filter: list.isCompleted 
                                      ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                                  }}
                                />
                              ) : list.id === 'usa' ? (
                                <img 
                                  src="/lovable-uploads/7ae756b6-b8e6-4d03-a6ee-f8c336eec047.png" 
                                  alt="USA Trophy" 
                                  className={cn(
                                    'h-24 w-auto object-contain transition-all duration-300',
                                    list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                                  )}
                                  style={{ 
                                    filter: list.isCompleted 
                                      ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                                  }}
                                />
                              ) : list.id === 'worldwide' ? (
                                <img 
                                  src="/lovable-uploads/ab0f852c-4e2f-408d-a13c-ef3a595470e8.png" 
                                  alt="Worldwide Trophy" 
                                  className={cn(
                                    'h-24 w-auto object-contain transition-all duration-300',
                                    list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                                  )}
                                  style={{ 
                                    filter: list.isCompleted 
                                      ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                                  }}
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
                              bottomText={`${(list.completed * 110).toLocaleString()} XP`}
                            />
                          </div>
                        </div>
                        
                        {/* Text content moved to bottom */}
                        <div className="mt-auto pt-1 w-full">
                          {/* Achievement Tag - Black Text */}
                          <div className="text-xs font-medium text-black text-center mb-1">
                            {list.tag}
                          </div>
                          
                          {/* Description - Truncated for mobile */}
                          <p className="text-xs text-black text-center mb-1 leading-relaxed line-clamp-2">
                            {list.description}
                          </p>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* World Conqueror Achievement */}
            {regionalProgress.isWorldConqueror && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-5 text-center shadow-lg">
                <h5 className="font-bold text-foreground mb-1 text-lg">🌍 World Conqueror!</h5>
                <p className="text-base text-muted-foreground">
                  You've completed all regional lists. Truly legendary!
                </p>
              </div>
            )}
          </div>

          {/* Friends Progress Section - Improved Card with enhanced spacing */}
          {isCurrentUser && (
            <div className="pt-10">
              {/* Divider Line */}
              <div className="mx-16 border-t border-gray-300/60 mb-2"></div>
              
              <Collapsible open={isFriendsOpen} onOpenChange={setIsFriendsOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group hover:bg-muted/50 rounded-xl p-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-foreground">Friends' Progress</h3>
                      <p className="text-sm text-muted-foreground">See how you compare with your golf friends</p>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-200",
                    isFriendsOpen && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
                    <FriendsLeaderboard
                      onInviteFriends={() => {
                        // TODO: Implement invite friends functionality
                        console.log('Invite friends clicked');
                      }}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
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
                          <div className={cn('h-16 w-16 rounded-sq-md flex items-center justify-center bg-gradient-to-br', selectedTrophy.color)}>
                            <Trophy className="w-8 h-8 text-foreground" />
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
                      <Dialog.Title className="text-xl font-bold text-foreground mb-1">
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
                    <div className="flex items-center gap-2 text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground">
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
                <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
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