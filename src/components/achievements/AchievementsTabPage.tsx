// AchievementsTabPage - Standalone achievements page component
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

interface AchievementsTabPageProps {
  userId: string;
  userDisplayName?: string;
  userHandicap?: string | number;
  userProfilePhotoUrl?: string;
  isCurrentUser?: boolean;
}

interface Achievement {
  title: string;
  emoji: string;
  isEarned: boolean;
  description: string;
  xp: number;
  isRepeatable: boolean;
  progress?: string;
  dateEarned?: string;
  unlockHint?: string;
}

interface AchievementModalData {
  id: string;
  name: string;
  xp: number;
  unlocked: boolean;
  iconURL?: string;
  description?: string;
  unlockHint?: string;
  progress?: string;
  dateEarned?: string;
  isRepeatable?: boolean;
}

const AchievementsTabPage: React.FC<AchievementsTabPageProps> = ({
  userId,
  userDisplayName = "User",
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser = true
}) => {
  console.log('AchievementsTabPage rendering - v1.0');
  
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked' | 'exploration' | 'skill'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementModalData | null>(null);
  const [showAchievementDetailModal, setShowAchievementDetailModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | 'idle'>('idle');
  const scrollDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const directionChangeTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Mock data for now - replace with actual badge system later
  const totalXP = 2500;
  const nextMilestone = 10000;
  const progressPercentage = isMobile ? 100 : (totalXP / nextMilestone) * 100;
  
  // XP Tier System
  const xpTiers = [
    { name: "Blue Ring", color: "#3B82F6", minXP: 10000 },
    { name: "Green Ring", color: "#10B981", minXP: 20000 },
    { name: "Silver Ring", color: "#6B7280", minXP: 30000 },
    { name: "Gold Ring", color: "#F59E0B", minXP: 40000 }
  ];
  
  const currentTier = xpTiers.slice().reverse().find(tier => totalXP >= tier.minXP);
  const nextTier = xpTiers.find(tier => totalXP < tier.minXP) || xpTiers[xpTiers.length - 1];

  // Animation trigger on component mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateProgress(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Smart scroll detection with direction threshold and debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) return;

      const handleScroll = () => {
        const currentScrollTop = scrollElement.scrollTop;
        const scrollDelta = currentScrollTop - lastScrollTop.current;
        const absScrollDelta = Math.abs(scrollDelta);
        
        if (absScrollDelta < 1) return;
        
        const newDirection = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'idle';
        
        if (scrollDebounceTimer.current) {
          clearTimeout(scrollDebounceTimer.current);
        }
        
        if (isMobile) {
          if (!isManuallyCollapsed) {
            if (newDirection === 'down' && currentScrollTop > 10) {
              setIsCollapsed(true);
            } else if (newDirection === 'up' && currentScrollTop < 50) {
              setIsCollapsed(false);
            }
          }
        } else {
          if (!isManuallyCollapsed) {
            if (newDirection === 'down' && currentScrollTop > 5) {
              setIsCollapsed(true);
            } else if (newDirection === 'up' && currentScrollTop < 20) {
              setIsCollapsed(false);
            }
          }
        }
        
        lastScrollTop.current = currentScrollTop;
      };

      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (scrollDebounceTimer.current) clearTimeout(scrollDebounceTimer.current);
      if (directionChangeTimer.current) clearTimeout(directionChangeTimer.current);
    };
  }, [isManuallyCollapsed]);

  // Handle manual toggle with override
  const handleToggleCollapse = () => {
    const newManualState = !isManuallyCollapsed;
    const newCollapseState = !isCollapsed;
    
    setIsManuallyCollapsed(newManualState);
    setIsCollapsed(newCollapseState);
    
    if (!newCollapseState && newManualState) {
      directionChangeTimer.current = setTimeout(() => {
        setIsManuallyCollapsed(false);
      }, 2000);
    }
  };

  // Trigger celebration on level up (mock for now)
  useEffect(() => {
    if (totalXP >= nextMilestone && !showCelebration) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [totalXP, nextMilestone, showCelebration]);

  // Helper function to get filtered achievements
  const getFilteredAchievements = (achievements: Achievement[], category: string) => {
    let filtered = achievements;
    
    switch (activeFilter) {
      case 'unlocked':
        filtered = achievements.filter(a => a.isEarned);
        break;
      case 'locked':
        filtered = achievements.filter(a => !a.isEarned);
        break;
      case 'exploration':
        filtered = category === 'exploration' ? achievements : [];
        break;
      case 'skill':
        filtered = category === 'skill' ? achievements : [];
        break;
      case 'all':
      default:
        filtered = achievements;
        break;
    }
    
    return filtered;
  };

  // Helper function to calculate progress percentage and get smart nudges
  const getAchievementProgress = (achievement: Achievement) => {
    if (achievement.isEarned) return { percentage: 100, nudgeText: null };
    
    if (achievement.progress?.includes('/')) {
      const [current, total] = achievement.progress.split('/').map(s => parseInt(s.trim()));
      if (!isNaN(current) && !isNaN(total) && total > 0) {
        const percentage = (current / total) * 100;
        const remaining = total - current;
        
        let nudgeText = null;
        if (percentage >= 80 && percentage < 100) {
          switch (achievement.title) {
            case "Top 100 Conqueror":
              nudgeText = `${remaining} more Top 100 course${remaining > 1 ? 's' : ''} to unlock!`;
              break;
            case "Regional Master":
              nudgeText = `${remaining} more course${remaining > 1 ? 's' : ''} to complete the region!`;
              break;
            case "Eagle Collector":
              nudgeText = `${remaining} more eagle${remaining > 1 ? 's' : ''} to collect!`;
              break;
            case "Club Loyalist":
              nudgeText = `${remaining} more round${remaining > 1 ? 's' : ''} at your home club!`;
              break;
            default:
              nudgeText = `${remaining} more to unlock!`;
          }
        }
        
        return { percentage, nudgeText };
      }
    }
    
    return { percentage: 0, nudgeText: null };
  };

  // Get most recently unlocked achievement
  const getMostRecentAchievement = () => {
    const allAchievements = [...explorationAchievements, ...skillAchievements];
    const unlockedAchievements = allAchievements.filter(a => a.isEarned && a.dateEarned);
    
    if (unlockedAchievements.length === 0) return null;
    
    unlockedAchievements.sort((a, b) => {
      const dateA = new Date(a.dateEarned!);
      const dateB = new Date(b.dateEarned!);
      return dateB.getTime() - dateA.getTime();
    });
    
    return unlockedAchievements[0];
  };

  // Helper function to get achievement badge image for featured display
  const getFeaturedAchievementIcon = (achievement: Achievement) => {
    switch (achievement.title) {
      case "20 Club":
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className="w-48 h-48" />;
      case "50 Club":
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className="w-48 h-48" />;
      case "100 Century Club":
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className="w-48 h-48" />;
      default:
        return (
          <div className="w-48 h-48 text-8xl flex items-center justify-center drop-shadow-lg">
            {achievement.emoji}
          </div>
        );
    }
  };

  // Helper function to get achievement badge image
  const getAchievementIcon = (achievement: Achievement) => {
    switch (achievement.title) {
      case "20 Club":
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "50 Club":
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "100 Century Club":
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      default:
        return (
          <div className={`
            text-4xl transition-all duration-200 
            ${achievement.isEarned 
              ? 'grayscale-0 opacity-100 drop-shadow-lg' 
              : 'grayscale opacity-60'
            }
          `}>
            {achievement.emoji}
          </div>
        );
    }
  };

  // Exploration & Travel Achievements
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🏌️",
      isEarned: true,
      description: "Play your first 20 golf courses. Welcome to the clubhouse!",
      xp: 200,
      isRepeatable: false,
      progress: "20 / 20 courses",
      dateEarned: "January 15, 2024"
    },
    {
      title: "50 Club",
      emoji: "⭐",
      isEarned: true,
      description: "Reach the milestone of 50 courses played. You're getting serious!",
      xp: 300,
      isRepeatable: false,
      progress: "50 / 50 courses",
      dateEarned: "November 8, 2023"
    },
    {
      title: "100 Century Club",
      emoji: "💯",
      isEarned: false,
      description: "Join the exclusive 100 courses club. True dedication to the game!",
      xp: 500,
      isRepeatable: false,
      progress: "78 / 100 courses",
      unlockHint: "Continue exploring new courses and add them to your tracker. You're getting close!"
    }
  ];

  // Skill & Performance Achievements
  const skillAchievements: Achievement[] = [
    {
      title: "Single-Figure Handicap",
      emoji: "🏆",
      isEarned: false,
      description: "Achieve a single-digit handicap (0-9). A mark of consistent, skilled play.",
      xp: 250,
      isRepeatable: false,
      progress: "Current: 12.3",
      unlockHint: "Keep improving your scoring consistency. Play more rounds and work on course management."
    },
    {
      title: "First Eagle",
      emoji: "🦅",
      isEarned: true,
      description: "Score your first eagle (2 under par). A memorable milestone!",
      xp: 100,
      isRepeatable: false,
      progress: "Completed",
      dateEarned: "January 22, 2024"
    }
  ];

  const mostRecentAchievement = getMostRecentAchievement();

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`${isMobile ? 'p-4 pb-2' : 'p-6 pb-4'} flex-shrink-0`}>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-foreground`}>
              Achievements
            </h1>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mt-1`}>
              Defining your game through achievement
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>
              {userProfilePhotoUrl ? (
                <img 
                  src={userProfilePhotoUrl} 
                  alt={userDisplayName} 
                  className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-full object-cover`}
                />
              ) : (
                userDisplayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-left">
              <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>{userDisplayName}</h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {userHandicap ? `${typeof userHandicap === 'number' ? userHandicap.toFixed(1) : userHandicap} Handicap` : 'No handicap set'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain touch-pan-y"
        style={{ 
          scrollbarWidth: 'thin',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehaviorY: 'contain'
        }}
      >
        {/* XP Progress Section */}
        <div className={`sticky top-0 z-10 bg-card/95 backdrop-blur-sm transition-all duration-400 ease-in-out ${
          isCollapsed 
            ? isMobile ? 'px-4 py-2' : 'px-6 py-3' 
            : isMobile ? 'px-4 pb-3' : 'px-6 pb-4'
        }`}>
          {isCollapsed ? (
            <div className={`flex items-center justify-between ${
              isMobile ? 'p-2 max-h-[52px]' : 'p-3'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`relative ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
                  <svg className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} transform -rotate-90`} viewBox="0 0 32 32">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      className="text-gray-300 dark:text-gray-600"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke={nextTier.color}
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={`${14 * 2 * Math.PI}`}
                      strokeDashoffset={`${14 * 2 * Math.PI * (1 - progressPercentage / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <Trophy className={`absolute inset-0 m-auto text-muted-foreground ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </div>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                  {totalXP.toLocaleString()} XP | {progressPercentage.toFixed(0)}% to {nextTier.name}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCollapse}
                className={`p-1 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}
              >
                <ChevronDown className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
              </Button>
            </div>
          ) : (
            <div className={`relative overflow-hidden ${
              isMobile ? 'p-3' : 'p-6'
            }`}>
              {isMobile ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <div className="text-xl font-bold text-foreground flex items-center justify-center gap-2 mb-1">
                        {totalXP.toLocaleString()} XP
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleCollapse}
                      className="p-1 h-6 w-6"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">XP Progress</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                          {totalXP.toLocaleString()} XP
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleCollapse}
                        className="p-1 h-8 w-8"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Featured Most Recent Achievement */}
        {mostRecentAchievement && (
          <div className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
            <div className="relative">
              <div className="p-8 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative animate-scale-in">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative drop-shadow-2xl hover:scale-105 transition-transform duration-300">
                      {getFeaturedAchievementIcon(mostRecentAchievement)}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 animate-fade-in">
                    {mostRecentAchievement.title}
                  </h3>
                  
                  <div className="font-bold text-lg text-blue-500 animate-scale-in">
                    +{mostRecentAchievement.xp} XP
                  </div>
                  
                  <p className="text-sm text-muted-foreground animate-fade-in">
                    Unlocked {mostRecentAchievement.dateEarned}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
          {isMobile ? (
            <div className="space-y-2">
              <div className="flex gap-1 w-full">
                {['all', 'unlocked', 'locked'].map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter as typeof activeFilter)}
                    className={`
                      capitalize transition-all duration-200 text-xs h-8 flex-1
                      ${activeFilter === filter 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'hover:bg-muted/80'
                      }
                    `}
                  >
                    {filter === 'all' ? 'All' : 
                     filter === 'unlocked' ? 'Unlocked' :
                     'Locked'}
                  </Button>
                ))}
              </div>
              <div className="flex gap-1 w-full">
                {['exploration', 'skill'].map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter as typeof activeFilter)}
                    className={`
                      capitalize transition-all duration-200 text-xs h-8 flex-1
                      ${activeFilter === filter 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'hover:bg-muted/80'
                      }
                    `}
                  >
                    {filter === 'exploration' ? 'Exploration' : 'Skill-Based'}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {['all', 'unlocked', 'locked', 'exploration', 'skill'].map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter as typeof activeFilter)}
                  className={`
                    capitalize transition-all duration-200 hover:scale-105
                    ${activeFilter === filter 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-muted/80'
                    }
                  `}
                >
                   {filter === 'all' ? 'All Achievements' : 
                    filter === 'unlocked' ? 'Unlocked' :
                    filter === 'locked' ? 'Locked' :
                   filter === 'exploration' ? 'Experience & Exploration' :
                   'Skill-Based'}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Experience & Exploration Achievements Section */}
        {(activeFilter === 'all' || activeFilter === 'exploration') && getFilteredAchievements(explorationAchievements, 'exploration').length > 0 && (
          <div className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
            <div className="p-6">
              <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                  Experience & Exploration Achievements
                </h3>
              </div>
              
              <div className={`grid grid-cols-3 ${isMobile ? 'gap-2' : 'gap-6'}`}>
                {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement) => {
                  const { percentage, nudgeText } = getAchievementProgress(achievement);
                  const isNearUnlock = percentage >= 80 && percentage < 100;
                  
                  return (
                    <div key={achievement.title} className="relative">
                      <div
                        className={`
                          transition-all duration-200 hover:scale-105 cursor-pointer 
                          ${isMobile ? 'p-1 flex flex-col items-center text-center space-y-1' : 'p-4 flex flex-col items-center text-center space-y-3'}
                        `}
                        onClick={() => {
                          setSelectedAchievement({
                            id: achievement.title,
                            name: achievement.title,
                            xp: achievement.xp,
                            unlocked: achievement.isEarned,
                            description: achievement.description,
                            unlockHint: achievement.unlockHint,
                            progress: achievement.progress,
                            dateEarned: achievement.dateEarned,
                            isRepeatable: achievement.isRepeatable
                          });
                          setShowAchievementDetailModal(true);
                        }}
                      >
                        <div className="flex justify-center items-center">
                          <div className={`transition-all duration-200 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                            {getAchievementIcon(achievement)}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
                            {achievement.title.toUpperCase()}
                          </h4>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${achievement.isEarned ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                            +{achievement.xp} XP
                          </p>
                        </div>
                        
                         {nudgeText && (
                           <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full border border-orange-300 dark:border-orange-700">
                             <p className="text-xs font-medium text-orange-700 dark:text-orange-300 leading-tight">
                               🎯 {nudgeText}
                             </p>
                           </div>
                         )}
                       </div>
                     
                     {isNearUnlock && (
                       <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                     )}
                   </div>
                 );
               })}
              </div>
            </div>
          </div>
        )}

        {/* Skill & Performance Achievements Section */}
        {(activeFilter === 'all' || activeFilter === 'skill') && getFilteredAchievements(skillAchievements, 'skill').length > 0 && (
          <div className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
            <div className="p-6">
              <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                  Skill & Performance Achievements
                </h3>
              </div>
              
              <div className={`grid grid-cols-3 ${isMobile ? 'gap-2' : 'gap-6'}`}>
                {getFilteredAchievements(skillAchievements, 'skill').map((achievement) => {
                  const { percentage, nudgeText } = getAchievementProgress(achievement);
                  const isNearUnlock = percentage >= 80 && percentage < 100;
                  
                  return (
                    <div key={achievement.title} className="relative">
                      <div
                        className={`
                          transition-all duration-200 hover:scale-105 cursor-pointer 
                          ${isMobile ? 'p-1 flex flex-col items-center text-center space-y-1' : 'p-4 flex flex-col items-center text-center space-y-3'}
                        `}
                        onClick={() => {
                          setSelectedAchievement({
                            id: achievement.title,
                            name: achievement.title,
                            xp: achievement.xp,
                            unlocked: achievement.isEarned,
                            description: achievement.description,
                            unlockHint: achievement.unlockHint,
                            progress: achievement.progress,
                            dateEarned: achievement.dateEarned,
                            isRepeatable: achievement.isRepeatable
                          });
                          setShowAchievementDetailModal(true);
                        }}
                      >
                        <div className="flex justify-center items-center">
                          <div className={`transition-all duration-200 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                            {getAchievementIcon(achievement)}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
                            {achievement.title.toUpperCase()}
                          </h4>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${achievement.isEarned ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                            +{achievement.xp} XP
                          </p>
                        </div>
                        
                         {nudgeText && (
                           <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full border border-orange-300 dark:border-orange-700">
                             <p className="text-xs font-medium text-orange-700 dark:text-orange-300 leading-tight">
                               🎯 {nudgeText}
                             </p>
                           </div>
                         )}
                       </div>
                     
                     {isNearUnlock && (
                       <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                     )}
                   </div>
                 );
               })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        isOpen={showAchievementDetailModal}
        onClose={() => setShowAchievementDetailModal(false)}
        achievement={selectedAchievement}
      />
    </div>
  );
};

export default AchievementsTabPage;