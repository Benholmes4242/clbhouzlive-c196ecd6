import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";

// Achievement badge imports - using user's uploaded image
// import club300Badge from '@/assets/achievements/300-club-champion.png';

interface ClbhouzAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
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
}

const ClbhouzAchievementsModal: React.FC<ClbhouzAchievementsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userDisplayName = "User",
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser = true
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked' | 'exploration' | 'skill'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Clear any cached references by forcing recompilation
  
  // Mock data for now - replace with actual badge system later
  const totalXP = 2500;
  const nextMilestone = 10000;
  const progressPercentage = (totalXP / nextMilestone) * 100;
  
  // XP Ring tiers
  const xpTiers = [
    { name: "Blue Ring", color: "#4682B4", minXP: 10000, maxXP: 19999 },
    { name: "Green Ring", color: "#6e9277", minXP: 20000, maxXP: 29999 },
    { name: "Silver Ring", color: "#C0C0C0", minXP: 30000, maxXP: 39999 },
    { name: "Gold Ring", color: "#FFD700", minXP: 40000, maxXP: 49999 }
  ];
  
  const currentTier = xpTiers.find(tier => totalXP >= tier.minXP && totalXP <= tier.maxXP);
  const nextTier = xpTiers.find(tier => tier.minXP > totalXP) || xpTiers[xpTiers.length - 1];

  // Animate progress on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateProgress(true), 500);
      return () => clearTimeout(timer);
    } else {
      setAnimateProgress(false);
    }
  }, [isOpen]);

  // Handle scroll for sticky behavior with manual override
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      // Auto-collapse at 150px scroll, but respect manual state
      if (!isManuallyCollapsed) {
        setIsCollapsed(scrollTop > 150);
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [isManuallyCollapsed]);

  // Handle manual toggle
  const handleToggleCollapse = () => {
    setIsManuallyCollapsed(!isManuallyCollapsed);
    setIsCollapsed(!isCollapsed);
  };

  // Reset manual state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsManuallyCollapsed(false);
      setIsCollapsed(false);
    }
  }, [isOpen]);

  // Trigger celebration on level up (mock for now)
  useEffect(() => {
    if (totalXP >= nextMilestone && !showCelebration) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [totalXP, nextMilestone, showCelebration]);

  // Filter achievements based on active filter
  const getFilteredAchievements = (achievements: Achievement[], type: 'exploration' | 'skill') => {
    let filtered = achievements;
    
    switch (activeFilter) {
      case 'unlocked':
        filtered = achievements.filter(achievement => achievement.isEarned);
        break;
      case 'locked':
        filtered = achievements.filter(achievement => !achievement.isEarned);
        break;
      case 'exploration':
        filtered = type === 'exploration' ? achievements : [];
        break;
      case 'skill':
        filtered = type === 'skill' ? achievements : [];
        break;
      case 'all':
      default:
        filtered = achievements;
        break;
    }
    
    return filtered;
  };

  // Helper function to get achievement badge image
  const getAchievementIcon = (achievement: Achievement) => {
    // Use custom badges for specific achievements regardless of earned status
    switch (achievement.title) {
      case "20 Club":
        return <img src="/lovable-uploads/a33df9b4-0089-43ca-913d-132fc5b11cc3.png" alt="20 Club Badge" className="w-28 h-28" />;
      case "50 Club":
        return <img src="/lovable-uploads/c1ba04e8-7aed-40e6-948b-0b65fdc932b2.png" alt="50 Club Badge" className="w-28 h-28" />;
      case "100 Century Club":
        return <img src="/lovable-uploads/91e26115-098d-4b21-9b29-7e1800fe52bd.png" alt="100 Century Club Badge" className="w-28 h-28" />;
      case "200 Clubhouse Elite":
        return <img src="/lovable-uploads/b566e805-826b-4005-b9d1-c5bdc87786b1.png" alt="200 Clubhouse Elite Badge" className="w-32 h-32" />;
      case "300 Club Champion":
        return <img src="/lovable-uploads/03c915d7-c037-4b15-92c3-745a709da230.png" alt="300 Club Champion Badge" className="w-32 h-32" />;
      case "European Explorer":
        return <img src="/lovable-uploads/24422ab1-3322-4f51-801b-8ae8e80c95d7.png" alt="European Explorer Badge" className="w-24 h-24" />;
      case "UK & Ireland Explorer":
        return <img src="/lovable-uploads/54fecf12-83df-48be-b433-d227be70278d.png" alt="UK & Ireland Explorer Badge" className="w-24 h-24" />;
      case "USA Explorer":
        return <img src="/lovable-uploads/ad7f9c0b-b395-4b96-b059-63ebab11bd4f.png" alt="USA Explorer Badge" className="w-24 h-24" />;
      case "World Explorer":
        return <img src="/lovable-uploads/5b02f0bf-9891-4439-971c-4d3cb7a37355.png" alt="World Explorer Badge" className="w-24 h-24" />;
      default:
        // For other achievements, show emoji if earned, lock if not
        return achievement.isEarned ? achievement.emoji : '🔒';
    }
  };

  // Skill & Performance Achievements
  const skillAchievements: Achievement[] = [
    {
      title: "Single-Figure Handicap",
      emoji: "🏆",
      isEarned: false,
      description: "Achieve a single-digit handicap (0-9). A mark of consistent, skilled play.",
      xp: 250,
      isRepeatable: false,
      progress: "Current: 12.3"
    },
    {
      title: "Plus Handicap Player",
      emoji: "⭐",
      isEarned: false,
      description: "Reach plus handicap status. Elite level golf achievement.",
      xp: 500,
      isRepeatable: false,
      progress: "Target: +0.0"
    },
    {
      title: "Personal Best Round",
      emoji: "📈",
      isEarned: true,
      description: "Shoot your lowest score ever. Keep pushing your limits!",
      xp: 100,
      isRepeatable: true,
      progress: "Best: 78"
    },
    {
      title: "Under Par Round",
      emoji: "🎯",
      isEarned: true,
      description: "Complete a round under par. Exceptional performance!",
      xp: 150,
      isRepeatable: true,
      progress: "Achieved: 2 times"
    },
    {
      title: "First Eagle",
      emoji: "🦅",
      isEarned: true,
      description: "Score your first eagle (2 under par). A memorable milestone!",
      xp: 100,
      isRepeatable: false,
      progress: "Completed"
    },
    {
      title: "Birdie Blitz",
      emoji: "🐦",
      isEarned: false,
      description: "Score 3 or more birdies in a single round. On fire!",
      xp: 75,
      isRepeatable: true,
      progress: "Best: 2 birdies"
    },
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: false,
      description: "Accumulate 5 total eagles throughout your golf journey.",
      xp: 250,
      isRepeatable: false,
      progress: "2 / 5 eagles"
    },
    {
      title: "Hole-in-One",
      emoji: "🕳️",
      isEarned: false,
      description: "The ultimate golf achievement - ace a hole! Each one counts.",
      xp: 500,
      isRepeatable: true,
      progress: "0 aces"
    },
    {
      title: "Back-to-Back Birdies",
      emoji: "🎪",
      isEarned: false,
      description: "Score consecutive birdies. Momentum is everything!",
      xp: 100,
      isRepeatable: false,
      progress: "Not achieved"
    },
    {
      title: "No Bogey Round",
      emoji: "💯",
      isEarned: false,
      description: "Complete a round without any bogeys. Consistency at its finest.",
      xp: 200,
      isRepeatable: false,
      progress: "Best: 2 bogeys"
    },
    {
      title: "Top 100 Conqueror",
      emoji: "🌟",
      isEarned: false,
      description: "Play 10 of the world's Top 100 golf courses. Elite course collection!",
      xp: 400,
      isRepeatable: false,
      progress: "3 / 10 courses"
    },
    {
      title: "Regional Master",
      emoji: "🗺️",
      isEarned: false,
      description: "Complete all courses in a selected region. Local expertise achieved!",
      xp: 300,
      isRepeatable: false,
      progress: "Scotland: 8/12"
    },
    {
      title: "International Golfer",
      emoji: "✈️",
      isEarned: true,
      description: "Play golf in 3 or more countries. Global golf adventurer!",
      xp: 150,
      isRepeatable: false,
      progress: "4 countries"
    },
    {
      title: "Sunrise to Sunset",
      emoji: "☀️",
      isEarned: false,
      description: "Play 2 rounds in a single day. True dedication to the game!",
      xp: 125,
      isRepeatable: true,
      progress: "Not achieved"
    },
    {
      title: "Club Loyalist",
      emoji: "🏠",
      isEarned: false,
      description: "Play 50 rounds at your home club. True club spirit and loyalty!",
      xp: 350,
      isRepeatable: false,
      progress: "23 / 50 rounds"
    }
  ];

  // Experience & Exploration Achievements
  const explorationAchievements: Achievement[] = [
    // Top 100 Courses Played
    {
      title: "20 Club",
      emoji: "🥉",
      isEarned: false,
      description: "Play 20 Top 100 Courses. Beginning your journey through golf's elite venues.",
      xp: 200,
      isRepeatable: false,
      progress: "3 / 20 courses"
    },
    {
      title: "50 Club",
      emoji: "🥈",
      isEarned: false,
      description: "Play 50 Top 100 Courses. Serious commitment to experiencing golf's finest.",
      xp: 500,
      isRepeatable: false,
      progress: "3 / 50 courses"
    },
    {
      title: "100 Century Club",
      emoji: "🥇",
      isEarned: false,
      description: "Play 100 Top 100 Courses. A monumental achievement in golf exploration.",
      xp: 1000,
      isRepeatable: false,
      progress: "3 / 100 courses"
    },
    {
      title: "200 Clubhouse Elite",
      emoji: "💎",
      isEarned: false,
      description: "Play 200 Top Golf Courses. Among the world's most accomplished golfers.",
      xp: 1500,
      isRepeatable: false,
      progress: "3 / 200 courses"
    },
    {
      title: "300 Club Champion",
      emoji: "👑",
      isEarned: false,
      description: "Play 300 Top Courses Worldwide. Ultimate golf exploration mastery.",
      xp: 2000,
      isRepeatable: false,
      progress: "3 / 300 courses"
    },
    {
      title: "European Explorer",
      emoji: "🇪🇺",
      isEarned: false,
      description: "Play courses across 5 different European countries",
      xp: 2500,
      isRepeatable: false,
      progress: "2 / 5 countries"
    },
    {
      title: "UK & Ireland Explorer",
      emoji: "🇬🇧",
      isEarned: true,
      description: "Play courses in both the UK and Ireland",
      xp: 2000,
      isRepeatable: false,
      progress: "2 / 2 countries"
    },
    {
      title: "USA Explorer",
      emoji: "🇺🇸",
      isEarned: false,
      description: "Play courses across 10 different US states",
      xp: 3000,
      isRepeatable: false,
      progress: "1 / 10 states"
    },
    {
      title: "World Explorer",
      emoji: "🌍",
      isEarned: false,
      description: "Play courses on 4 different continents",
      xp: 5000,
      isRepeatable: false,
      progress: "1 / 4 continents"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {isCurrentUser ? "Your clbhouz achievements" : `${userDisplayName}'s clbhouz achievements`}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            See how far your game can take you
          </p>
        </DialogHeader>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y"
          style={{ 
            scrollbarWidth: 'thin',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* User Profile Section */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                {userProfilePhotoUrl ? (
                  <img 
                    src={userProfilePhotoUrl} 
                    alt={`${userDisplayName}'s profile`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-semibold">{userDisplayName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{userDisplayName}</h3>
                  <p className="text-sm text-muted-foreground">
                     {userHandicap ? `Handicap: ${userHandicap}` : 'No handicap set'}
                   </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky/Collapsible XP Ring Section */}
          <div className={`sticky top-0 z-10 bg-background/95 backdrop-blur-sm transition-all duration-300 ${
            isCollapsed ? 'px-6 py-2' : 'px-6 pb-4'
          }`}>
            {isCollapsed ? (
              /* Collapsed Mini View */
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
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
                    <Trophy className="absolute inset-0 w-4 h-4 m-auto text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium">{totalXP.toLocaleString()} XP | {progressPercentage.toFixed(0)}% to {nextTier.name}</div>
                </div>
                <div className="flex-1 mx-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: animateProgress ? `${progressPercentage}%` : '0%',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    Next: {nextTier.name} at {nextMilestone.toLocaleString()} XP
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleCollapse}
                    className="p-1 h-6 w-6"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Full XP Ring Section */
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-blue-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 relative overflow-hidden">
                {/* Celebration Animation Overlay */}
                {showCelebration && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl animate-pulse">
                    <div className="text-6xl animate-bounce">🎉</div>
                  </div>
                )}
                
                {/* Header with XP and Collapse Button */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">XP Progress</h3>
                    <p className="text-sm text-muted-foreground">Keep playing to unlock new rings!</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Sparkles className={`w-5 h-5 ${nextTier ? 'text-yellow-500 animate-pulse' : 'text-muted-foreground'}`} />
                        {totalXP.toLocaleString()} XP
                      </div>
                      <div className="text-xs text-muted-foreground">Current Progress</div>
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
                
                {/* Main Progress Ring and Info */}
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-12">
                    {/* Enhanced Progress Ring */}
                    <div className="relative flex-shrink-0">
                      <div className="relative w-40 h-40">
                        {/* Glow effect for next goal */}
                        <div className={`absolute inset-0 rounded-full ${nextTier ? 'animate-pulse' : ''}`} 
                             style={{ 
                               boxShadow: nextTier ? `0 0 30px ${nextTier.color}40` : 'none'
                             }} />
                        
                        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                          {/* Background circle */}
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-gray-300 dark:text-gray-600"
                          />
                          {/* Animated progress circle */}
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke={`url(#progressGradient)`}
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={`${70 * 2 * Math.PI}`}
                            strokeDashoffset={animateProgress ? 
                              `${70 * 2 * Math.PI * (1 - progressPercentage / 100)}` : 
                              `${70 * 2 * Math.PI}`
                            }
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                            style={{
                              filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))'
                            }}
                          />
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3B82F6" />
                              <stop offset="50%" stopColor="#8B5CF6" />
                              <stop offset="100%" stopColor="#06B6D4" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-2xl font-bold text-foreground mb-1">
                            {(nextMilestone - totalXP).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground text-center mb-2">
                            XP to next ring
                          </div>
                          <div className="text-xs font-medium" style={{ color: nextTier.color }}>
                            {Math.round(progressPercentage)}% Complete
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ring Info */}
                    <div className="w-64 space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-xl text-muted-foreground">
                          {currentTier ? currentTier.name : 'No Ring Achieved'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {currentTier ? 
                            `Congratulations! You've earned the ${currentTier.name}!` :
                            `Reach ${nextMilestone.toLocaleString()} XP to unlock your first ring`
                          }
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: nextTier.color }}>
                          <Trophy className="w-4 h-4" />
                          Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out relative"
                      style={{ 
                        width: animateProgress ? `${progressPercentage}%` : '0%',
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)'
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Ring Tier Display */}
                <div className="w-full">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">Ring Progression</h4>
                  <div className="flex justify-between items-center gap-2">
                    {xpTiers.map((tier, index) => {
                      const isActive = totalXP >= tier.minXP;
                      const isCurrent = currentTier?.name === tier.name;
                      const isNext = nextTier?.name === tier.name;
                      
                      return (
                        <div key={tier.name} className="flex flex-col items-center flex-1 relative">
                          {/* Connection line */}
                          {index < xpTiers.length - 1 && (
                            <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-300 dark:bg-gray-600" />
                          )}
                          
                          <div 
                            className={`relative w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all mb-2 ${
                              isCurrent ? 'animate-pulse scale-110' : ''
                            } ${isNext ? 'animate-pulse' : ''}`}
                            style={{
                              borderColor: tier.color,
                              backgroundColor: isActive ? tier.color + '40' : tier.color + '20',
                              boxShadow: isCurrent ? `0 0 20px ${tier.color}60` : isNext ? `0 0 15px ${tier.color}40` : 'none'
                            }}
                          >
                            {isActive && <Trophy className="w-6 h-6" style={{ color: tier.color }} />}
                            {isNext && !isActive && <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />}
                          </div>
                        
                          <div className="text-center">
                            <h5 className={`font-semibold text-xs ${isCurrent ? 'animate-pulse' : ''}`} 
                                style={{ color: isActive ? tier.color : '#9CA3AF' }}>
                              {tier.name}
                            </h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tier.minXP.toLocaleString()}-{tier.maxXP.toLocaleString()} XP
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Achievement Filter Tabs */}
          <div className="px-6 pb-6">
            <div className="relative">
              {/* Desktop: Fixed-width tabs */}
              <div className="hidden md:flex justify-center gap-2">
                {[
                  { key: 'all', label: 'All Achievements' },
                  { key: 'unlocked', label: 'Unlocked Only' },
                  { key: 'locked', label: 'Locked Only' },
                  { key: 'exploration', label: 'Experience & Exploration' },
                  { key: 'skill', label: 'Skill-Based' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeFilter === tab.key
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mobile: Scrollable tabs */}
              <div className="md:hidden overflow-x-auto">
                <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'unlocked', label: 'Unlocked' },
                    { key: 'locked', label: 'Locked' },
                    { key: 'exploration', label: 'Exploration' },
                    { key: 'skill', label: 'Skill-Based' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        activeFilter === tab.key
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Exploration Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'exploration') && getFilteredAchievements(explorationAchievements, 'exploration').length > 0 && (
            <div className="px-6 pb-8">
              {/* Card Container with Visual Grouping */}
              <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10 rounded-xl p-6 border border-blue-200/30 dark:border-blue-800/30 shadow-sm">
                {/* Section Header with Icon */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <span className="text-xl">🏞️</span>
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
                    Experience & Exploration Achievements
                  </h3>
                </div>
                
                <TooltipProvider>
                  <div className="grid grid-cols-3 gap-4">
                    {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement) => (
                      <Tooltip key={achievement.title}>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              border rounded-lg p-4 transition-all duration-200 hover:scale-105 cursor-pointer flex items-center gap-3 bg-white/60 dark:bg-gray-900/30
                              ${achievement.isEarned 
                                ? 'border-blue-300 dark:border-blue-700 shadow-md shadow-blue-100 dark:shadow-blue-900/20' 
                                : 'border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700'
                              }
                            `}
                            onClick={() => setSelectedAchievement(achievement)}
                          >
                            <div className="flex-shrink-0 flex justify-center items-center min-w-0">
                              {getAchievementIcon(achievement)}
                            </div>
                            <div className="flex-1 text-center">
                              <h4 className="font-medium text-sm mb-1">
                                {achievement.title}
                              </h4>
                              <p className={`text-xs ${achievement.isEarned ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                                +{achievement.xp} XP {achievement.isRepeatable ? "(R)" : ""}
                              </p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <div className="text-center">
                            <h4 className="font-semibold mb-1">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {achievement.description}
                            </p>
                            <p className="text-xs font-medium mb-1">
                              +{achievement.xp} XP {achievement.isRepeatable ? "(Repeatable)" : "(One-time)"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Progress: {achievement.progress}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Skill & Performance Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'skill') && getFilteredAchievements(skillAchievements, 'skill').length > 0 && (
            <div className="px-6 pb-8">
              {/* Card Container with Visual Grouping */}
              <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10 rounded-xl p-6 border border-green-200/30 dark:border-green-800/30 shadow-sm">
                {/* Section Header with Icon */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <span className="text-xl">💪</span>
                  </div>
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                    Skill & Performance Achievements
                  </h3>
                </div>
                
                <TooltipProvider>
                  <div className="grid grid-cols-3 gap-4">
                    {getFilteredAchievements(skillAchievements, 'skill').map((achievement) => (
                      <Tooltip key={achievement.title}>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              border rounded-lg p-4 transition-all duration-200 hover:scale-105 cursor-pointer flex items-center gap-3 bg-white/60 dark:bg-gray-900/30
                              ${achievement.isEarned 
                                ? 'border-green-300 dark:border-green-700 shadow-md shadow-green-100 dark:shadow-green-900/20' 
                                : 'border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700'
                              }
                            `}
                            onClick={() => setSelectedAchievement(achievement)}
                          >
                            <div className="flex-shrink-0 flex justify-center items-center min-w-0">
                              {getAchievementIcon(achievement)}
                            </div>
                            <div className="flex-1 text-center">
                              <h4 className="font-medium text-sm mb-1">
                                {achievement.title}
                              </h4>
                              <p className={`text-xs ${achievement.isEarned ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                +{achievement.xp} XP {achievement.isRepeatable ? "(R)" : ""}
                              </p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <div className="text-center">
                            <h4 className="font-semibold mb-1">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {achievement.description}
                            </p>
                            <p className="text-xs font-medium mb-1">
                              +{achievement.xp} XP {achievement.isRepeatable ? "(Repeatable)" : "(One-time)"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Progress: {achievement.progress}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          )}

        </div>

        {/* Mobile Achievement Details Dialog */}
        {selectedAchievement && (
          <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle className="text-center flex items-center justify-center gap-2">
                  <span className="text-2xl flex items-center">
                    {getAchievementIcon(selectedAchievement)}
                  </span>
                  {selectedAchievement.title}
                </DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedAchievement.description}
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    +{selectedAchievement.xp} XP {selectedAchievement.isRepeatable ? "(Repeatable)" : "(One-time)"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Progress: {selectedAchievement.progress}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClbhouzAchievementsModal;