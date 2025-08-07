import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  dateEarned?: string;
  unlockHint?: string;
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
  const lastScrollTop = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | 'idle'>('idle');
  const scrollDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const directionChangeTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Clear any cached references by forcing recompilation
  
  // Mock data for now - replace with actual badge system later
  const totalXP = 2500;
  const nextMilestone = 10000;
  const progressPercentage = (totalXP / nextMilestone) * 100;
  
  // XP Tier System
  const xpTiers = [
    { name: "Blue Ring", color: "#3B82F6", minXP: 10000 },
    { name: "Green Ring", color: "#10B981", minXP: 20000 },
    { name: "Silver Ring", color: "#6B7280", minXP: 30000 },
    { name: "Gold Ring", color: "#F59E0B", minXP: 40000 }
  ];
  
  const currentTier = xpTiers.slice().reverse().find(tier => totalXP >= tier.minXP);
  const nextTier = xpTiers.find(tier => totalXP < tier.minXP) || xpTiers[xpTiers.length - 1];

  // Animation trigger when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateProgress(true), 300);
      return () => clearTimeout(timer);
    } else {
      setAnimateProgress(false);
    }
  }, [isOpen]);

  // Smart scroll detection with direction threshold and debouncing
  useEffect(() => {
    if (!isOpen) return;
    
    // Add a small delay to ensure the modal is fully rendered
    const timeoutId = setTimeout(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) return;

      const handleScroll = () => {
        const currentScrollTop = scrollElement.scrollTop;
        const scrollDelta = currentScrollTop - lastScrollTop.current;
        const absScrollDelta = Math.abs(scrollDelta);
        
        // Process any scroll movement for immediate feedback
        if (absScrollDelta < 1) {
          return;
        }
        
        // Determine scroll direction
        const newDirection = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'idle';
        
        // Clear existing timers
        if (scrollDebounceTimer.current) {
          clearTimeout(scrollDebounceTimer.current);
        }
        
        // Update direction and handle state changes
        if (newDirection !== 'idle') {
          scrollDirection.current = newDirection;
          
          // Immediate collapse/expand based on scroll position and direction
          if (!isManuallyCollapsed) {
            if (newDirection === 'down' && currentScrollTop > 50) {
              setIsCollapsed(true);
            } else if (newDirection === 'up' && currentScrollTop < 100) {
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
  }, [isOpen, isManuallyCollapsed]);

  // Handle manual toggle with override
  const handleToggleCollapse = () => {
    const newManualState = !isManuallyCollapsed;
    const newCollapseState = !isCollapsed;
    
    setIsManuallyCollapsed(newManualState);
    setIsCollapsed(newCollapseState);
    
    // If manually expanded, clear direction timer to prevent auto-collapse for a bit
    if (!newCollapseState && newManualState) {
      directionChangeTimer.current = setTimeout(() => {
        setIsManuallyCollapsed(false);
      }, 2000); // Allow 2 seconds of manual control before re-enabling auto
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsManuallyCollapsed(false);
      setIsCollapsed(false);
      lastScrollTop.current = 0;
      scrollDirection.current = 'idle';
      
      // Clear timers
      if (scrollDebounceTimer.current) clearTimeout(scrollDebounceTimer.current);
      if (directionChangeTimer.current) clearTimeout(directionChangeTimer.current);
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
    
    // Parse progress strings to calculate percentages
    if (achievement.progress?.includes('/')) {
      const [current, total] = achievement.progress.split('/').map(s => parseInt(s.trim()));
      if (!isNaN(current) && !isNaN(total) && total > 0) {
        const percentage = (current / total) * 100;
        const remaining = total - current;
        
        // Generate nudge text based on achievement type
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
    
    // Handle specific achievement types with different progress formats
    switch (achievement.title) {
      case "Single-Figure Handicap":
        const currentHandicap = 12.3; // Mock current handicap
        const targetHandicap = 9;
        const percentage = Math.max(0, (currentHandicap - targetHandicap) / currentHandicap * 100);
        const remaining = (currentHandicap - targetHandicap).toFixed(1);
        return {
          percentage: Math.min(95, percentage),
          nudgeText: percentage >= 80 ? `${remaining} strokes off handicap to reach single figures!` : null
        };
      
      case "Birdie Blitz":
        const currentBirdies = 2;
        const targetBirdies = 3;
        const birdiePercentage = (currentBirdies / targetBirdies) * 100;
        return {
          percentage: birdiePercentage,
          nudgeText: birdiePercentage >= 80 ? `1 more birdie in a round to unlock!` : null
        };
      
      case "No Bogey Round":
        const bestBogeys = 2;
        const targetBogeys = 0;
        const bogeyPercentage = Math.max(0, (4 - bestBogeys) / 4 * 100); // Assuming 4 is starting point
        return {
          percentage: bogeyPercentage,
          nudgeText: bogeyPercentage >= 80 ? `Avoid those last ${bestBogeys} bogey${bestBogeys > 1 ? 's' : ''} for a clean round!` : null
        };
      
      default:
        return { percentage: 0, nudgeText: null };
    }
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
        return <img src="/lovable-uploads/3fd34e71-ce84-4f30-b424-3f67637eab11.png" alt="300 Club Champion Badge" className="w-32 h-32" />;
      default:
        // Enhanced emoji display with conditional styling
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
    },
    {
      title: "200 Clubhouse Elite",
      emoji: "🏆",
      isEarned: false,
      description: "Elite status: 200 courses played. Golf course connoisseur level achieved!",
      xp: 1000,
      isRepeatable: false,
      progress: "78 / 200 courses",
      unlockHint: "Keep visiting new courses and documenting your golf journey. This is a long-term goal!"
    },
    {
      title: "300 Club Champion",
      emoji: "👑",
      isEarned: false,
      description: "Legendary achievement: 300 courses played. You're a true golf course explorer!",
      xp: 1500,
      isRepeatable: false,
      progress: "78 / 300 courses",
      unlockHint: "The ultimate goal for golf course enthusiasts. Continue your incredible journey!"
    },
    {
      title: "Britain & Ireland Explorer",
      emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      isEarned: false,
      description: "Complete the Great Britain & Ireland top golf courses list",
      xp: 3000,
      isRepeatable: false,
      progress: "12 / 20 courses",
      unlockHint: "Explore the historic golf courses across England, Scotland, Wales, and Ireland. You're making great progress!"
    },
    {
      title: "European Explorer",
      emoji: "🇪🇺",
      isEarned: false,
      description: "Play courses across 8 different European countries",
      xp: 3000,
      isRepeatable: false,
      progress: "3 / 8 countries",
      unlockHint: "Plan golf trips across Europe. Consider France, Spain, Portugal, Germany, and other European golf destinations."
    },
    {
      title: "Worldwide Explorer",
      emoji: "🌎",
      isEarned: false,
      description: "Play courses on 4 different continents",
      xp: 5000,
      isRepeatable: false,
      progress: "1 / 4 continents",
      unlockHint: "Plan international golf trips to reach different continents. Consider Europe, Asia, or Australia for your next golf adventure."
    },
    {
      title: "USA Explorer",
      emoji: "🇺🇸",
      isEarned: false,
      description: "Play courses across 10 different US states",
      xp: 3000,
      isRepeatable: false,
      progress: "1 / 10 states",
      unlockHint: "Plan golf trips to different US states. Consider popular golf destinations like Florida, California, or Arizona."
    },
    {
      title: "World Explorer",
      emoji: "🌍",
      isEarned: false,
      description: "Play courses on 4 different continents",
      xp: 5000,
      isRepeatable: false,
      progress: "1 / 4 continents",
      unlockHint: "Expand your golf travels internationally. Each continent offers unique golf experiences and challenges."
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
      title: "Plus Handicap Player",
      emoji: "⭐",
      isEarned: false,
      description: "Reach plus handicap status. Elite level golf achievement.",
      xp: 500,
      isRepeatable: false,
      progress: "Target: +0.0",
      unlockHint: "Master all aspects of your game and consistently shoot under par. This requires dedication and practice."
    },
    {
      title: "Personal Best Round",
      emoji: "📈",
      isEarned: true,
      description: "Shoot your lowest score ever. Keep pushing your limits!",
      xp: 100,
      isRepeatable: true,
      progress: "Best: 78",
      dateEarned: "March 15, 2024"
    },
    {
      title: "Under Par Round",
      emoji: "🎯",
      isEarned: true,
      description: "Complete a round under par. Exceptional performance!",
      xp: 150,
      isRepeatable: true,
      progress: "Achieved: 2 times",
      dateEarned: "February 8, 2024"
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
    },
    {
      title: "Birdie Blitz",
      emoji: "🐦",
      isEarned: false,
      description: "Score 3 or more birdies in a single round. On fire!",
      xp: 75,
      isRepeatable: true,
      progress: "Best: 2 birdies",
      unlockHint: "Focus on approach shots and putting. Target par 4s and 5s where birdies are most achievable."
    },
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: false,
      description: "Accumulate 5 total eagles throughout your golf journey.",
      xp: 250,
      isRepeatable: false,
      progress: "2 / 5 eagles",
      unlockHint: "Look for eagle opportunities on par 5s and short par 4s. Aggressive play when the situation is right."
    },
    {
      title: "Hole-in-One",
      emoji: "🕳️",
      isEarned: false,
      description: "The ultimate golf achievement - ace a hole! Each one counts.",
      xp: 500,
      isRepeatable: true,
      progress: "0 aces",
      unlockHint: "Play more par 3s and focus on accuracy. Sometimes luck plays a part, but skill increases your chances."
    },
    {
      title: "Back-to-Back Birdies",
      emoji: "🎪",
      isEarned: false,
      description: "Score consecutive birdies. Momentum is everything!",
      xp: 100,
      isRepeatable: false,
      progress: "Not achieved",
      unlockHint: "Maintain focus and positive momentum after making your first birdie. Stay aggressive but smart."
    },
    {
      title: "No Bogey Round",
      emoji: "💯",
      isEarned: false,
      description: "Complete a round without any bogeys. Consistency at its finest.",
      xp: 200,
      isRepeatable: false,
      progress: "Best: 2 bogeys",
      unlockHint: "Focus on course management over aggressive play. Avoid double bogeys and play within your abilities."
    },
    {
      title: "Top 100 Conqueror",
      emoji: "🌟",
      isEarned: false,
      description: "Play 10 of the world's Top 100 golf courses. Elite course collection!",
      xp: 400,
      isRepeatable: false,
      progress: "3 / 10 courses",
      unlockHint: "Plan golf trips to destinations with multiple Top 100 courses. Research and book tee times in advance."
    },
    {
      title: "Regional Master",
      emoji: "🗺️",
      isEarned: false,
      description: "Complete all courses in a selected region. Local expertise achieved!",
      xp: 300,
      isRepeatable: false,
      progress: "Scotland: 8/12",
      unlockHint: "Continue exploring Scottish courses. Focus on completing the remaining 4 courses in your selected region."
    },
    {
      title: "International Golfer",
      emoji: "✈️",
      isEarned: true,
      description: "Play golf in 3 or more countries. Global golf adventurer!",
      xp: 150,
      isRepeatable: false,
      progress: "4 countries",
      dateEarned: "December 10, 2023"
    },
    {
      title: "Sunrise to Sunset",
      emoji: "☀️",
      isEarned: false,
      description: "Play 2 rounds in a single day. True dedication to the game!",
      xp: 125,
      isRepeatable: true,
      progress: "Not achieved",
      unlockHint: "Book morning and afternoon tee times at the same course. Make sure to stay hydrated and energized."
    },
    {
      title: "Club Loyalist",
      emoji: "🏠",
      isEarned: false,
      description: "Play 50 rounds at your home club. True club spirit and loyalty!",
      xp: 350,
      isRepeatable: false,
      progress: "23 / 50 rounds",
      unlockHint: "Continue playing regularly at your home club. Join club events and competitions to reach this milestone faster."
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 flex flex-col bg-gradient-to-br from-green-50/30 via-blue-50/20 to-green-50/30 dark:from-green-950/10 dark:via-blue-950/10 dark:to-green-950/10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.02) 0%, transparent 50%)
          `
        }}
      >
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {isCurrentUser ? "Your clbhouz achievements" : `${userDisplayName}'s clbhouz achievements`}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            See how far your game can take you
          </DialogDescription>
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-lg">
                  {userProfilePhotoUrl ? (
                    <img 
                      src={userProfilePhotoUrl} 
                      alt={userDisplayName} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    userDisplayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{userDisplayName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {userHandicap ? `Handicap: ${userHandicap}` : 'No handicap set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible XP Progress Header with Smooth Animations */}
          <div className={`sticky top-0 z-10 bg-background/95 backdrop-blur-sm transition-all duration-400 ease-in-out ${
            isCollapsed ? 'px-6 py-3' : 'px-6 pb-4'
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
                    Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP
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
                            {(nextTier.minXP - totalXP).toLocaleString()}
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
                            `Reach ${nextTier.minXP.toLocaleString()} XP to unlock your first ring`
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
                        <div key={tier.name} className="flex-1 text-center">
                          <div className={`
                            w-16 h-16 mx-auto mb-2 rounded-full border-4 transition-all duration-500 flex items-center justify-center
                            ${isActive 
                              ? `bg-gradient-to-br from-${tier.color}/20 to-${tier.color}/40 border-current shadow-lg` 
                              : isNext 
                                ? 'border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 animate-pulse'
                                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                            }
                          `}
                          style={{ 
                            color: isActive ? tier.color : '#9CA3AF',
                            borderColor: isActive ? tier.color : undefined
                          }}
                          >
                            <Trophy className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                          </div>
                          <div className="text-xs font-medium mb-1" style={{ color: isActive ? tier.color : '#6B7280' }}>
                            {tier.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tier.minXP.toLocaleString()} XP
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="px-6 pb-6">
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
                   filter === 'unlocked' ? 'Unlocked Only' :
                   filter === 'locked' ? 'Locked Only' :
                   filter === 'exploration' ? 'Experience & Exploration' :
                   'Skill-Based'}
                </Button>
              ))}
            </div>
          </div>

          {/* Experience & Exploration Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'exploration') && getFilteredAchievements(explorationAchievements, 'exploration').length > 0 && (
            <div className="px-6 pb-8">
              {/* Card Container with Visual Grouping */}
              <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/60 dark:from-blue-950/20 dark:to-cyan-950/15 rounded-2xl p-6 border border-blue-200/40 dark:border-blue-800/40 shadow-xl backdrop-blur-sm">
                {/* Section Header with Icon */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <span className="text-xl">🧭</span>
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
                    Experience & Exploration Achievements
                  </h3>
                </div>
                
                <TooltipProvider>
                  <div className="grid grid-cols-3 gap-4">
                    {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement) => {
                      const { percentage, nudgeText } = getAchievementProgress(achievement);
                      const isNearUnlock = percentage >= 80 && percentage < 100;
                      
                      return (
                        <Tooltip key={achievement.title}>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <div
                                className={`
                                  border rounded-xl p-4 transition-all duration-200 hover:scale-105 cursor-pointer flex items-center gap-3 
                                  bg-white/80 dark:bg-gray-900/40 backdrop-blur-sm
                                  shadow-lg hover:shadow-xl
                                  ${achievement.isEarned 
                                    ? 'border-blue-300 dark:border-blue-700 shadow-blue-100/50 dark:shadow-blue-900/20' 
                                    : isNearUnlock
                                      ? 'border-orange-400 dark:border-orange-600 shadow-orange-100/50 dark:shadow-orange-900/20 animate-pulse'
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
                                    <span className="inline-flex items-center gap-1">
                                      <span className="text-amber-500">✨</span>
                                      +{achievement.xp} XP 
                                      {achievement.isRepeatable ? " 🔄" : " 🏆"}
                                    </span>
                                  </p>
                                  
                                  {/* Smart Nudge Label */}
                                  {nudgeText && (
                                    <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full border border-orange-300 dark:border-orange-700">
                                      <p className="text-xs font-medium text-orange-700 dark:text-orange-300 leading-tight">
                                        🎯 {nudgeText}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Progress indicator for near-unlock achievements */}
                              {isNearUnlock && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs z-50 bg-background border shadow-lg">
                            <div className="p-2">
                              {/* Status Badge */}
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm">{achievement.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  achievement.isEarned 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                }`}>
                                  {achievement.isEarned ? 'Unlocked' : 'Locked'}
                                </span>
                              </div>
                              
                              {/* Description */}
                              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                {achievement.description}
                              </p>
                              
                              {/* XP Value */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                                  <span className="text-amber-500">✨</span>
                                  +{achievement.xp} XP
                                </span>
                                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                  {achievement.isRepeatable ? "🔄 Repeatable" : "🏆 One-time"}
                                </span>
                              </div>
                              
                              {/* Date Earned (if unlocked) */}
                              {achievement.isEarned && achievement.dateEarned && (
                                <div className="mb-2">
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    ✅ Earned: {achievement.dateEarned}
                                  </span>
                                </div>
                              )}
                              
                              {/* Progress */}
                              <div className="mb-2">
                                <span className="text-xs text-muted-foreground">
                                  Progress: {achievement.progress}
                                </span>
                              </div>
                              
                              {/* Unlock Hint (if locked) */}
                              {!achievement.isEarned && achievement.unlockHint && (
                                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-start gap-2">
                                    <span className="text-blue-500 text-xs">💡</span>
                                    <span className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                      <strong>How to unlock:</strong> {achievement.unlockHint}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Skill & Performance Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'skill') && getFilteredAchievements(skillAchievements, 'skill').length > 0 && (
            <div className="px-6 pb-8">
              {/* Card Container with Visual Grouping */}
              <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-950/20 dark:to-emerald-950/15 rounded-2xl p-6 border border-green-200/40 dark:border-green-800/40 shadow-xl backdrop-blur-sm">
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
                    {getFilteredAchievements(skillAchievements, 'skill').map((achievement) => {
                      const { percentage, nudgeText } = getAchievementProgress(achievement);
                      const isNearUnlock = percentage >= 80 && percentage < 100;
                      
                      return (
                        <Tooltip key={achievement.title}>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <div
                                className={`
                                  border rounded-xl p-4 transition-all duration-200 hover:scale-105 cursor-pointer flex items-center gap-3 
                                  bg-white/80 dark:bg-gray-900/40 backdrop-blur-sm
                                  shadow-lg hover:shadow-xl
                                  ${achievement.isEarned 
                                    ? 'border-green-300 dark:border-green-700 shadow-green-100/50 dark:shadow-green-900/20' 
                                    : isNearUnlock
                                      ? 'border-orange-400 dark:border-orange-600 shadow-orange-100/50 dark:shadow-orange-900/20 animate-pulse'
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
                                    <span className="inline-flex items-center gap-1">
                                      <span className="text-amber-500">✨</span>
                                      +{achievement.xp} XP 
                                      {achievement.isRepeatable ? " 🔄" : " 🏆"}
                                    </span>
                                  </p>
                                  
                                  {/* Smart Nudge Label */}
                                  {nudgeText && (
                                    <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full border border-orange-300 dark:border-orange-700">
                                      <p className="text-xs font-medium text-orange-700 dark:text-orange-300 leading-tight">
                                        🎯 {nudgeText}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Progress indicator for near-unlock achievements */}
                              {isNearUnlock && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs z-50 bg-background border shadow-lg">
                            <div className="p-2">
                              {/* Status Badge */}
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm">{achievement.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  achievement.isEarned 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                }`}>
                                  {achievement.isEarned ? 'Unlocked' : 'Locked'}
                                </span>
                              </div>
                              
                              {/* Description */}
                              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                {achievement.description}
                              </p>
                              
                              {/* XP Value */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                                  <span className="text-amber-500">✨</span>
                                  +{achievement.xp} XP
                                </span>
                                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                  {achievement.isRepeatable ? "🔄 Repeatable" : "🏆 One-time"}
                                </span>
                              </div>
                              
                              {/* Date Earned (if unlocked) */}
                              {achievement.isEarned && achievement.dateEarned && (
                                <div className="mb-2">
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    ✅ Earned: {achievement.dateEarned}
                                  </span>
                                </div>
                              )}
                              
                              {/* Progress */}
                              <div className="mb-2">
                                <span className="text-xs text-muted-foreground">
                                  Progress: {achievement.progress}
                                </span>
                              </div>
                              
                              {/* Unlock Hint (if locked) */}
                              {!achievement.isEarned && achievement.unlockHint && (
                                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-start gap-2">
                                    <span className="text-blue-500 text-xs">💡</span>
                                    <span className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                      <strong>How to unlock:</strong> {achievement.unlockHint}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          )}

        </div>

        {/* Mobile Achievement Details Dialog */}
        {selectedAchievement && (
          <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-3xl">{selectedAchievement.emoji}</span>
                  {selectedAchievement.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {selectedAchievement.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    +{selectedAchievement.xp} XP
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedAchievement.isEarned 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                  }`}>
                    {selectedAchievement.isEarned ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                {selectedAchievement.progress && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Progress: </span>
                    <span className="font-medium">{selectedAchievement.progress}</span>
                  </div>
                )}
                {selectedAchievement.isEarned && selectedAchievement.dateEarned && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✅ Earned: {selectedAchievement.dateEarned}
                  </div>
                )}
                {!selectedAchievement.isEarned && selectedAchievement.unlockHint && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>💡 How to unlock:</strong> {selectedAchievement.unlockHint}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClbhouzAchievementsModal;