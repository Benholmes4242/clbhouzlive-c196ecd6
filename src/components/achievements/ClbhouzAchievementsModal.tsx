import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

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

  // Body scroll lock for mobile
  useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling on mobile
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Smart scroll detection with direction threshold and debouncing - mobile optimized
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
        
        // Clear existing timers
        if (scrollDebounceTimer.current) {
          clearTimeout(scrollDebounceTimer.current);
        }
        
        // Add debounce for mobile touch events
        scrollDebounceTimer.current = setTimeout(() => {
          // Process any scroll movement for immediate feedback
          if (absScrollDelta < 1) {
            return;
          }
          
          // Determine scroll direction
          const newDirection = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'idle';
          
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
        }, 150); // 150ms debounce for mobile
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
        return <img src="/lovable-uploads/a33df9b4-0089-43ca-913d-132fc5b11cc3.png" alt="20 Club Badge" className="w-16 h-16 md:w-20 md:h-20" />;
      case "50 Club":
        return <img src="/lovable-uploads/c1ba04e8-7aed-40e6-948b-0b65fdc932b2.png" alt="50 Club Badge" className="w-16 h-16 md:w-20 md:h-20" />;
      case "100 Century Club":
        return <img src="/lovable-uploads/91e26115-098d-4b21-9b29-7e1800fe52bd.png" alt="100 Century Club Badge" className="w-16 h-16 md:w-20 md:h-20" />;
      case "200 Clubhouse Elite":
        return <img src="/lovable-uploads/b566e805-826b-4005-b9d1-c5bdc87786b1.png" alt="200 Clubhouse Elite Badge" className="w-16 h-16 md:w-20 md:h-20" />;
      case "300 Club Champion":
        return <img src="/lovable-uploads/dd19d0ff-5931-4ef4-9e00-38e1db6d69a5.png" alt="300 Club Champion Badge" className="w-16 h-16 md:w-20 md:h-20" />;
      // Regional achievement badges with flag images
      case "Lynx Legend":
        return <img src="/lovable-uploads/5971ec53-bcfe-46df-aa24-78df46eaa170.png" alt="Britain & Ireland Flag" className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />;
      case "The Continental Swinger":
        return <img src="/lovable-uploads/27ad4524-d8d9-4750-a4da-21d43d77fb0e.png" alt="European Union Flag" className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />;
      case "Stars and Stripes Tourer":
        return <img src="/lovable-uploads/a8ab2ea7-a98d-4558-bfbc-8a04e60cad37.png" alt="USA Flag" className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />;
      case "Legends Club":
        return <img src="/lovable-uploads/e158428b-772e-4396-859e-1e3d51f2e9b3.png" alt="World Globe" className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />;
      default:
        // Enhanced emoji display with conditional styling
        return (
          <div className={`
            text-2xl md:text-3xl transition-all duration-200 
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
      title: "Lynx Legend",
      emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      isEarned: false,
      description: "Great Britain and Ireland, You've Mastered the Finest Across the British Isles",
      xp: 3000,
      isRepeatable: false,
      progress: "12 / 20 courses",
      unlockHint: "Explore the historic golf courses across England, Scotland, Wales, and Ireland. You're making great progress!"
    },
    {
      title: "The Continental Swinger",
      emoji: "🇪🇺",
      isEarned: false,
      description: "Continental Europe, From Algarve to the Alps, Europe's Elite Courses, Conquered",
      xp: 3000,
      isRepeatable: false,
      progress: "3 / 8 countries",
      unlockHint: "Plan golf trips across Europe. Consider France, Spain, Portugal, Germany, and other European golf destinations."
    },
    {
      title: "Stars and Stripes Tourer",
      emoji: "🇺🇸",
      isEarned: false,
      description: "USA. Coast to Coast you've played the American Greats",
      xp: 3000,
      isRepeatable: false,
      progress: "1 / 10 states",
      unlockHint: "Plan golf trips to different US states. Consider popular golf destinations like Florida, California, or Arizona."
    },
    {
      title: "Legends Club",
      emoji: "🌍",
      isEarned: false,
      description: "World Wide Top 100. From Seve, to Tiger, to Jack, Legends have walked where you now stand. You've joined Golf's most elite circle. Welcome.",
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
      description: "Score 5 eagles total. Elite shot making ability!",
      xp: 200,
      isRepeatable: false,
      progress: "1 / 5 eagles",
      unlockHint: "Look for reachable par 5s and short par 4s. Practice your long game for more eagle opportunities."
    },
    {
      title: "Hole-in-One",
      emoji: "🕳️",
      isEarned: false,
      description: "Achieve the ultimate golf shot - a hole-in-one. Pure golf magic!",
      xp: 500,
      isRepeatable: true,
      progress: "Not achieved",
      unlockHint: "Keep playing par 3s and take aim at the flag. Every golfer dreams of this moment!"
    },
    {
      title: "No Bogey Round",
      emoji: "🎯",
      isEarned: false,
      description: "Complete a full round without any bogeys. Perfect course management!",
      xp: 200,
      isRepeatable: true,
      progress: "Best: 2 bogeys",
      unlockHint: "Focus on course management and conservative play. Sometimes par is your best friend."
    },
    {
      title: "Breaking 80",
      emoji: "🔥",
      isEarned: false,
      description: "Shoot 79 or better. A significant scoring milestone for most golfers!",
      xp: 150,
      isRepeatable: false,
      progress: "Best: 78",
      unlockHint: "You've already achieved this! Make sure to log your rounds to unlock this achievement."
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

  // Add swipe gesture support for mobile navigation
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      // Could implement tab switching here if needed
    },
    onSwipeRight: () => {
      // Could implement tab switching here if needed
    },
    threshold: 50
  });

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
        <div className="h-full flex flex-col"
             style={{ 
               touchAction: 'pan-y',
               overscrollBehavior: 'contain'
             }}>
          
          {/* Header Section with XP Progress - Desktop Colors */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm transition-all duration-400 ease-in-out px-3 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50">
            
            {/* Collapsible XP Progress Header with Smooth Animations */}
            {isCollapsed ? (
              /* Collapsed Mini View */
              <div className="flex items-center justify-between">
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
                      className="p-1 h-6 w-6"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* XP Ring System */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <XPRingSystem 
                      currentXP={totalXP} 
                      size="medium"
                      layout="horizontal"
                      showMiniRings={false}
                    />
                  </div>
                </div>

                {/* Progress Bar */}
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

          {/* Scrollable Content - Fixed Mobile Scroll */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-3 md:p-4 space-y-3 md:space-y-6"
            style={{
              scrollbarWidth: 'thin',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            
            {/* Exploration & Travel Achievements */}
            {(activeFilter === 'all' || activeFilter === 'exploration') && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 text-center justify-center py-2 md:py-3">
                  <div className="text-lg md:text-xl">🗺️</div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Exploration & Travel Achievements
                  </h3>
                </div>
                
                {/* Mobile: 2 badges per row, Desktop: 2-3 badges per row */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement, index) => {
                    const { percentage, nudgeText } = getAchievementProgress(achievement);
                    
                    return (
                      <TooltipProvider key={index}>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <div
                                className={`
                                  border rounded-xl p-3 transition-all duration-200 hover:scale-105 cursor-pointer 
                                  bg-white/80 dark:bg-gray-900/40 backdrop-blur-sm
                                  shadow-lg hover:shadow-xl
                                  ${achievement.isEarned 
                                    ? 'border-green-300 dark:border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600'
                                  }
                                `}
                              >
                                {/* Achievement Badge/Icon - Centered */}
                                <div className="flex justify-center mb-2">
                                  {getAchievementIcon(achievement)}
                                </div>
                                
                                {/* Achievement Details - Centered */}
                                <div className="text-center space-y-1">
                                  <h4 className="font-semibold text-xs md:text-sm text-gray-800 dark:text-gray-200 leading-tight">
                                    {achievement.title}
                                  </h4>
                                  
                                  {achievement.isEarned ? (
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                      <span>✅ Unlocked</span>
                                      {achievement.dateEarned && (
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                          {achievement.dateEarned}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {/* Progress Bar for Unearned Achievements */}
                                      {percentage > 0 && (
                                        <div className="space-y-1">
                                          <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {achievement.progress}
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div 
                                              className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full transition-all duration-700"
                                              style={{ width: `${Math.min(percentage, 95)}%` }}
                                            />
                                          </div>
                                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {percentage.toFixed(0)}%
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Smart Nudge Text */}
                                      {nudgeText && (
                                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-1">
                                          <Sparkles className="h-3 w-3" />
                                          <span className="text-center">{nudgeText}</span>
                                        </div>
                                      )}
                                      
                                      {/* Regular Progress Text */}
                                      {!nudgeText && achievement.progress && !percentage && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {achievement.progress}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* XP Badge */}
                                  <div className="flex justify-center mt-2">
                                    <div className={`
                                      px-2 py-1 rounded-full text-xs font-bold
                                      ${achievement.isEarned 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                      }
                                    `}>
                                      +{achievement.xp} XP
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Repeatable Badge */}
                              {achievement.isRepeatable && (
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                  ♻️
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <div className="space-y-2">
                              <p className="font-semibold">{achievement.title}</p>
                              <p className="text-sm">{achievement.description}</p>
                              {achievement.unlockHint && !achievement.isEarned && (
                                <div className="text-xs text-amber-300 bg-amber-900/20 p-2 rounded border-l-2 border-amber-400">
                                  <strong>Hint:</strong> {achievement.unlockHint}
                                </div>
                              )}
                              <div className="text-xs text-gray-400">
                                Reward: +{achievement.xp} XP {achievement.isRepeatable && '(Repeatable)'}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skill & Performance Achievements */}
            {(activeFilter === 'all' || activeFilter === 'skill') && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 text-center justify-center py-2 md:py-3">
                  <div className="text-lg md:text-xl">🎯</div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Skill & Performance Achievements
                  </h3>
                </div>
                
                {/* Mobile: 2 badges per row, Desktop: 2-3 badges per row */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {getFilteredAchievements(skillAchievements, 'skill').map((achievement, index) => {
                    const { percentage, nudgeText } = getAchievementProgress(achievement);
                    
                    return (
                      <TooltipProvider key={index}>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <div
                                className={`
                                  border rounded-xl p-3 transition-all duration-200 hover:scale-105 cursor-pointer 
                                  bg-white/80 dark:bg-gray-900/40 backdrop-blur-sm
                                  shadow-lg hover:shadow-xl
                                  ${achievement.isEarned 
                                    ? 'border-green-300 dark:border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600'
                                  }
                                `}
                              >
                                {/* Achievement Badge/Icon - Centered */}
                                <div className="flex justify-center mb-2">
                                  {getAchievementIcon(achievement)}
                                </div>
                                
                                {/* Achievement Details - Centered */}
                                <div className="text-center space-y-1">
                                  <h4 className="font-semibold text-xs md:text-sm text-gray-800 dark:text-gray-200 leading-tight">
                                    {achievement.title}
                                  </h4>
                                  
                                  {achievement.isEarned ? (
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                      <span>✅ Unlocked</span>
                                      {achievement.dateEarned && (
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                          {achievement.dateEarned}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {/* Progress Bar for Unearned Achievements */}
                                      {percentage > 0 && (
                                        <div className="space-y-1">
                                          <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {achievement.progress}
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div 
                                              className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full transition-all duration-700"
                                              style={{ width: `${Math.min(percentage, 95)}%` }}
                                            />
                                          </div>
                                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {percentage.toFixed(0)}%
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Smart Nudge Text */}
                                      {nudgeText && (
                                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-1">
                                          <Sparkles className="h-3 w-3" />
                                          <span className="text-center">{nudgeText}</span>
                                        </div>
                                      )}
                                      
                                      {/* Regular Progress Text */}
                                      {!nudgeText && achievement.progress && !percentage && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {achievement.progress}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* XP Badge */}
                                  <div className="flex justify-center mt-2">
                                    <div className={`
                                      px-2 py-1 rounded-full text-xs font-bold
                                      ${achievement.isEarned 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                      }
                                    `}>
                                      +{achievement.xp} XP
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Repeatable Badge */}
                              {achievement.isRepeatable && (
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                  ♻️
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <div className="space-y-2">
                              <p className="font-semibold">{achievement.title}</p>
                              <p className="text-sm">{achievement.description}</p>
                              {achievement.unlockHint && !achievement.isEarned && (
                                <div className="text-xs text-amber-300 bg-amber-900/20 p-2 rounded border-l-2 border-amber-400">
                                  <strong>Hint:</strong> {achievement.unlockHint}
                                </div>
                              )}
                              <div className="text-xs text-gray-400">
                                Reward: +{achievement.xp} XP {achievement.isRepeatable && '(Repeatable)'}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClbhouzAchievementsModal;